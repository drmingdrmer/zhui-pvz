export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' })
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 1. 添加背景图片
        this.add.image(width / 2, height / 2, 'background').setOrigin(0.5, 0.5)

        // 2. 添加UI元素 (标题和按钮)
        this.add.text(width / 2, height / 4, '太空防御战', { fontSize: '48px', fill: '#00ffff', stroke: '#003366', strokeThickness: 4 }).setOrigin(0.5)
        this.add.text(width / 2, height / 4 + 60, 'SPACE DEFENSE', { fontSize: '24px', fill: '#66ccff' }).setOrigin(0.5)

        const startButton = this.add.text(width / 2, height / 2, '开始游戏', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#006699',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5)

        startButton.setInteractive()
        startButton.on('pointerdown', () => this.scene.start('WorldMapScene'))
        startButton.on('pointerover', () => startButton.setTint(0x00ffff))
        startButton.on('pointerout', () => startButton.clearTint())

        // 3. 放置所有草图元素对应的图片

        // 左侧航母 (放大一点)
        this.add.image(250, height - 250, 'carrier').setScale(1.2)

        // 航母上方的爆炸 (缩小一点)
        this.add.image(250, height / 4, 'explosion').setScale(0.8)

        // 右上角核弹 (缩小并旋转)
        this.add.image(width - 150, 120, 'nuke').setScale(0.8).setAngle(-175)

        // 右下角太空飞船
        this.add.image(width - 180, height - 150, 'spaceship')

        // 飞船上方的太空人 (缩小一点)
        this.add.image(width - 220, height / 2, 'astronaut').setScale(0.8)
    }
} 