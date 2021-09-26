let k;
export class Game{
    constructor(width,height,user,websocket) {
        this.websocket = websocket;
        this.user = user;
        this.width = width;
        this.height = height;
        this.player;
        this.players = {};
        this.player_speed = 1;
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
            if(data.quit) {
              if(this.players[data.quit.uid]) {
                this.RemovePlayer(data.quit.uid);
              }
            }
            if(data.update_position) {
              this.UpdatePlayerPosition(data);
            }
          })
          this.websocket.addEventListener("open", () => {
              this.websocket.send(JSON.stringify(this.user))
          })
    }
    LoadSprites() {
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
                k.solid(),
                "person",
                {player_data: player_data}
            ]);
            this.PlayerMovement(this.players[player_data.uid]);
        }else{
            this.players[player_data.uid] = k.add([
                k.sprite('people'),
                k.pos(player_data.position.x,player_data.position.y),
                k.area(),
                k.solid(),
                "person",
                {player_data: player_data}
            ]);
        }
        this.players[player_data.uid].player_name_text = k.add([
            k.text(player_data.name, 12,{
                width: 120
            }),
            k.color(rgba(0, 0, 0,1)),
            k.pos(this.ParserPlayerTextPos(this.players[player_data.uid].pos)),
        ]);
    }
    ParserPlayerTextPos(position){
        return {
            x: position.x,
            y: position.y-25,
        }
    }
    RemovePlayer(player_data) {
        k.destroy(this.players[player_data].player_name_text);
        k.destroy(this.players[player_data]);
    }
    PlayerMovement(player) {
        player.action(() => {
            k.camPos(player.pos);
            player.player_name_text.pos = this.ParserPlayerTextPos(player.pos);
        });
        k.keyDown("left", () => {
            player.pos.x -= this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("right", () => {
            player.pos.x += this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("up", () => {
            player.pos.y -= this.player_speed;
            this.SendMovement(player)
        });    
        k.keyDown("down", () => {
            player.pos.y += this.player_speed;
            this.SendMovement(player)
        });
        // k.clicks("person", (c) => {
        // });
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