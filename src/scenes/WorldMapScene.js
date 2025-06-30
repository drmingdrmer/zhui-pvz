export class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' })
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 设置一个深色背景作为空白屏幕
        this.cameras.main.setBackgroundColor('#000000')

        // 添加一个简单的提示文字，并使其可交互
        const startText = this.add.text(width / 2, height / 2, '这是一个新的空白界面\n(点击任意处进入游戏)', {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5)

        // 设置整个场景都可点击，以便跳转到下一个场景
        this.input.on('pointerdown', () => {
            this.scene.start('GameScene')
        })
    }
} 