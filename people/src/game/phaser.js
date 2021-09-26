let k;
export class Game{
    constructor(width,height,user,websocket) {
        this.websocket = websocket;
        this.user = user;
        this.width = width;
        this.height = height;
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
}