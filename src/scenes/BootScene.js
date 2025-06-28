export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' })
    }

    preload() {
        // 创建简单的启动界面
        this.createSimpleInterface()
    }

    create() {
        // 立即跳转到主菜单
        this.scene.start('MenuScene')
    }

    createSimpleInterface() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x001122)

        // 标题文字
        this.add.text(width / 2, height / 2, '太空防御战', {
            fontSize: '48px',
            fill: '#00ffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5)

        // 提示文字
        this.add.text(width / 2, height / 2 + 80, '正在启动...', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
    }
} 