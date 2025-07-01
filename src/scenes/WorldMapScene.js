export class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' })
    }

    preload() {
        this.load.image('world-map-bg', 'assets/images/space.png');
        this.load.image('jet-button-bg', 'assets/images/jet.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(0, 0, 'world-map-bg').setOrigin(0, 0).setDisplaySize(width, height);

        const buttonX = width * 0.8;
        const buttonY = height * 0.4;
        const spacing = 20;

        // --- 创建按钮 ---
        // 为了清晰，我们为每个按钮单独创建，因为它们的属性开始变得不同

        // 按钮 2: 小游戏
        const miniGameButtonBg = this.add.image(0, 0, 'jet-button-bg').setScale(0.6);
        const miniGameButtonText = this.add.text(0, 15, '小游戏', {
            fontSize: '34px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        const miniGameButton = this.add.container(buttonX, buttonY, [miniGameButtonBg, miniGameButtonText]);
        miniGameButton.setSize(miniGameButtonBg.displayWidth, miniGameButtonBg.displayHeight);
        miniGameButton.setInteractive({ useHandCursor: true });
        miniGameButton.on('pointerdown', () => {
            this.scene.start('MiniGameScene');
        });

        // 按钮 1: 在"小游戏"按钮上方
        const button1Bg = this.add.image(0, 0, 'jet-button-bg').setScale(0.6);
        const button1Text = this.add.text(0, 15, '开始游戏', {
            fontSize: '34px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        const button1 = this.add.container(buttonX, buttonY - miniGameButton.height - spacing, [button1Bg, button1Text]);
        button1.setSize(button1Bg.displayWidth, button1Bg.displayHeight);
        button1.setInteractive({ useHandCursor: true });
        button1.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // 按钮 3: 在"小游戏"按钮下方
        const button3Bg = this.add.image(0, 0, 'jet-button-bg').setScale(0.6);
        const button3Text = this.add.text(0, 15, '点击此处 开启游戏', {
            fontSize: '34px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        const button3 = this.add.container(buttonX, buttonY + miniGameButton.height + spacing, [button3Bg, button3Text]);
        button3.setSize(button3Bg.displayWidth, button3Bg.displayHeight);
        button3.setInteractive({ useHandCursor: true });
        button3.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // 按钮 4: 在按钮3下方
        const button4Bg = this.add.image(0, 0, 'jet-button-bg').setScale(0.6);
        const button4Text = this.add.text(0, 15, '点击此处 开启游戏', {
            fontSize: '34px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        const button4 = this.add.container(button3.x, button3.y + button3.height + spacing, [button4Bg, button4Text]);
        button4.setSize(button4Bg.displayWidth, button4Bg.displayHeight);
        button4.setInteractive({ useHandCursor: true });
        button4.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
} 