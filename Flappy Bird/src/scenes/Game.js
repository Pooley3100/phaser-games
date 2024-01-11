import Phaser from '../lib/phaser.js';

const scale = 1;

export default class Game extends Phaser.Scene{
    /** @type {Phaser.Physics.Arcade.Sprite} */
    player;
    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursosrs;
    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    pipes;
    /** @type {Phaser.Physics.Arcade.StaticImage} */
    base;

    pipeHeight;
    pipePosition;
    gap;
    basePosition;
    gameOver;
    scorePipes;
    score;
    scoreText;
    
    constructor(){
        super('game');
    }

    preload(){
        this.load.image('background-day', 'assets/sprites/background-day.png');
        this.load.image('bird', 'assets/sprites/yellowbird-midflap.png');
        this.load.image('pipe', 'assets/sprites/pipe-green.png').height;
        this.load.image('pipe-down', 'assets/sprites/pipe-green-down.png')
        this.load.image('base', 'assets/sprites/base.png');
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    init(){
        this.pipeHeight = 320;
        this.pipePosition = 0;
        this.gap = 60;
        this.basePosition = 0;
        this.gameOver = false;
        this.score = 240;
        this.scorePipes = 0;
    }

    create(){
        let {width, height} = this.sys.game.canvas;
        const background = this.add.image(width/2, height/2, 'background-day').setScrollFactor(0);
        background.scale = scale;

        this.player = this.physics.add.sprite(width/2 - 50, 230, 'bird').setScale(scale);

        this.pipes = this.physics.add.staticGroup();

        //The floor of the world with three bases;
        this.base = this.physics.add.staticGroup();
        for(let i = -100; i < 336*4; (i+=336)){
            const baseElement = this.base.create(i, 420, 'base').setOrigin(0);
            baseElement.scale = scale;
            const body = baseElement.body;
            body.updateFromGameObject();
            this.basePosition = i;
        }

        /*Setup initial position of the pipes
        *Gap range from -200 to -100 with gap of 20
        */
        for(let i = 240; i < 1200; (i+=150)){
            //Y determines where the pipe gap is
            const y = Phaser.Math.Between(-200, -100);
            const x = i;

            //Uprihgt Pipe
            const upPipe = this.pipes.create(x, y+this.gap+this.pipeHeight, 'pipe').setOrigin(0);
            upPipe.scale = scale;
            //Down facing pipe
            const downPipe = this.pipes.create(x, y, 'pipe-down').setOrigin(0);
            downPipe.scale = scale;

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const uBody = upPipe.body;
            uBody.updateFromGameObject();
            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const dBody = downPipe.body;
            dBody.updateFromGameObject();

            this.pipePosition = x;
        }

        var collider1 = this.physics.add.collider(this.player, this.base);
        var collider2 = this.physics.add.collider(this.player , this.pipes);
        this.player.body.onCollide = true;

        //Setup Camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setDeadzone(this.scale.width/3, this.scale.height * 1.5);

        //Constant bird speed
        this.player.setVelocityX(50);

        //Cut pipe length by bringing base to top
        const base = this.base.getChildren();
        for(let i = 0; i < base.length; i++){
            const baseElement = base[i];
            this.children.bringToTop(baseElement);
        }

        //Set collide event with pipe and player
        this.physics.world.on('collide', () => {
            var overText = this.add.text(this.cameras.main.scrollX + 150, height * 0.5, 'Game Over', {
                fontSize: 48
            }).setOrigin(0.5);
            this.children.bringToTop(overText);
            this.player.setVelocityX(0);
            collider1.active = false;
            collider2.active = false;
            this.cameras.main.stopFollow();
            this.gameOver = true;
        });

        this.scoreText = this.add.text(0, 0, `${this.scorePipes}`, {
            fontSize: 48
        }).setOrigin(0).setScrollFactor(0);

        this.input.on('pointerdown', pointer => {
            this.player.setVelocityY(-100);
            if(this.gameOver){
                this.scene.restart();
            }
        })
    }

    update(){
        // Pressing space to fly up
        if(this.cursors.space.isDown){
            this.player.setVelocityY(-100);
        }
        this.movePipes();
        this.moveFloor();
        this.calculateScore();

        this.scoreText.text = `${this.scorePipes}`;

        if(this.gameOver && this.cursors.space.isDown){
            //Made GET request to update highscore
            fetch('http://192.168.1.165:3001/increase').then((response) => {
                console.log('Server Updated');
                return response.json();    
            })
            this.scene.restart();
        }
    }

    //Moves pipe once bird has passed it
    movePipes(){
        const pipe = this.pipes.getChildren();
        for(let i = 0; i < pipe.length; i++){
            let pipeElement = pipe[i];
            if(pipeElement.x < (this.player.x - 300)){
                const y = Phaser.Math.Between(-200, -100);
                this.pipePosition += 150;
                pipeElement.x = this.pipePosition;
                pipeElement.y = y+this.gap+this.pipeHeight
                pipeElement.body.updateFromGameObject();

                pipeElement = pipe[i+1];
                pipeElement.x = this.pipePosition;
                pipeElement.y = y;
                pipeElement.body.updateFromGameObject();

                return;
            }
        }
    } 

    moveFloor(){
        const base = this.base.getChildren();
        for(let i = 0; i < base.length; i++){
            let baseElement = base[i]
            if(baseElement.x < (this.player.x -600)){
                this.basePosition += 336;
                baseElement.x = this.basePosition;
                baseElement.body.updateFromGameObject();
                return;
            }
        }
    }

    // pipes start at 240, then every 150 is another pipe
    calculateScore(){
        if(this.player.x > (this.score + 26)){
            this.scorePipes += 1;
            this.score += (150);
        } 
    }
}