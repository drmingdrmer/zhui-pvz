export class DevTools {
    constructor(scene) {
        this.scene = scene
        this.debugMode = false
        this.debugGraphics = null
        this.fpsText = null
        this.coordinateText = null

        this.init()
    }

    init() {
        // 创建调试图形对象
        this.debugGraphics = this.scene.add.graphics()
        this.debugGraphics.setDepth(1000) // 确保在最上层

        // 创建FPS显示
        this.createFPSDisplay()

        // 创建坐标显示
        this.createCoordinateDisplay()

        // 设置调试快捷键
        this.setupDebugKeys()
    }

    createFPSDisplay() {
        this.fpsText = this.scene.add.text(10, 10, 'FPS: --', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        })
        this.fpsText.setDepth(1001)
        this.fpsText.setVisible(this.debugMode)
    }

    createCoordinateDisplay() {
        this.coordinateText = this.scene.add.text(10, 40, 'Mouse: (0, 0)\nGrid: (0, 0)', {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        })
        this.coordinateText.setDepth(1001)
        this.coordinateText.setVisible(this.debugMode)
    }

    setupDebugKeys() {
        // F1键切换调试模式
        this.scene.input.keyboard.on('keydown-F1', () => {
            this.toggleDebugMode()
        })

        // F2键显示网格信息
        this.scene.input.keyboard.on('keydown-F2', () => {
            this.logGridInfo()
        })

        // F3键清空所有防御塔
        this.scene.input.keyboard.on('keydown-F3', () => {
            this.clearAllTowers()
        })
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode

        this.fpsText.setVisible(this.debugMode)
        this.coordinateText.setVisible(this.debugMode)

        console.log(`🛠 调试模式: ${this.debugMode ? '开启' : '关闭'}`)

        if (this.debugMode) {
            console.log('🎮 调试快捷键:')
            console.log('  F1: 切换调试模式')
            console.log('  F2: 显示网格信息')
            console.log('  F3: 清空所有防御塔')
        }
    }

    logGridInfo() {
        if (this.scene.gridSystem) {
            const info = this.scene.gridSystem.getGridInfo()
            console.log('📊 网格系统信息:')
            console.log(`  网格大小: ${info.rows}×${info.cols}`)
            console.log(`  格子尺寸: ${info.cellSize}px`)
            console.log(`  总格子数: ${info.totalCells}`)
            console.log(`  已占用: ${info.occupiedCells}`)
            console.log(`  可用格子: ${info.totalCells - info.occupiedCells - 10}`) // 减去路径区域
        }
    }

    clearAllTowers() {
        if (this.scene.gridSystem) {
            // 清空网格占用状态
            for (let row = 0; row < this.scene.gridSystem.rows; row++) {
                for (let col = 0; col < 7; col++) { // 只清理防御区域
                    this.scene.gridSystem.freeCell(row, col)
                }
            }

            // 清除所有防御塔的视觉元素 (这里简化处理)
            console.log('🧹 已清空所有防御塔')
            console.log('💡 提示: 刷新页面以重置视觉元素')

            // 更新UI显示
            if (this.scene.updateInfoDisplay) {
                this.scene.updateInfoDisplay()
            }
        }
    }

    update() {
        if (!this.debugMode) return

        // 更新FPS显示
        const fps = Math.round(this.scene.game.loop.actualFps)
        this.fpsText.setText(`FPS: ${fps}`)

        // 更新鼠标坐标显示
        const pointer = this.scene.input.activePointer
        const worldPos = `Mouse: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`

        let gridPos = 'Grid: (-, -)'
        if (this.scene.gridSystem) {
            const gridCoord = this.scene.gridSystem.worldToGrid(pointer.x, pointer.y)
            if (this.scene.gridSystem.isValidGridPosition(gridCoord.row, gridCoord.col)) {
                gridPos = `Grid: (${gridCoord.row}, ${gridCoord.col})`
            }
        }

        this.coordinateText.setText(`${worldPos}\n${gridPos}`)
    }

    // 绘制网格调试信息
    drawGridDebug() {
        if (!this.debugMode || !this.scene.gridSystem) return

        this.debugGraphics.clear()

        // 绘制网格中心点
        this.debugGraphics.fillStyle(0xff0000, 0.5)
        for (let row = 0; row < this.scene.gridSystem.rows; row++) {
            for (let col = 0; col < this.scene.gridSystem.cols; col++) {
                const center = this.scene.gridSystem.getGridCenter(row, col)
                this.debugGraphics.fillCircle(center.x, center.y, 3)
            }
        }
    }

    // 添加性能监控
    startPerformanceMonitor() {
        if (this.performanceInterval) return

        this.performanceInterval = setInterval(() => {
            if (this.debugMode) {
                const memory = performance.memory
                if (memory) {
                    console.log('🔍 性能监控:')
                    console.log(`  已用内存: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`)
                    console.log(`  总内存: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`)
                }
            }
        }, 5000) // 每5秒检查一次
    }

    // 停止性能监控
    stopPerformanceMonitor() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval)
            this.performanceInterval = null
        }
    }

    // 清理资源
    destroy() {
        this.stopPerformanceMonitor()

        if (this.debugGraphics) {
            this.debugGraphics.destroy()
        }
        if (this.fpsText) {
            this.fpsText.destroy()
        }
        if (this.coordinateText) {
            this.coordinateText.destroy()
        }
    }
} 