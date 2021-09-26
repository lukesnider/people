// import jwt from "@tsndr/cloudflare-worker-jwt";
const corsHeaders = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
}
// Worker
export default {
  async fetch(request, env) {
    return await handleRequest(request, env);
  }
}

async function handleRequest(request, env) {
  try {
    const upgradeHeader = request.headers.get("Upgrade")
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 })
    }
    let id = env.PEOPLE.idFromName("Meeting Hall");
    let obj = env.PEOPLE.get(id);
    let response = await obj.fetch(request);
    return response;
  } catch(error) {
    return new Response(error.message, {
      status: 200,
    })
  }
}
// Durable Object

export class People {
  constructor(state, env) {
    this.state = state;
    this.people = {};
    this.state.blockConcurrencyWhile(async () => {
        let stored_sessions= await this.state.storage.get("sessions");
        this.sessions = stored_sessions || [];
    })
  }
  // Handle HTTP requests from clients.
  async fetch(request) {
    // let auth_email=false,decoded=false;
    // const url = new URL(request.url)
    // let jwt_token = url.searchParams.get("token");
    // try {
    //   let isValid = await jwt.verify(jwt_token,USER_PW_SECRET);
    //   if(!isValid) {
    //     return new Response("Invalid Token", {
    //       headers: corsHeaders,
    //       status: 403,
    //     })
    //   }
    //   decoded = await jwt.decode(jwt_token);
    //   auth_email = decoded.email;
    // } catch(err) {
    //   return new Response(err.message, {
    //     headers: corsHeaders,
    //     status: 403,
    //   })
    // }
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    let webSocket = server
    webSocket.accept()
    let session = {webSocket};
    let receivedUserInfo = false;
    this.sessions.push(session);
    webSocket.addEventListener("message", async msg => {
      if (session.quit) {
        webSocket.close(1011, "WebSocket broken.");
        delete this.people[session.uid];
        return;
      }
      let data = JSON.parse(msg.data);
      if(data.update_position) {
        this.people[data.update_position.uid].position = data.update_position.position;
        this.broadcast(JSON.stringify(data));
      }
      if(!receivedUserInfo){
        session.name = "" + (data.name || "anonymous");
        session.uid = data.uid;
        if(!data.position) data.position = {x:50,y:50};
        this.people[data.uid] = data;
        this.broadcast(JSON.stringify({joined: data}));
        webSocket.send(JSON.stringify({people: this.people}));
        receivedUserInfo = true;
        return new Response(null, {
          status: 101,
          webSocket: client
        })
      }
      data = { name: session.name, message: "" + data.message };
      data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
      this.lastTimestamp = data.timestamp;
      let dataStr = JSON.stringify(data);
      this.broadcast(dataStr);
    })
    let closeOrErrorHandler = evt => {
      session.quit = true;
      this.sessions = this.sessions.filter(member => member !== session);
      if (session.name) {
        this.broadcast(JSON.stringify({quit: session}));
        delete this.people[session.uid];
      }
    };
    webSocket.addEventListener("close", closeOrErrorHandler);
    webSocket.addEventListener("error", closeOrErrorHandler);
    return new Response(null, {
      // headers: {
      //   "ERRORLOG": auth_email
      // },
      status: 101,
      webSocket: client
    })
  }
  broadcast(message) {
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }
    let quitters = [];
    this.sessions = this.sessions.filter(session => {
      try {
        session.webSocket.send(message);
        return true;
      } catch (err) {
        session.quit = true;
        quitters.push(session);
        return false;
      }
    });
    quitters.forEach(quitter => {
      this.broadcast({quit: quitter});
    });
  }

}
