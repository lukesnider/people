// import jwt from "@tsndr/cloudflare-worker-jwt";
import webpush from 'web-push';

const corsHeaders = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
}
var publicVapidKey = 'BHNDnILTEvKcwYFfIhyOGoxecSf4wjoIEL-8EbyO-0scqnrCwNjR5uEPpz4utoAXjucSizX2Fa8VNgsIwMF5HF0';
var privateVapidKey  = 'zyCG8N9os8-3qMEmeVWt2gBd3c1-bbpaI1MXfEWTg_o';
// Worker
export default {
  async fetch(request, env) {
    webpush.setVapidDetails(
      'mailto:sniderwebdev@gmail.com',
      publicVapidKey,
      privateVapidKey,
    );
    return await handleRequest(request, env);
  }
}
async function handleRequest(request, env) {
  try {
    let id = env.PEOPLE.idFromName("Meeting Hall");
    let obj = env.PEOPLE.get(id);
    const upgradeHeader = request.headers.get("Upgrade")
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      if(request.headers.get("Notifications")){
        if (request.method.toUpperCase() === "POST") {
          let response = await obj.HandleNotificationSubscription(request);
          return response;
        }
        if (request.method.toUpperCase() === "GET") {
          let response = await obj.HandleNotificationBroadcast(request);
          return response;
        }
      }
      return new Response("Expected Upgrade: websocket", { status: 426 })
    }
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
    this.sessions =  [];
    this.people = {};
    this.positions = {};
    this.stats = {};
    this.structures = {};
    this.chat_messages = [];
    this.subscriptions = [];
    this.state.blockConcurrencyWhile(async () => {
        let stored_structures= await this.state.storage.get("structures");
        this.structures = stored_structures || {};
        let stored_stats= await this.state.storage.get("stats");
        this.stats = stored_stats || {};
        let stored_positions= await this.state.storage.get("positions");
        this.positions = stored_positions || [];
        let chat_messages_stored = await this.state.storage.get("chat_messages");
        this.chat_messages = chat_messages_stored || [];

        let subscriptions_stored = await this.state.storage.get("subscriptions");
        this.subscriptions = subscriptions_stored || [];
    })
  }
  async HandleNotificationSubscription(request) {
    const subscription = JSON.stringify(await request.json())
    this.subscriptions.push(subscription);
    await this.state.storage.put("subscriptions", this.subscriptions);
    return new Response("You have been subscribed", { status: 200 })
  }
  async HandleNotificationBroadcast(request) {
    try {
      const notification = { title: 'Hey, this is a push notification!' };
      this.subscriptions.forEach((subscription) => {
        webpush.sendNotification(subscription, JSON.stringify(notification))
      });
      return new Response("Message Sent!", { status: 200 })
    } catch (e) {
      return new Response(e.message, { status: 200 })
    }
  }
  // Handle HTTP requests from clients.
  async fetch(request) {

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
      if(!receivedUserInfo){
        session.name = "" + (data.name || "anonymous");
        session.uid = data.uid;
        if(!this.positions[data.uid]) {
          this.positions[data.uid] = {
            x: Math.random() * (500 - -500) + -500,
            y: Math.random() * (500 - -500) + -500,
          }
        }
        if(!this.stats[data.uid]) {
          this.stats[data.uid] = {
            name: data.name,
            structures: {
              built: 0,
              destroyed: 0,
            },
            kills: [],
            deaths: [],
          };
        }
        data.position = this.positions[data.uid];
        //await this.state.storage.put("stats", this.stats);
        this.people[data.uid] = data;
        this.broadcast(JSON.stringify({joined: data}));
        webSocket.send(JSON.stringify({people: this.people}));
        webSocket.send(JSON.stringify({structures: this.structures}));
        webSocket.send(JSON.stringify({stats_update: this.stats}));
        webSocket.send(JSON.stringify({chat_messages: this.chat_messages}));
        receivedUserInfo = true;
        return new Response(null, {
          status: 101,
          webSocket: client
        })
      }
      if(data.chat_message) {
        this.broadcast(JSON.stringify({chat_message:data.chat_message}),session.uid);
        this.chat_messages.push(data.chat_message);
        if(this.chat_messages.length > 100) this.chat_messages.shift();
        return;
      }
      if(data.update_position) {
        this.people[data.update_position.uid].position = data.update_position.position;
        this.positions[data.update_position.uid] = data.update_position.position;
        this.broadcast(JSON.stringify(data));
        return;
      }
      if(data.build_structure) {
        let structure = {
          uid: data.build_structure.uid,
          player: data.build_structure.player_uid,
          pos: data.build_structure.pos,
        };
        this.structures[structure.uid] = structure;
        this.stats[data.build_structure.player_uid].structures.built = this.stats[data.build_structure.player_uid].structures.built + 1;
        this.broadcast(JSON.stringify({add_structure:structure}),session.uid);
        this.broadcast(JSON.stringify({stats_update:this.stats}));
        await this.state.storage.put("structures", this.structures);
        return;
      }
      if(data.destroy_structure) {
        delete this.structures[data.destroy_structure.uid];
        this.stats[data.destroy_structure.player_uid].structures.destroyed = this.stats[data.destroy_structure.player_uid].structures.destroyed + 1;
        this.broadcast(JSON.stringify({destroy_structure:data.destroy_structure}),session.uid);
        this.broadcast(JSON.stringify({stats_update:this.stats}));
        await this.state.storage.put("structures", this.structures);
        return;
      }
      if(data.build_bullet) {
        let bullet = {
          uid: data.build_bullet.uid,
          player_uid: data.build_bullet.player_uid,
          player_uid: data.build_bullet.player_uid,
          pos: data.build_bullet.pos,
          move: data.build_bullet.move,
        };
        this.broadcast(JSON.stringify({add_bullet:bullet}),session.uid);
        return;
      }
      if(data.player_hit) {
        let shooter = data.player_hit.shooter;
        let hit = data.player_hit.hit;
        let kill =  {
          timestampe: Date.now(),
          player: hit.uid,
        }
        this.stats[shooter.uid].kills.push(kill)
        this.stats[hit.uid].deaths.push(kill)
        this.broadcast(JSON.stringify({kill:data.player_hit}));
        this.broadcast(JSON.stringify({stats_update:this.stats}));
        this.positions[hit.uid] = {
          x: Math.random() * (500 - -500) + -500,
          y: Math.random() * (500 - -500) + -500,
        }
        await this.state.storage.put("stats", this.stats);
        return;
      }
      if(data.respawn) {
        this.positions[data.respawn.uid] = {
          x: Math.random() * (500 - -500) + -500,
          y: Math.random() * (500 - -500) + -500,
        }
        data.respawn.position = this.positions[data.respawn.uid];
        data.respawn.unfreeze = true;
        this.broadcast(JSON.stringify({respawn: data.respawn}));
        return;
      }

      data = { name: session.name, message: "" + data.message };
      data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
      this.lastTimestamp = data.timestamp;
      let dataStr = JSON.stringify(data);
      this.broadcast(dataStr);
    })
    let closeOrErrorHandler = async (evt) => {
      await this.state.storage.put("structures", this.structures);
      await this.state.storage.put("stats", this.stats);
      await this.state.storage.put("positions", this.positions);
      await this.state.storage.put("chat_messages", this.chat_messages);
      session.quit = true;
      this.sessions = this.sessions.filter(member => member !== session);
      if (session.name) {
        this.stats[session.uid].name = session.name;
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
  broadcast(message,others = false) {
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }
    let quitters = [];
    this.sessions = this.sessions.filter(session => {
      try {
        if(others && session.uid != others) {
          session.webSocket.send(message);
        }
        if(!others) {
          session.webSocket.send(message);
        }
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
