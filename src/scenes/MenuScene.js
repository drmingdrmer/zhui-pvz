export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' })
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 1. 设置一个简单的背景颜色
        // this.add.rectangle(width / 2, height / 2, width, height, 0x001122)

        // 2. 添加一个绝对不会出错的文本
        // this.add.text(width / 2, height / 2, 'MenuScene加载成功！', {
        //     fontSize: '48px',
        //     fill: '#00ff00',
        //     fontFamily: 'Arial'
        // }).setOrigin(0.5)

        console.log('MenuScene create() method executed successfully.')

        // 恢复背景和标题
        this.createSpaceBackground(width, height)
        this.createTitle(width, height)

        // 恢复航母和UI
        this.createCarrier(width, height)
        this.createMainButton(width, height)
        this.createGameInfo(width, height)

        // 暂时注释掉剩下的复杂绘图
        // this.createNuke(width, height)
        // this.createSpaceship(width, height)
        // this.createAstronaut(width, height)
        // this.createExplosion(width, height)
    }

    createSpaceBackground(width, height) {
        // 深空背景渐变
        this.add.rectangle(width / 2, height / 2, width, height, 0x000811)

        // 添加星星背景
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width)
            const y = Phaser.Math.Between(0, height)
            const size = Phaser.Math.Between(1, 3)
            const alpha = Phaser.Math.FloatBetween(0.3, 1)

            const star = this.add.circle(x, y, size, 0xffffff, alpha)
            // 添加闪烁效果
            this.tweens.add({
                targets: star,
                alpha: alpha * 0.3,
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1
            })
        }
    }

    createCarrier(width, height) {
        // 左边航母 PS515-4 (根据草图)
        const carrierX = 200
        const carrierY = height - 200

        // 航母主体
        const carrier = this.add.graphics()
        carrier.fillStyle(0x555555)
        carrier.fillRect(carrierX - 80, carrierY - 20, 160, 40)

        // 航母甲板
        carrier.fillStyle(0x666666)
        carrier.fillRect(carrierX - 85, carrierY - 25, 170, 10)

        // 航母舰岛
        carrier.fillRect(carrierX + 30, carrierY - 45, 30, 25)
        carrier.fillRect(carrierX + 35, carrierY - 60, 20, 15)

        // 雷达天线
        carrier.lineStyle(2, 0x888888)
        carrier.moveTo(carrierX + 45, carrierY - 60)
        carrier.lineTo(carrierX + 45, carrierY - 75)
        carrier.strokePath()

        // 航母编号
        this.add.text(carrierX, carrierY + 35, 'PS515-4', {
            fontSize: '12px',
            fill: '#00ffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5)

        // 航母动画 - 轻微上下浮动 (已禁用)
        /* this.tweens.add({
            targets: carrier,
            y: carrierY - 5,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        }) */
    }

    createNuke(width, height) {
        // 右上角核弹
        const nukeX = width - 150
        const nukeY = 120

        // 核弹主体
        const nuke = this.add.graphics()
        nuke.fillStyle(0x8B4513) // 棕色
        nuke.fillRect(nukeX - 15, nukeY, 30, 60)

        // 核弹头部
        nuke.fillStyle(0xFF4500) // 橙红色
        nuke.fillTriangle(nukeX, nukeY - 20, nukeX - 15, nukeY, nukeX + 15, nukeY)

        // 核弹尾翼
        nuke.fillStyle(0x555555)
        nuke.fillTriangle(nukeX - 10, nukeY + 60, nukeX - 20, nukeY + 80, nukeX, nukeY + 60)
        nuke.fillTriangle(nukeX + 10, nukeY + 60, nukeX + 20, nukeY + 80, nukeX, nukeY + 60)

        // 危险标志
        this.add.text(nukeX, nukeY + 30, '☢️', {
            fontSize: '20px'
        }).setOrigin(0.5)

        // 核弹发光效果
        const glowCircle = this.add.circle(nukeX, nukeY + 20, 50, 0xff0000, 0.1)
        this.tweens.add({
            targets: glowCircle,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.2,
            duration: 2000,
            yoyo: true,
            repeat: -1
        })
    }

    createSpaceship(width, height) {
        // 右下角太空飞船
        const shipX = width - 180
        const shipY = height - 150

        // 飞船主体
        const ship = this.add.graphics()
        ship.fillStyle(0xCCCCCC) // 银灰色
        ship.fillEllipse(shipX, shipY, 80, 40)

        // 飞船驾驶舱
        ship.fillStyle(0x4169E1) // 蓝色玻璃
        ship.fillEllipse(shipX, shipY - 5, 30, 15)

        // 飞船引擎
        ship.fillStyle(0xFF6347) // 橙红色
        ship.fillRect(shipX - 45, shipY + 15, 15, 10)
        ship.fillRect(shipX + 30, shipY + 15, 15, 10)

        // 引擎火焰效果
        const flame1 = this.add.graphics()
        flame1.fillStyle(0xFF4500, 0.8)
        flame1.fillTriangle(shipX - 37, shipY + 25, shipX - 45, shipY + 35, shipX - 30, shipY + 35)

        const flame2 = this.add.graphics()
        flame2.fillStyle(0xFF4500, 0.8)
        flame2.fillTriangle(shipX + 37, shipY + 25, shipX + 30, shipY + 35, shipX + 45, shipY + 35)

        // 火焰动画
        this.tweens.add({
            targets: [flame1, flame2],
            scaleY: 1.5,
            alpha: 0.6,
            duration: 500,
            yoyo: true,
            repeat: -1
        })

        // 飞船悬浮动画
        this.tweens.add({
            targets: ship,
            y: shipY - 10,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
    }

    createAstronaut(width, height) {
        // 太空飞船上方的太空人
        const astroX = width - 180
        const astroY = height - 220

        // 太空人头盔
        const helmet = this.add.circle(astroX, astroY, 20, 0xE6E6FA, 0.8)
        helmet.setStroke(3, 0x4169E1)

        // 太空人面部
        this.add.circle(astroX, astroY, 15, 0xFFDBB6)

        // 眼睛
        this.add.circle(astroX - 5, astroY - 3, 2, 0x000000)
        this.add.circle(astroX + 5, astroY - 3, 2, 0x000000)

        // 嘴巴
        this.add.text(astroX, astroY + 5, '😊', {
            fontSize: '8px'
        }).setOrigin(0.5)

        // 太空服身体
        const body = this.add.graphics()
        body.fillStyle(0xF5F5F5)
        body.fillRect(astroX - 15, astroY + 20, 30, 40)

        // 太空服装饰
        body.lineStyle(2, 0x4169E1)
        body.strokeRect(astroX - 12, astroY + 25, 24, 10)

        // 飘浮动画
        this.tweens.add({
            targets: [helmet, body],
            y: astroY - 8,
            duration: 3500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
    }

    createExplosion(width, height) {
        // 航母上方的爆炸飞船
        const explX = 200
        const explY = height - 300

        // 爆炸的飞船残骸
        const wreck = this.add.graphics()
        wreck.fillStyle(0x8B4513) // 棕色残骸
        wreck.fillRect(explX - 20, explY, 40, 15)
        wreck.fillRect(explX - 10, explY - 10, 20, 10)

        // 爆炸粒子效果
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2
            const distance = 30
            const partX = explX + Math.cos(angle) * distance
            const partY = explY + Math.sin(angle) * distance

            const particle = this.add.circle(partX, partY, 3, 0xFF4500, 0.8)

            // 爆炸粒子动画
            this.tweens.add({
                targets: particle,
                x: partX + Math.cos(angle) * 20,
                y: partY + Math.sin(angle) * 20,
                alpha: 0,
                duration: 1500,
                delay: i * 100,
                repeat: -1
            })
        }

        // 爆炸火焰
        const fire = this.add.graphics()
        fire.fillStyle(0xFF6347, 0.7)
        fire.fillCircle(explX, explY, 25)

        this.tweens.add({
            targets: fire,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.4,
            duration: 800,
            yoyo: true,
            repeat: -1
        })
    }

    createTitle(width, height) {
        // 游戏标题（中央位置）
        this.add.text(width / 2, height / 4, '太空防御战', {
            fontSize: '48px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            stroke: '#003366',
            strokeThickness: 4
        }).setOrigin(0.5)

        this.add.text(width / 2, height / 4 + 60, 'SPACE DEFENSE', {
            fontSize: '24px',
            fill: '#66ccff',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
    }

    createMainButton(width, height) {
        // 开发与修改按钮（对应草图中央方框）
        const devButton = this.add.text(width / 2, height / 2, '开发与修改', {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#006699',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5)

        devButton.setInteractive()
        devButton.on('pointerdown', () => this.startGame())
        devButton.on('pointerover', () => {
            devButton.setTint(0x00ffff)
            devButton.setScale(1.05)
        })
        devButton.on('pointerout', () => {
            devButton.clearTint()
            devButton.setScale(1)
        })

        // 开始游戏按钮
        const startButton = this.add.text(width / 2, height / 2 + 60, '开始游戏', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#009900',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)

        startButton.setInteractive()
        startButton.on('pointerdown', () => this.startGame())
        startButton.on('pointerover', () => startButton.setTint(0x00ff00))
        startButton.on('pointerout', () => startButton.clearTint())
    }

    createGameInfo(width, height) {
        // 游戏说明
        this.add.text(width / 2, height * 3 / 4, '太空站遭遇入侵！部署防御系统\n在铁板上放置高科技武器抵御敌人', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5)

        // 版本信息
        this.add.text(width - 20, height - 20, 'v0.2.0 Alpha - 铁板版', {
            fontSize: '14px',
            fill: '#666666',
            fontFamily: 'Arial'
        }).setOrigin(1, 1)
    }

    startGame() {
        // 添加启动音效提示
        console.log('🚀 启动太空防御战！')
        this.scene.start('GameScene')
    }
} 