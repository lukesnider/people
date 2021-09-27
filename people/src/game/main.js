import { v4 as uuidv4 } from 'uuid';
let k;
export class Game{
    constructor(width,height,user,websocket) {
        this.websocket = websocket;
        this.user = user;
        this.width = width;
        this.height = height;
        this.player;
        this.players = {};
        this.player_speed = 1.5;
        this.bullet_speed = 1200;
        this.Init();
    }
    async Init() {
        let canvas = document.getElementById('people');
        k = await kaboom({
            global: true,
            root: canvas,
            width: this.width,
            height: this.height,
            stretch: true,
            letterbox: true,
            clearColor: [ 255,255,255 ],
        });
        this.LoadSprites();
        this.SetupWebsocket();
        k.mouseClick((c)=>{
            this.BuildStructure({x:k.mouseWorldPos().x,y:k.mouseWorldPos().y},this.player);
        });
        //Shooting other players
        // k.collides("person","bullet", (p,b) => {
        //     if(p.meta.uid != b.meta.player_uid) {
        //         console.log(p.meta,b.meta)
        //         // k.destroy(b);
        //         // k.destroy(p);
        //     }
        // });
    }
    GetPlayerPosition() {
        return this.player.pos;
    }
    SetupWebsocket(){  
        this.websocket.addEventListener("message", (event) => {
            let data = JSON.parse(event.data);
            if(data.joined) {
              this.LoadPlayer(data.joined);
            }
            if(data.people) {
              for(let uid in data.people) {
                if(!this.players[uid]) {
                  this.LoadPlayer(data.people[uid]);
                }
              }
            }
            if(data.structures) {
              for(let uid in data.structures) {
                this.AddStructure(data.structures[uid]);
              }
            //   k.every((obj) => {
            //      console.log(obj.pos)
            // })
            }
            if(data.quit) {
              if(this.players[data.quit.uid]) {
                this.RemovePlayer(data.quit.uid);
              }
            }
            if(data.update_position) {
              this.UpdatePlayerPosition(data);
            }
            if(data.add_structure) {
                this.AddStructure(data.add_structure);
            }
            if(data.add_bullet) {
                this.AddBullet(data.add_bullet);
            }
          })
          this.websocket.addEventListener("open", () => {
              this.websocket.send(JSON.stringify(this.user))
          })
    }
    LoadSprites() {
        k.loadSprite('bullet','bullet.png');
        k.loadSprite('steel','steel.png');
        k.loadSprite('robot','robot.png');
    }
    LoadPlayer(player_data) {
        if(player_data.uid == this.user.uid) {
            this.players[player_data.uid] = k.add([
                k.sprite('robot'),
                k.pos(player_data.position.x,player_data.position.y),
                k.area(),
                // k.solid(),
                "person",
                {meta: player_data}
            ]);
            this.player = this.players[player_data.uid];
            this.PlayerMovement(this.player);
        }else{
            this.players[player_data.uid] = k.add([
                k.sprite('robot'),
                k.pos(player_data.position.x,player_data.position.y),
                k.area(),
                // k.solid(),
                "person",
                {meta: player_data}
            ]);
        }
        this.players[player_data.uid].player_name_text = k.add([
            k.text(player_data.name,{
                size: 12,
                width: 200
            }),
            k.color(rgb(0, 0, 0,1)),
            k.pos(this.ParserPlayerTextPos(this.players[player_data.uid].pos)),
        ]);
    }
    ParserPlayerTextPos(position){
        return {
            x: position.x,
            y: position.y-10,
        }
    }
    RemovePlayer(player_data) {
        k.destroy(this.players[player_data].player_name_text);
        k.destroy(this.players[player_data]);
    }
    PlayerMovement(player) {
        player.action(() => {
            player.pushOutAll();
            k.camPos(player.pos);
            player.player_name_text.pos = this.ParserPlayerTextPos(player.pos);
        });
        k.keyDown("a", () => {
            player.pos.x -= this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("d", () => {
            player.pos.x += this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("w", () => {
            player.pos.y -= this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("s", () => {
            player.pos.y += this.player_speed;
            this.SendMovement(player)
        });
        k.keyPress("space", () => {
            //console.log(player.width,player.height)
            // console.log(k.mousePos().angle())
            //let distance = Math.hypot(k.mousePos().x-player.pos.x, k.mousePos().y-player.pos.y);
            // console.log(distance)
            let move = {
                x: this.bullet_speed*Math.cos(k.mouseWorldPos().angle()),//Math.cos(k.mousePos().angle()*Math.PI/180) + k.mousePos().x,
                y: this.bullet_speed*Math.sin(k.mouseWorldPos().angle()),//Math.sin(k.mousePos().angle()*Math.PI/180) + k.mousePos().y,
            };
            this.BuildBullet(player,player.pos,move);
        });
        k.keyDown("shift", () => {
            this.player_speed = 6;
        });
        k.keyRelease("shift", () => {
            this.player_speed = 1.5;
        });   
    }  
    BuildBullet(player,pos,move) {
        let uid = uuidv4();
        let bullet = k.add([
            k.rect(4, 4),
            k.pos(pos),
            k.area(),
            k.color(0, 0, 0),
            "bullet",
            {
                meta: {
                    uid: uid,
                    player_uid: player.meta.uid,
                    pos:pos,
                },
            },
        ]);
        bullet.action(() => {
            bullet.move(move.x,move.y);
            setTimeout(()=>{k.destroy(bullet)},1000)
        });
        bullet.collides("structure", (s) => {
            k.shake(2);
            k.destroy(bullet);
            k.destroy(s);
        });
        this.websocket.send(JSON.stringify({build_bullet:{uid: uid,player_uid:player.meta.uid,pos:pos,move:move}}))
    }
    AddBullet(bullet) {
        let addbullet = k.add([
            k.rect(4, 4),
            k.pos(bullet.pos),
            k.area(),
            k.color(0, 0, 0),
            "bullet",
            {
                meta: {
                    uid: bullet.uid,
                    player_uid: bullet.player_uid,
                    pos:bullet.pos,
                },
            },
        ]);
        addbullet.action(() => {
            addbullet.move(bullet.move.x,bullet.move.y);
            setTimeout(()=>{k.destroy(addbullet)},1000)
        });
    }
    BuildStructure(pos,player) {
        let uid = uuidv4();
        k.add([
            k.sprite('steel'),
            k.pos(pos),
            k.area(),
            k.solid(),
            k.scale(2),
            "structure",
            {
                player: player.meta.uid,
                uid: uid,
            },
        ]);
        this.websocket.send(JSON.stringify({build_structure:{uid: uid,player_uid:player.meta.uid,pos: pos}}))
    }
    AddStructure(structure) {
        k.add([
            k.sprite('steel'),
            k.pos(structure.pos),
            k.area(),
            k.solid(),
            k.scale(2),
            "structure",
            {
                player: structure.player,
                uid: structure.uid,
            },
        ]);
    }
    SendMovement(player) {
        this.websocket.send(JSON.stringify({update_position:{uid:this.user.uid,position:player.pos}}))
    }
    UpdatePlayerPosition(data) {
        if(data.update_position.uid != this.user.uid) {
            this.players[data.update_position.uid].pos = data.update_position.position;
            this.players[data.update_position.uid].player_name_text.pos = this.ParserPlayerTextPos(data.update_position.position);
        }
        // people.value[data.update_position.uid].position = data.update_position.position;
    }
}