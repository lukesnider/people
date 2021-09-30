var t={fetch:async(t,s)=>await async function(t,s){try{const e=t.headers.get("Upgrade");if(!e||"websocket"!==e)return new Response("Expected Upgrade: websocket",{status:426});let i=s.PEOPLE.idFromName("Meeting Hall"),a=s.PEOPLE.get(i);return await a.fetch(t)}catch(t){return new Response(t.message,{status:200})}}(t,s)};class s{constructor(t,s){this.state=t,this.sessions=[],this.people={},this.positions={},this.stats={},this.structures={},this.state.blockConcurrencyWhile((async()=>{let t=await this.state.storage.get("structures");this.structures=t||{};let s=await this.state.storage.get("stats");this.stats=s||{};let e=await this.state.storage.get("positions");this.positions=e||[]}))}async fetch(t){const s=new WebSocketPair,[e,i]=Object.values(s);let a=i;a.accept();let r={webSocket:a},u=!1;this.sessions.push(r),a.addEventListener("message",(async t=>{if(r.quit)return a.close(1011,"WebSocket broken."),void delete this.people[r.uid];let s=JSON.parse(t.data);if(s.chat_message)return void this.broadcast(JSON.stringify({chat_message:s.chat_message}),r.uid);if(s.update_position)return this.people[s.update_position.uid].position=s.update_position.position,this.positions[s.update_position.uid]=s.update_position.position,void this.broadcast(JSON.stringify(s));if(s.build_structure){let t={uid:s.build_structure.uid,player:s.build_structure.player_uid,pos:s.build_structure.pos};return this.structures[t.uid]=t,this.stats[s.build_structure.player_uid].structures.built=this.stats[s.build_structure.player_uid].structures.built+1,this.broadcast(JSON.stringify({add_structure:t}),r.uid),this.broadcast(JSON.stringify({stats_update:this.stats})),void await this.state.storage.put("structures",this.structures)}if(s.destroy_structure)return delete this.structures[s.destroy_structure.uid],this.stats[s.destroy_structure.player_uid].structures.destroyed=this.stats[s.destroy_structure.player_uid].structures.destroyed+1,this.broadcast(JSON.stringify({destroy_structure:s.destroy_structure}),r.uid),this.broadcast(JSON.stringify({stats_update:this.stats})),void await this.state.storage.put("structures",this.structures);if(s.build_bullet){let t={uid:s.build_bullet.uid,player_uid:s.build_bullet.player_uid,player_uid:s.build_bullet.player_uid,pos:s.build_bullet.pos,move:s.build_bullet.move};return void this.broadcast(JSON.stringify({add_bullet:t}),r.uid)}if(s.player_hit){let t=s.player_hit.shooter,e=s.player_hit.hit,i={timestampe:Date.now(),player:e.uid};return this.stats[t.uid].kills.push(i),this.stats[e.uid].deaths.push(i),this.broadcast(JSON.stringify({kill:s.player_hit})),this.broadcast(JSON.stringify({stats_update:this.stats})),this.positions[e.uid]={x:1e3*Math.random()-500,y:1e3*Math.random()-500},void await this.state.storage.put("stats",this.stats)}if(!u)return r.name=""+(s.name||"anonymous"),r.uid=s.uid,this.positions[s.uid]||(this.positions[s.uid]={x:1e3*Math.random()-500,y:1e3*Math.random()-500}),this.stats[s.uid]||(this.stats[s.uid]={name:s.name,structures:{built:0,destroyed:0},kills:[],deaths:[]}),s.position=this.positions[s.uid],await this.state.storage.put("stats",this.stats),this.people[s.uid]=s,this.broadcast(JSON.stringify({joined:s})),a.send(JSON.stringify({people:this.people})),a.send(JSON.stringify({structures:this.structures})),a.send(JSON.stringify({stats_update:this.stats})),u=!0,new Response(null,{status:101,webSocket:e});s={name:r.name,message:""+s.message},s.timestamp=Math.max(Date.now(),this.lastTimestamp+1),this.lastTimestamp=s.timestamp;let i=JSON.stringify(s);this.broadcast(i)}));let o=async t=>{await this.state.storage.put("structures",this.structures),await this.state.storage.put("stats",this.stats),await this.state.storage.put("positions",this.positions),r.quit=!0,this.sessions=this.sessions.filter((t=>t!==r)),r.name&&(this.stats[r.uid].name=r.name,this.broadcast(JSON.stringify({quit:r})),delete this.people[r.uid])};return a.addEventListener("close",o),a.addEventListener("error",o),new Response(null,{status:101,webSocket:e})}broadcast(t,s=!1){"string"!=typeof t&&(t=JSON.stringify(t));let e=[];this.sessions=this.sessions.filter((i=>{try{return s&&i.uid!=s&&i.webSocket.send(t),s||i.webSocket.send(t),!0}catch(t){return i.quit=!0,e.push(i),!1}})),e.forEach((t=>{this.broadcast({quit:t})}))}}export{s as People,t as default};
//# sourceMappingURL=index.mjs.map
