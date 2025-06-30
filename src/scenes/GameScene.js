import { GridSystem } from '../systems/GridSystem.js'
import { DevTools } from '../utils/DevTools.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 游戏背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x001133)

        // 创建网格系统
        this.gridSystem = new GridSystem(this, {
            rows: 5,
            cols: 9,
            cellSize: 80,
            offsetX: 100,
            offsetY: 150
        })

        // 创建开发工具 (仅在开发环境)
        this.devTools = new DevTools(this)
        this.devTools.startPerformanceMonitor()

        // 创建UI界面
        this.createUI()

        // 设置事件监听
        this.setupEvents()

        // 添加ESC键监听
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene')
        })

        console.log('🎮 游戏场景已加载 - 网格系统激活')
        console.log('💡 按F1键开启调试模式')
    }

    createUI() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 游戏标题
        this.add.text(width / 2, 50, '太空防御战', {
            fontSize: '32px',
            fill: '#00ffff',
            fontFamily: 'Arial',
            stroke: '#003366',
            strokeThickness: 2
        }).setOrigin(0.5)

        // --- 创建左下角的物品选择栏 ---
        const itemKeys = ['item_lightning', 'item_tnt', 'item_battery', 'item_pistol', 'item_nut']
        const boxSize = 80
        const startX = 50
        const boxY = height - 50 - boxSize
        const graphics = this.add.graphics()

        itemKeys.forEach((key, i) => {
            const boxX = startX + i * boxSize

            // 绘制背景板 (和铁板一样的风格)
            graphics.fillStyle(0x00ffff, 1) // 蓝色边框
            graphics.fillRect(boxX, boxY, boxSize, boxSize)
            graphics.fillStyle(0x001133, 1) // 深蓝色背景
            graphics.fillRect(boxX + 2, boxY + 2, boxSize - 4, boxSize - 4)

            // 在背景板上放置物品图片
            const itemImage = this.add.image(boxX + boxSize / 2, boxY + boxSize / 2, key)
            // 缩放图片以适应方格
            itemImage.setScale(Math.min((boxSize - 10) / itemImage.width, (boxSize - 10) / itemImage.height))
        })

        // 网格信息显示
        const gridInfo = this.gridSystem.getGridInfo()
        this.infoText = this.add.text(width - 50, height - 100,
            `铁板: ${gridInfo.rows}×7 (${7 * gridInfo.rows}块)\n` +
            `已占用: ${gridInfo.occupiedCells}/${gridInfo.totalCells - 10}`, {
            fontSize: '14px',
            fill: '#66ccff',
            fontFamily: 'Arial',
            align: 'right'
        }).setOrigin(1, 0)

        // 区域标签
        this.add.text(250, 120, '🛡️ 铁板防御区', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial',
            stroke: '#666666',
            strokeThickness: 1
        }).setOrigin(0.5)

        this.add.text(650, 120, '⚠️ 敌人路径', {
            fontSize: '16px',
            fill: '#ff6666',
            fontFamily: 'Arial'
        }).setOrigin(0.5)
    }

    setupEvents() {
        // 监听网格点击事件
        this.events.on('gridClick', (gridPos) => {
            this.handleGridClick(gridPos)
        })
    }

    handleGridClick(gridPos) {
        const { row, col } = gridPos

        // 尝试占用该位置
        if (this.gridSystem.occupyCell(row, col)) {
            console.log(`成功放置防御塔在位置: (${row}, ${col})`)

            // 创建临时的防御塔标记 (简单的蓝色圆圈)
            const centerPos = this.gridSystem.getGridCenter(row, col)
            const tower = this.add.circle(centerPos.x, centerPos.y, 30, 0x0099ff)
            tower.setStroke(2, 0x00ffff)

            // 添加塔的标识文字
            this.add.text(centerPos.x, centerPos.y, '🔫', {
                fontSize: '24px'
            }).setOrigin(0.5)

            // 更新信息显示
            this.updateInfoDisplay()

            // 添加放置音效提示 (用console代替)
            console.log('🔊 防御塔放置成功！')
        }
    }

    updateInfoDisplay() {
        const gridInfo = this.gridSystem.getGridInfo()
        this.infoText.setText(
            `铁板: ${gridInfo.rows}×7 (${7 * gridInfo.rows}块)\n` +
            `已占用: ${gridInfo.occupiedCells}/${gridInfo.totalCells - 10}`
        )
    }

    update() {
        // 更新开发工具
        if (this.devTools) {
            this.devTools.update()
        }

        // 游戏主循环
        // 这里后续会添加敌人移动、攻击逻辑等
    }

    // 场景销毁时清理资源
    destroy() {
        if (this.gridSystem) {
            this.gridSystem.destroy()
        }
        if (this.devTools) {
            this.devTools.destroy()
        }
        super.destroy()
    }
} 