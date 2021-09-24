//import kaboom from '../../node_modules/kaboom/dist/kaboom'
let k;
export class Game{
    constructor(width,height) {
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
        this.LoadPlayer();
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
    LoadPlayer() {
        k.add([
            k.sprite('people'),
            k.origin('center'),
            k.pos(50,50),
            k.area(),
            k.solid(),
            "person",
        ]);
        // k.add([
        //     k.pos(50, 50),
        //     k.rect(50, 50),
        //     k.solid()
        // ])
    }
}