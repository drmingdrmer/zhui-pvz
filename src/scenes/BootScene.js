export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' })
    }

    preload() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 显示一个简单的加载信息
        const loadingText = this.add.text(width / 2, height / 2, '正在加载太空资源...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5)

        // 定义图片资源路径
        const imagePath = 'assets/images/'

        // --- 加载主菜单所需的所有图片 ---
        this.load.image('background', `${imagePath}background.png`)
        this.load.image('carrier', `${imagePath}carrier.png`)
        this.load.image('nuke', `${imagePath}nuke.png`)
        this.load.image('spaceship', `${imagePath}spaceship.png`)
        this.load.image('astronaut', `${imagePath}astronaut.png`)
        this.load.image('explosion', `${imagePath}explosion.png`)

        // 监听加载完成事件
        this.load.on('complete', () => {
            loadingText.setText('加载完成！')
            // 短暂延迟后进入主菜单，让用户看到"加载完成"
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene')
            })
        })
    }
} 