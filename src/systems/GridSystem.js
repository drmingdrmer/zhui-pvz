export class GridSystem {
    constructor(scene, config = {}) {
        this.scene = scene

        // 网格配置
        this.rows = config.rows || 5
        this.cols = config.cols || 9
        this.cellSize = config.cellSize || 80
        this.offsetX = config.offsetX || 100
        this.offsetY = config.offsetY || 150

        // 网格状态 (0: 空闲, 1: 占用, 2: 不可放置)
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0))

        // 视觉元素
        this.gridGraphics = null
        this.hoverHighlight = null
        this.currentHoverCell = { row: -1, col: -1 }

        this.init()
    }

    init() {
        this.createGridGraphics()
        this.createHoverHighlight()
        this.setupInputHandlers()

        // 设置右侧区域为敌人路径 (不可放置)
        this.setPathArea()
    }

    createGridGraphics() {
        this.gridGraphics = this.scene.add.graphics()
        this.drawGrid()
    }

    drawGrid() {
        this.gridGraphics.clear()

        // 网格线颜色
        this.gridGraphics.lineStyle(1, 0x00ffff, 0.3)

        // 绘制垂直线
        for (let col = 0; col <= this.cols; col++) {
            const x = this.offsetX + col * this.cellSize
            this.gridGraphics.moveTo(x, this.offsetY)
            this.gridGraphics.lineTo(x, this.offsetY + this.rows * this.cellSize)
        }

        // 绘制水平线
        for (let row = 0; row <= this.rows; row++) {
            const y = this.offsetY + row * this.cellSize
            this.gridGraphics.moveTo(this.offsetX, y)
            this.gridGraphics.lineTo(this.offsetX + this.cols * this.cellSize, y)
        }

        this.gridGraphics.strokePath()

        // 绘制区域背景
        this.drawAreas()
    }

    drawAreas() {
        // 绘制铁板防御区域 (左侧7列)
        this.drawMetalPlates()

        // 敌人路径区域 (右侧2列) - 暗红色
        this.gridGraphics.fillStyle(0x660033, 0.3)
        this.gridGraphics.fillRect(
            this.offsetX + 7 * this.cellSize,
            this.offsetY,
            2 * this.cellSize,
            this.rows * this.cellSize
        )
    }

    drawMetalPlates() {
        // 为每个防御格子绘制铁板
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < 7; col++) {
                const x = this.offsetX + col * this.cellSize
                const y = this.offsetY + row * this.cellSize

                this.drawSingleMetalPlate(x, y)
            }
        }
    }

    drawSingleMetalPlate(x, y) {
        const size = this.cellSize
        const margin = 2 // 铁板间的间隙

        // 铁板主体 - 深灰色金属
        this.gridGraphics.fillStyle(0x4a4a4a, 0.8)
        this.gridGraphics.fillRect(x + margin, y + margin, size - margin * 2, size - margin * 2)

        // 铁板边框 - 更深的颜色营造立体感
        this.gridGraphics.lineStyle(1, 0x333333, 0.9)
        this.gridGraphics.strokeRect(x + margin, y + margin, size - margin * 2, size - margin * 2)

        // 添加金属高光效果
        this.gridGraphics.fillStyle(0x666666, 0.6)
        this.gridGraphics.fillRect(x + margin + 2, y + margin + 2, size - margin * 2 - 8, 3)
        this.gridGraphics.fillRect(x + margin + 2, y + margin + 2, 3, size - margin * 2 - 8)

        // 添加铁板纹理线条
        this.gridGraphics.lineStyle(1, 0x555555, 0.4)
        const lineSpacing = size / 4
        for (let i = 1; i < 4; i++) {
            // 水平纹理线
            this.gridGraphics.moveTo(x + margin + 5, y + margin + i * lineSpacing)
            this.gridGraphics.lineTo(x + size - margin - 5, y + margin + i * lineSpacing)

            // 垂直纹理线
            this.gridGraphics.moveTo(x + margin + i * lineSpacing, y + margin + 5)
            this.gridGraphics.lineTo(x + margin + i * lineSpacing, y + size - margin - 5)
        }
        this.gridGraphics.strokePath()

        // 铁板螺丝钉效果 (四个角)
        this.gridGraphics.fillStyle(0x333333, 0.8)
        const screwSize = 3
        const screwOffset = 8

        // 左上角螺丝
        this.gridGraphics.fillCircle(x + margin + screwOffset, y + margin + screwOffset, screwSize)
        // 右上角螺丝
        this.gridGraphics.fillCircle(x + size - margin - screwOffset, y + margin + screwOffset, screwSize)
        // 左下角螺丝
        this.gridGraphics.fillCircle(x + margin + screwOffset, y + size - margin - screwOffset, screwSize)
        // 右下角螺丝
        this.gridGraphics.fillCircle(x + size - margin - screwOffset, y + size - margin - screwOffset, screwSize)

        // 螺丝高光
        this.gridGraphics.fillStyle(0x888888, 0.6)
        this.gridGraphics.fillCircle(x + margin + screwOffset - 1, y + margin + screwOffset - 1, 1)
        this.gridGraphics.fillCircle(x + size - margin - screwOffset - 1, y + margin + screwOffset - 1, 1)
        this.gridGraphics.fillCircle(x + margin + screwOffset - 1, y + size - margin - screwOffset - 1, 1)
        this.gridGraphics.fillCircle(x + size - margin - screwOffset - 1, y + size - margin - screwOffset - 1, 1)
    }

    createHoverHighlight() {
        this.hoverHighlight = this.scene.add.graphics()
        this.hoverHighlight.setVisible(false)
    }

    setupInputHandlers() {
        // 鼠标移动监听
        this.scene.input.on('pointermove', (pointer) => {
            this.handleMouseMove(pointer.x, pointer.y)
        })

        // 鼠标点击监听
        this.scene.input.on('pointerdown', (pointer) => {
            this.handleMouseClick(pointer.x, pointer.y)
        })
    }

    handleMouseMove(x, y) {
        const gridPos = this.worldToGrid(x, y)

        if (this.isValidGridPosition(gridPos.row, gridPos.col)) {
            // 更新悬停高亮
            if (gridPos.row !== this.currentHoverCell.row ||
                gridPos.col !== this.currentHoverCell.col) {
                this.updateHoverHighlight(gridPos.row, gridPos.col)
                this.currentHoverCell = gridPos
            }
        } else {
            // 隐藏高亮
            this.hoverHighlight.setVisible(false)
            this.currentHoverCell = { row: -1, col: -1 }
        }
    }

    handleMouseClick(x, y) {
        const gridPos = this.worldToGrid(x, y)

        if (this.canPlaceAt(gridPos.row, gridPos.col)) {
            console.log(`点击可放置位置: (${gridPos.row}, ${gridPos.col})`)
            // 触发放置事件
            this.scene.events.emit('gridClick', gridPos)
        } else {
            console.log(`点击无效位置: (${gridPos.row}, ${gridPos.col})`)
        }
    }

    updateHoverHighlight(row, col) {
        this.hoverHighlight.clear()

        const worldPos = this.gridToWorld(row, col)
        const canPlace = this.canPlaceAt(row, col)

        // 根据是否可放置选择颜色
        const color = canPlace ? 0x00ff00 : 0xff0000
        const alpha = 0.4

        this.hoverHighlight.fillStyle(color, alpha)
        this.hoverHighlight.fillRect(
            worldPos.x,
            worldPos.y,
            this.cellSize,
            this.cellSize
        )

        this.hoverHighlight.setVisible(true)
    }

    // 坐标转换：世界坐标 → 网格坐标
    worldToGrid(x, y) {
        return {
            row: Math.floor((y - this.offsetY) / this.cellSize),
            col: Math.floor((x - this.offsetX) / this.cellSize)
        }
    }

    // 坐标转换：网格坐标 → 世界坐标
    gridToWorld(row, col) {
        return {
            x: this.offsetX + col * this.cellSize,
            y: this.offsetY + row * this.cellSize
        }
    }

    // 获取网格中心点世界坐标
    getGridCenter(row, col) {
        const worldPos = this.gridToWorld(row, col)
        return {
            x: worldPos.x + this.cellSize / 2,
            y: worldPos.y + this.cellSize / 2
        }
    }

    // 检查网格位置是否有效
    isValidGridPosition(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols
    }

    // 检查是否可以在该位置放置
    canPlaceAt(row, col) {
        if (!this.isValidGridPosition(row, col)) return false
        return this.grid[row][col] === 0 && col < 7 // 只能在防御区域放置
    }

    // 占用网格位置
    occupyCell(row, col) {
        if (this.canPlaceAt(row, col)) {
            this.grid[row][col] = 1
            return true
        }
        return false
    }

    // 释放网格位置
    freeCell(row, col) {
        if (this.isValidGridPosition(row, col)) {
            this.grid[row][col] = 0
            return true
        }
        return false
    }

    // 设置敌人路径区域
    setPathArea() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 7; col < this.cols; col++) {
                this.grid[row][col] = 2 // 标记为路径区域
            }
        }
    }

    // 获取网格状态信息
    getGridInfo() {
        return {
            rows: this.rows,
            cols: this.cols,
            cellSize: this.cellSize,
            totalCells: this.rows * this.cols,
            occupiedCells: this.grid.flat().filter(cell => cell === 1).length
        }
    }

    // 清理资源
    destroy() {
        if (this.gridGraphics) {
            this.gridGraphics.destroy()
        }
        if (this.hoverHighlight) {
            this.hoverHighlight.destroy()
        }
    }
} 