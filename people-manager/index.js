var jwt = require('jsonwebtoken');
//var md5 = require('md5');
var { uuid } = require('uuidv4');

const corsHeaders = {
  "content-type": "application/json;charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
}
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  if(!url.searchParams.get("jwt")) {
    return new Response("Access Denied", {
      headers: corsHeaders,
      status: 403,
    })
  }
  let jwt_token = url.searchParams.get("jwt");
  var data = false
  var message = false
  try {
    data = await jwt.verify(jwt_token,JWT_SECRET)
  } catch(err) {
    message = err.message
  }
  if(!data){
    return new Response("Access Denied", {
      headers: corsHeaders,
      status: 403,
    })
  }
  let response_data = {status:"INCOMPLETE"};
  switch(data.type) {
    case "LOGIN":
      response_data = await handleLogin(data,response_data);
      break;
    case "CHECK":
      if(!url.searchParams.get("token")) {
        return new Response("Access Denied", {
          headers: corsHeaders,
          status: 403,
        })
      }
      data.token = url.searchParams.get("token");
      response_data = await handleCheck(data,response_data);
      break;
    case "UPDATE":
      if(!url.searchParams.get("token")) {
        return new Response("Access Denied", {
          headers: corsHeaders,
          status: 403,
        })
      }
      data.token = url.searchParams.get("token");
      data.form = await request.text();
      response_data = await handleUpdate(data,response_data);
      break;
    case "REGISTER":
      response_data = await handleRegister(data,response_data);
      break;
    case "LOGOUT":
      response_data = await handleLogout(data,response_data);
      break;
    default:
      response_data.status = "OK";
      response_data.message = "nothing doing";
  }
  let json = JSON.stringify(response_data);
  return new Response(json, {
    headers: corsHeaders,
  });
}

async function handleUpdate(data,response) {
  response.status = "INCOMPLETE";
  try {
    if(!data.token){
      response.status = "TOKEN-VALIDATION";
      response.message = "Missing required authentication token";
      return response;
    }
    let verify_token = await jwt.verify(data.token,USER_PW_SECRET)
    if(!verify_token) {
      response.status = "TOKEN-VALIDATION";
      response.message = verify_token.message;
      return response;
    }
    let email = verify_token.email;
    let user_info = JSON.parse(data.form).user
    await PEOPLE.put(email,JSON.stringify(user_info));
    response.status = "UPDATE-SUCCESS";
    response.message = "Successfully updated."
  } catch(err) {
    response.message = err.message
  }
  return response;
}

async function handleLogin(data,response) {
  response.status = "INCOMPLETE"
  var user_pw_hash = await PEOPLE.get(`login-${data.email}`);
  if(!user_pw_hash) {
    response.status = "NO-USER";
    response.message = "No User Found";
    return response;
  }
  if(user_pw_hash == data.password) {
    response.status = "LOGGED-IN";
    response.message = "Logged In";
    response.person =  await PEOPLE.get(`${data.email}`);
    response.token = await jwt.sign({email:data.email,exp:Math.floor(Date.now() / 1000) + (60 * 120)}, USER_PW_SECRET);
  }else{
    response.status = "INCORRECT-PASSWORD";
    response.message = "Password or Email was incorrect."
  }
  return response;
}
async function handleCheck(data,response) {
  response.status = "INCOMPLETE";
  try {
    if(!data.token){
      response.status = "TOKEN-VALIDATION";
      response.message = "Missing required authentication token";
      return response;
    }
    let verify_token = await jwt.verify(data.token,USER_PW_SECRET)
    if(!verify_token) {
      response.status = "TOKEN-VALIDATION";
      response.message = verify_token.message;
      return response;
    }
    response.person =  await PEOPLE.get(`${verify_token.email}`);
    response.token = await jwt.sign({email:verify_token.email,exp:Math.floor(Date.now() / 1000) + (60 * 120)}, USER_PW_SECRET);
    response.status = "CHECK-SUCCESS";
    response.message = "Successfully checked."
  } catch(err) {
    response.message = err.message
  }
  return response;
}
async function handleRegister(data,response) {
  //var secret = await ADMIN.get(`login-${data.email}`)
  if(!data.name || data.name.trim() == "") {
    response.status = "VALIDATION-ERROR";
    response.message = "Incorrect Name value";
    return response;
  }
  if(!data.email || data.email.trim() == "") {
    response.status = "VALIDATION-ERROR";
    response.message = "Incorrect Email value";
    return response;
  }
  if(!data.password || data.password.trim() == "") {
    response.status = "VALIDATION-ERROR";
    response.message = "Incorrect Password value";
    return response;
  }
  let user_pw_hash = data.password;
  let user_info = {
    version: "0.1.0",
    uid: uuid(),
    name: data.name,
    email: data.email,
    position: {
      x: 60,
      y: 60,
    }
  };
  await PEOPLE.put(`login-${data.email}`,user_pw_hash);
  await PEOPLE.put(data.email,JSON.stringify(user_info));
  response.status = 'LOGGED-IN';
  response.message = 'logged in';
  response.user = user_info;
  response.token = await jwt.sign({email:data.email,exp:Math.floor(Date.now() / 1000) + (60 * 120)}, USER_PW_SECRET);
  return response;
}
async function handleLogout(data,response) {
  //var secret = await ADMIN.get(`login-${data.email}`)

}