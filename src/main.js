import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { WorldMapScene } from './scenes/WorldMapScene.js'

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#001122',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, WorldMapScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
}

// 启动游戏
const game = new Phaser.Game(config)

// 隐藏加载界面
document.getElementById('loading').style.display = 'none'

console.log('🚀 太空防御战已启动!')