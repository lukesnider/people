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
        this.bullet_speed = 620;
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
            clearColor: [ 255,255,255,255 ],
        });
        this.LoadSprites();
        this.SetupWebsocket();
        k.action("bullet", (b) => {
            b.move(b.direction.x,b.direction.y);
            //b.move(0, -this.bullet_speed);
            setTimeout(()=>{k.destroy(b)},1000)
        });
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
          })
          this.websocket.addEventListener("open", () => {
              this.websocket.send(JSON.stringify(this.user))
          })
    }
    LoadSprites() {
        k.loadSprite('bullet','bullet.png');
        k.loadSprite('steel','steel.png');
        k.loadSprite('people','people.png',{
            sliceX: 2,
            sliceY: 1,
            anims: {
                man: { from: 1, to: 1 },
                woman: { from: 2, to: 2 }
            }
        });
    }
    LoadPlayer(player_data) {
        if(player_data.uid == this.user.uid) {
            this.players[player_data.uid] = k.add([
                k.sprite('people'),
                k.pos(player_data.position.x,player_data.position.y),
                k.area(),
                "person",
                {meta: player_data}
            ]);
            this.PlayerMovement(this.players[player_data.uid]);
            this.player = this.players[player_data.uid];
        }else{
            this.players[player_data.uid] = k.add([
                k.sprite('people'),
                k.pos(player_data.position.x,player_data.position.y),
                k.area(),
                "person",
                {meta: player_data}
            ]);
        }
        this.players[player_data.uid].player_name_text = k.add([
            k.text(player_data.name, 8,{
                width: 200
            }),
            k.color(rgba(0, 0, 0,1)),
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
        k.keyDown("left", () => {
            if (!k.keyIsDown("d")) {
                player.pos.x -= this.player_speed;
                this.SendMovement(player)
            }
        });    
        k.keyDown("right", () => {
            if (!k.keyIsDown("d")) {
                player.pos.x += this.player_speed;
                this.SendMovement(player)
            }
        });    
        k.keyDown("up", () => {
            if (!k.keyIsDown("d")) {
                player.pos.y -= this.player_speed;
                this.SendMovement(player)
            }
        });    
        k.keyDown("down", () => {
            if (!k.keyIsDown("d")) {
                player.pos.y += this.player_speed;
                this.SendMovement(player)
            }
        });
        k.keyDown("d", () => {
            if (k.keyIsPressed("right")) {
                this.BuildStructure({x:player.pos.x + 50,y:player.pos.y+15},player)
            }
            if (k.keyIsPressed("left")) {
                this.BuildStructure({x:player.pos.x - 25,y:player.pos.y+15},player)
            }
            if (k.keyIsPressed("up")) {
                this.BuildStructure({x:player.pos.x + 15,y:player.pos.y - 25},player)
            }
            if (k.keyIsPressed("down")) {
                this.BuildStructure({x:player.pos.x + 15,y:player.pos.y + 50},player)
            }
        });
        // only trigger once when the user presses
        k.keyPress("space", () => {
            if (k.keyIsDown("right")) {
                this.BuildBullet(player,{x:+this.bullet_speed,y:0});
            }
            if (k.keyIsDown("left")) {
                this.BuildBullet(player,{x:-this.bullet_speed,y:0});
            }
            if (k.keyIsDown("up")) {
                this.BuildBullet(player,{x:0,y:-this.bullet_speed});
            }
            if (k.keyIsDown("down")) {
                this.BuildBullet(player,{x:0,y:+this.bullet_speed});
            }
        });
    }
    BuildBullet(player,direction) {
        let uid = uuidv4();
        k.add([
            rect(4, 4),
            area(),
            pos(player.pos),
            origin("center"),
            color(0, 0, 1),
            "bullet",
            {
                uid: uid,
                direction:direction,
            },
        ]);
        // bullet.collides("structure", (s) => {
        //     console.log(s)
        //     // k.destroy(b);
        //     // k.destroy(s);
        // });
        this.websocket.send(JSON.stringify({build_bullet:{uid: uid,player_uid:player.meta.uid,direction:direction}}))
    }
    BuildStructure(pos,player) {
        let uid = uuidv4();
        k.add([
            k.sprite('steel'),
            k.pos(pos),
            k.area(),
            k.scale(2),
            k.solid(),
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
            k.scale(2),
            k.solid(),
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