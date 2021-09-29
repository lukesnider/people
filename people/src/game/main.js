import { v4 as uuidv4 } from 'uuid';
let k;
export class Game{
    constructor(width,height,user,websocket,vue) {
        this.vue = vue;
        this.websocket = websocket;
        this.user = user;
        this.width = width;
        this.height = height;
        this.player;
        this.player_frozen = true;
        this.players = {};
        this.player_speed = 1.5;
        this.bullet_speed = 1200;
        this.load_timeout = 3000;
        this.action_mode = "shoot";
        this.Init();
    }
    async Init() {
        let canvas = document.getElementById('people');
        k = await kaboom({
            global: true,
            root: canvas,
            stretch: true,
            letterbox: true,
            background: [ 255, 255, 255, ],
        });
        this.LoadSprites();
        this.SetupWebsocket();
        k.mouseClick(()=>{
            if(this.action_mode == "shoot") {
                if(!this.player_frozen) this.Shoot();
            }
            if(this.action_mode == "build") {
                if(!this.player_frozen) this.BuildStructure({x:k.mouseWorldPos().x,y:k.mouseWorldPos().y},this.player);
            }
        });
        k.keyPress("k",()=>{
            this.vue.toggleKD();
        });
        let that = this
        setTimeout(() => {
            this.TempText("You're ready to go!");
            that.player_frozen = false;
            k.focus();
        },this.load_timeout)
    }
    TempText(text) {
        let temp_text = k.add([
            k.text(text,{
                size: 10,
                width: 200
            }),
            k.z(50),
            k.color(rgb(0, 0, 0,1)),
            k.pos({x:this.player.pos.x,y:this.player.pos.y-100}),
            k.wait(.5,() => {
                k.destroy(temp_text);
            }),
        ]);
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
            if(data.kill) {
                this.ProcessKill(data.kill);
            }
            if(data.kd_update) {
                this.UpdateKillDeath(data.kd_update);
            }
            if(data.destroy_structure) {
                this.DestroyStructure(data.destroy_structure);
            }
          })
          this.websocket.addEventListener("open", () => {
              this.websocket.send(JSON.stringify(this.user))
          })
    }
    UpdateKillDeath(kd) {
        this.vue.kd = kd;
    }
    ProcessKill(data) {
        let player_last_position = this.players[data.hit.uid].pos;
        let kill_text = k.add([
            text("DEAD",{
                size: 12,
                width: 200
            }),
            color(rgb(0, 0, 0,1)),
            pos(player_last_position),
            wait(2,() => {
                destroy(kill_text);
            }),
        ]);
        this.RemovePlayer(data.hit.uid);
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
        delete this.players[player_data];
    }
    PlayerMovement(player) {
        player.action(() => {
            player.pushOutAll();
            k.camPos(player.pos);
            player.player_name_text.pos = this.ParserPlayerTextPos(player.pos);
        });
        k.keyDown("a", () => {
            this.SendMovement(player,{x:player.pos.x - this.player_speed,y: player.pos.y})
        });    
        k.keyDown("d", () => {
            this.SendMovement(player,{x:player.pos.x + this.player_speed,y: player.pos.y})
        });    
        k.keyDown("w", () => {
            this.SendMovement(player,{x:player.pos.x,y: player.pos.y - this.player_speed})
        });    
        k.keyDown("s", () => {
            this.SendMovement(player,{x:player.pos.x,y: player.pos.y + this.player_speed})
        }); 
        k.keyPress("q", () => {
            this.action_mode = "build";
        });
        k.keyPress("e", () => {
            this.action_mode = "shoot";
        });
        k.keyDown("shift", () => {
            this.player_speed = 6;
        });
        k.keyRelease("shift", () => {
            this.player_speed = 1.5;
        });   
    }  
    Shoot() {
        let mouse = k.mousePos();
        let player_pos = k.center();

        let dirX = mouse.x - player_pos.x
        let dirY = mouse.y - player_pos.y
        let magnitude = Math.sqrt(dirX*dirX + dirY*dirY)
        dirX = dirX/magnitude;
        dirY = dirY/magnitude;
        let bulletVelocity = {};
        bulletVelocity.x =  dirX*this.bullet_speed
        bulletVelocity.y = dirY*this.bullet_speed
        let move = bulletVelocity
        this.BuildBullet(this.player,this.player.pos,move);
    }
    BuildBullet(player,pos,move) {
        if(this.player_frozen) return;
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
            this.websocket.send(JSON.stringify({destroy_structure:{uid:s.uid}}))
            k.shake(2);
            k.destroy(bullet);
            k.destroy(s);
        });
        bullet.collides("person", (p) => {
            if(p.meta.uid != this.player.meta.uid) {
                k.destroy(bullet);
                this.websocket.send(JSON.stringify({player_hit:{shooter: this.player.meta,hit:p.meta}}))
            }
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
        addbullet.collides("person", (p) => {
            k.destroy(addbullet);
            this.player_frozen = true;
        });
    }
    BuildStructure(pos,player) {
        if(this.player_frozen) return;
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
    DestroyStructure(structure) {
        every((obj) => {
            if(obj.uid && obj.uid == structure.uid) {
                k.destroy(obj);
            }
        });
    }
    SendMovement(player,pos) {
        if(this.player_frozen) return;
        player.pos.x = pos.x;
        player.pos.y = pos.y;
        this.websocket.send(JSON.stringify({update_position:{uid:this.user.uid,position:player.pos}}))
    }
    UpdatePlayerPosition(data) {
        if(data.update_position.uid != this.user.uid) {
            this.players[data.update_position.uid].pos.x = data.update_position.position.x;
            this.players[data.update_position.uid].pos.y = data.update_position.position.y;
            this.players[data.update_position.uid].player_name_text.pos = this.ParserPlayerTextPos(data.update_position.position);
        }
    }
}