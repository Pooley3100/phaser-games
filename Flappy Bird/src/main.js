import Phaser from './lib/phaser.js';
import Game from './scenes/Game.js';

export default new Phaser.Game({
    type: Phaser.AUTO,
    width: 288,
    height: 512,
    scene: Game,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug  : false
        }
    }
})