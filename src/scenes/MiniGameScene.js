import { GridSystem } from '../systems/GridSystem.js'
import { DevTools } from '../utils/DevTools.js'

export class MiniGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MiniGameScene' })
        this.ironPlates = null; // 用于存放铁板的Group
        this.plateMap = new Map(); // 用于快速查询某个格子有什么物品
        this.clickablePlates = new Set(); // 用于追踪所有可点击的铁板
        this.targetHeight = null; // 以TNT为基准的目标高度
        this.gridState = null; // 2D数组，追踪网格上每个格子的状态
        this.astronauts = null; // 用于存放所有太空人的Group
        this.bullets = null; // 用于存放所有子弹的Group
        this.axes = null; // 用于存放所有斧头的Group
        this.allPlatesUsed = false; // 标记所有铁板是否都被使用
        this.gameCompleteTimer = null; // 游戏完成计时器
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 游戏背景
        this.add.rectangle(width / 2, height / 2, width, height, 0x330033)

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

        // 初始化网格状态
        this.gridState = Array(this.gridSystem.rows).fill(null).map(() => Array(this.gridSystem.cols).fill(null));
        
        // 设置拖拽事件监听
        this.setupDragEvents();

        // 添加ESC键监听
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('WorldMapScene')
        })

        this.placeIronPlates();

        this.astronauts = this.add.group();
        this.bullets = this.add.group();
        this.axes = this.add.group();

        // 添加一个定时器，每2秒执行一次太空人移动逻辑
        this.time.addEvent({
            delay: 2000,
            callback: this.moveAstronauts,
            callbackScope: this,
            loop: true
        });

        console.log('🎮 小游戏场景已加载 - 网格系统激活')
        console.log('💡 按F1键开启调试模式')
    }

    createUI() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 游戏标题
        this.add.text(width / 2, 50, '趣味小游戏', {
            fontSize: '32px',
            fill: '#ff00ff',
            fontFamily: 'Arial',
            stroke: '#660066',
            strokeThickness: 2
        }).setOrigin(0.5)

        // 网格信息显示
        const gridInfo = this.gridSystem.getGridInfo()
        this.infoText = this.add.text(width - 50, height - 100,
            `铁板: ${gridInfo.rows}×7 (${7 * gridInfo.rows}块)\n` +
            `已占用: ${gridInfo.occupiedCells}/${gridInfo.totalCells - 10}`, {
            fontSize: '14px',
            fill: '#ff99ff',
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
        const { row, col } = gridPos;
        const plateKey = `${row}-${col}`;

        // 如果该铁板不可点击（比如已经点过），则直接返回
        if (!this.clickablePlates.has(plateKey)) {
            return;
        }

        const centerPos = this.gridSystem.getGridCenter(row, col);

        // 判断是特殊物品铁板还是普通铁板
        if (this.plateMap.has(plateKey)) {
            // 是特殊铁板，只显示物品
            const itemKey = this.plateMap.get(plateKey);
            this._addImageToCell(centerPos.x, centerPos.y, itemKey, row, col);
            console.log(`在铁板 (${row}, ${col}) 上放置了 ${itemKey}`);
        } else {
            // 是普通铁板，只显示太空人
            this._addImageToCell(centerPos.x, centerPos.y, 'astronaut', row, col);
            console.log(`在铁板 (${row}, ${col}) 上放置了太空人`);
        }

        // 无论点击了哪种，都将其标记为已使用
        this.clickablePlates.delete(plateKey);

        // 可以给对应的铁板一个视觉变化，表示已使用
        const plateObject = this.ironPlates.getChildren().find(p => {
            const gridPos = this.gridSystem.worldToGrid(p.x, p.y);
            return gridPos.row === row && gridPos.col === col;
        });
        if (plateObject) {
            plateObject.setFillStyle(0x333333); // 变暗
        }

        // 检查是否所有铁板都被点击完毕
        if (this.clickablePlates.size === 0) {
            console.log('所有铁板都被点击完毕，等待所有太空人被清理完毕');
            this.allPlatesUsed = true; // 标记所有铁板已使用
            this.checkGameComplete(); // 检查游戏是否完成
        }
    }

    _addImageToCell(x, y, key, row, col) {
        // 确保我们有一个基于TNT高度的目标尺寸
        if (!this.targetHeight) {
            const refTexture = this.textures.get('item_tnt');
            const refHeight = refTexture.source[0].height;
            const cellSize = this.gridSystem.cellSize;
            const padding = 10;
            const scale = (cellSize - padding) / refHeight;
            this.targetHeight = refHeight * scale;
        }

        const image = this.add.image(x, y, key);

        // 对于TNT和太空人，我们通过统一高度来确保它们一样大
        if (key === 'item_tnt' || key === 'astronaut') {
            const scaleToMatchHeight = this.targetHeight / image.height;
            image.setScale(scaleToMatchHeight);
        } else {
            // 其他物品（如手枪）则正常缩放以适应格子
            const cellSize = this.gridSystem.cellSize;
            const padding = 10;
            const scale = Math.min((cellSize - padding) / image.width, (cellSize - padding) / image.height);
            image.setScale(scale);
        }

        // 只让手枪和TNT可以被拖动，并设置血量
        if (key === 'item_pistol' || key === 'item_tnt') {
            image.setInteractive({ useHandCursor: true });
            this.input.setDraggable(image);
            image.setData('health', 10); // 植物血量10
            image.setData('maxHealth', 10);
        } else if (key === 'astronaut') {
            // 太空人加入专门的组，用于后续的AI移动，并设置血量
            this.astronauts.add(image);
            this.gridState[row][col] = { type: key, gameObject: image };
            image.setData('health', 9); // 初始血量9
            image.setData('maxHealth', 9);
        }
        
        image.setData('type', key);
        image.setData('sourceRow', row);
        image.setData('sourceCol', col);

        return image;
    }

    checkGameComplete() {
        // 检查是否所有铁板都被使用且所有太空人都被清理
        if (this.allPlatesUsed && this.astronauts.children.size === 0) {
            console.log('所有铁板(罐子)已被砸完且所有太空人已清理完毕，2秒后跳转到第二界面');
            
            // 如果已经有计时器在运行，先清除它
            if (this.gameCompleteTimer) {
                this.gameCompleteTimer.remove();
            }
            
            // 延迟2秒后跳转
            this.gameCompleteTimer = this.time.delayedCall(2000, () => {
                this.scene.start('WorldMapScene');
            });
        } else {
            console.log(`游戏完成检查: 铁板(罐子)完成:${this.allPlatesUsed}, 太空人剩余:${this.astronauts.children.size}`);
        }
    }

    setupDragEvents() {
        this.input.on('dragstart', (pointer, gameObject) => {
            this.children.bringToTop(gameObject);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.setPosition(dragX, dragY);
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            const { row, col } = this.gridSystem.worldToGrid(gameObject.x, gameObject.y);
            const sourceRow = gameObject.getData('sourceRow');
            const sourceCol = gameObject.getData('sourceCol');
            const type = gameObject.getData('type');

            // 检查是否是有效的放置位置 (在网格内，且在前3列，且目标格子为空)
            if (row !== -1 && col < 3 && this.gridState[row][col] === null) {
                // 有效，放置到新位置
                const centerPos = this.gridSystem.getGridCenter(row, col);
                gameObject.setPosition(centerPos.x, centerPos.y);

                // 清除旧格子的状态（只有当物品是从铁板区域拖出来的时候才需要）
                if (sourceCol >= 3) {
                    // 从铁板区域拖出来的，不需要清除gridState，因为那里本来就没有记录
                } else {
                    // 从空白区域移动的，需要清除原位置
                    this.gridState[sourceRow][sourceCol] = null;
                }

                // 更新新位置的gridState
                this.gridState[row][col] = { type: type, gameObject: gameObject };
                
                // 更新拖拽对象的起始位置信息
                gameObject.setData('sourceRow', row);
                gameObject.setData('sourceCol', col);
                
                // 如果是TNT，立即爆炸
                if (type === 'item_tnt') {
                    this.time.delayedCall(200, () => {
                        this.explodeTNT(row, col);
                    });
                } else {
                    // 其他物品放置后禁用拖拽
                    gameObject.disableInteractive();
                }
                
                console.log(`将 ${type} 放置在 (${row}, ${col})`);
            } else {
                // 无效，弹回原处
                const originalCenter = this.gridSystem.getGridCenter(sourceRow, sourceCol);
                gameObject.setPosition(originalCenter.x, originalCenter.y);
                console.log(`无效放置，已弹回`);
            }
        });
    }

    placeIronPlates() {
        this.ironPlates = this.add.group();
        this.plateMap.clear();
        this.clickablePlates.clear();

        const allPlates = [];
        for (let row = 0; row < this.gridSystem.rows; row++) {
            for (let col = 3; col <= 6; col++) {
                const centerPos = this.gridSystem.getGridCenter(row, col);
                const plate = this.add.rectangle(centerPos.x, centerPos.y, this.gridSystem.cellSize - 4, this.gridSystem.cellSize - 4, 0x555555);
                plate.setStrokeStyle(2, 0x888888);
                this.ironPlates.add(plate);
                
                const plateKey = `${row}-${col}`;
                allPlates.push(plateKey);
                this.clickablePlates.add(plateKey);
            }
        }

        // 随机分配物品
        Phaser.Utils.Array.Shuffle(allPlates);

        for (let i = 0; i < 10; i++) {
            if (i < 5) {
                // 前5个分配为手枪
                this.plateMap.set(allPlates[i], 'item_pistol');
            } else {
                // 后5个分配为TNT
                this.plateMap.set(allPlates[i], 'item_tnt');
            }
        }
        console.log('物品已随机分配到铁板上:', this.plateMap);
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
        this.checkPistolAndShoot();
        this.updateBullets();
        this.checkAxeAttacks();
    }

    checkPistolAndShoot() {
        for (let r = 0; r < this.gridSystem.rows; r++) {
            let astronautInRow = false;
            // 检查这一行是否有太空人
            for (let c = 0; c < this.gridSystem.cols; c++) {
                if (this.gridState[r][c] && this.gridState[r][c].type === 'astronaut') {
                    astronautInRow = true;
                    console.log(`发现太空人在第 ${r} 行第 ${c} 列`);
                    break;
                }
            }

            if (astronautInRow) {
                // 如果有太空人，就让这一行所有的手枪射击
                for (let c = 0; c < 3; c++) { // 手枪只可能在前3列
                    const cell = this.gridState[r][c];
                    if (cell && cell.type === 'item_pistol') {
                        const pistol = cell.gameObject;
                        const now = this.time.now;
                        const lastShot = pistol.getData('lastShot') || 0;
                        const cooldown = 1000; // 1秒冷却

                        console.log(`发现手枪在第 ${r} 行第 ${c} 列，冷却时间检查: ${now - lastShot} > ${cooldown}`);

                        if (now - lastShot > cooldown) {
                            pistol.setData('lastShot', now);
                            this.shootBullet(pistol.x, pistol.y);
                            console.log(`手枪射击！位置: (${pistol.x}, ${pistol.y})`);
                        }
                    }
                }
            }
        }
    }

    shootBullet(x, y) {
        const bullet = this.add.circle(x + 30, y, 5, 0x00ffff);
        this.bullets.add(bullet);
    }
    
    updateBullets() {
        this.bullets.getChildren().forEach(bullet => {
            bullet.x += 10;
            
            // 检查子弹是否击中太空人
            this.astronauts.getChildren().forEach(astronaut => {
                if (Phaser.Geom.Intersects.CircleToRectangle(
                    new Phaser.Geom.Circle(bullet.x, bullet.y, 5),
                    astronaut.getBounds()
                )) {
                    this.hitAstronaut(astronaut, bullet);
                }
            });
            
            if (bullet.x > this.cameras.main.width) {
                bullet.destroy();
            }
        });
    }

    hitAstronaut(astronaut, bullet) {
        // 销毁子弹
        bullet.destroy();
        
        // 减少太空人血量
        let health = astronaut.getData('health');
        health--;
        astronaut.setData('health', health);
        
        // 创建击中效果
        const hitEffect = this.add.circle(astronaut.x, astronaut.y, 15, 0xff0000);
        hitEffect.setAlpha(0.8);
        this.tweens.add({
            targets: hitEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => hitEffect.destroy()
        });
        
        console.log(`太空人被击中！剩余血量: ${health}`);
        
        // 血量归零时销毁太空人
        if (health <= 0) {
            const row = astronaut.getData('sourceRow');
            const col = astronaut.getData('sourceCol');
            
            // 从游戏状态中移除
            this.gridState[row][col] = null;
            this.astronauts.remove(astronaut);
            astronaut.destroy();
            
            // 清理该位置的斧头
            this.cleanupAxeAtPosition(row, col);
            
            console.log(`太空人在 (${row}, ${col}) 被消灭！`);
            
            // 检查游戏是否完成
            this.checkGameComplete();
        }
    }

    moveAstronauts() {
        Phaser.Actions.Call(this.astronauts.getChildren(), (astronaut) => {
            if (!astronaut.active || astronaut.getData('isMoving')) {
                return; // 跳过不活跃或正在移动的太空人
            }

            const sourceRow = astronaut.getData('sourceRow');
            const sourceCol = astronaut.getData('sourceCol');
            const targetCol = sourceCol - 1;

            // 检查左侧格子是否有障碍物（手枪或TNT）
            if (targetCol >= 0 && this.gridState[sourceRow][targetCol] && 
                (this.gridState[sourceRow][targetCol].type === 'item_pistol' || 
                 this.gridState[sourceRow][targetCol].type === 'item_tnt')) {
                
                // 有障碍物，在当前位置生成斧头
                this.createAxe(sourceRow, sourceCol);
                console.log(`太空人在 (${sourceRow}, ${sourceCol}) 遇到障碍物，生成斧头`);
                return;
            }

            // 检查左侧格子是否可以移动（允许移动到第0列）
            if (targetCol >= 0 && this.gridState[sourceRow][targetCol] === null) {
                astronaut.setData('isMoving', true);

                // 更新网格状态
                this.gridState[sourceRow][targetCol] = this.gridState[sourceRow][sourceCol];
                this.gridState[sourceRow][sourceCol] = null;

                // 更新太空人自己的位置数据
                astronaut.setData('sourceCol', targetCol);

                // 使用补间动画平滑移动
                const targetPos = this.gridSystem.getGridCenter(sourceRow, targetCol);
                this.tweens.add({
                    targets: astronaut,
                    x: targetPos.x,
                    y: targetPos.y,
                    ease: 'Power2',
                    duration: 500,
                    onComplete: () => {
                        astronaut.setData('isMoving', false);
                    }
                });
            }
        });
    }

    createAxe(row, col) {
        // 检查该位置是否已经有斧头
        const existingAxe = this.axes.getChildren().find(axe => 
            axe.getData('row') === row && axe.getData('col') === col
        );
        
        if (existingAxe) {
            return; // 已经有斧头了，不重复创建
        }

        const centerPos = this.gridSystem.getGridCenter(row, col);
        const axe = this.add.rectangle(centerPos.x, centerPos.y, 30, 10, 0x8B4513);
        axe.setStrokeStyle(2, 0x654321);
        
        axe.setData('row', row);
        axe.setData('col', col);
        
        this.axes.add(axe);
        console.log(`在 (${row}, ${col}) 创建斧头`);
    }

    cleanupAxeAtPosition(row, col) {
        // 查找并移除指定位置的斧头
        const axeToRemove = this.axes.getChildren().find(axe => 
            axe.getData('row') === row && axe.getData('col') === col
        );
        
        if (axeToRemove) {
            this.axes.remove(axeToRemove);
            axeToRemove.destroy();
            console.log(`清理位置 (${row}, ${col}) 的斧头`);
        }
    }

    checkAxeAttacks() {
        this.axes.getChildren().forEach(axe => {
            const axeRow = axe.getData('row');
            const axeCol = axe.getData('col');
            const targetCol = axeCol - 1;
            
            // 检查斧头前方是否有植物
            if (targetCol >= 0 && this.gridState[axeRow][targetCol] && 
                (this.gridState[axeRow][targetCol].type === 'item_pistol' || 
                 this.gridState[axeRow][targetCol].type === 'item_tnt')) {
                
                const plant = this.gridState[axeRow][targetCol].gameObject;
                this.axeAttackPlant(axe, plant, axeRow, targetCol);
            }
        });
    }

    axeAttackPlant(axe, plant, row, col) {
        // 检查斧头是否在攻击冷却中
        const now = this.time.now;
        const lastAttack = axe.getData('lastAttack') || 0;
        const attackCooldown = 2000; // 2秒攻击一次
        
        if (now - lastAttack < attackCooldown) {
            return;
        }
        
        axe.setData('lastAttack', now);
        
        // 减少植物血量
        let health = plant.getData('health');
        health--;
        plant.setData('health', health);
        
        // 创建攻击效果
        const attackEffect = this.add.circle(plant.x, plant.y, 20, 0xFFFF00);
        attackEffect.setAlpha(0.6);
        this.tweens.add({
            targets: attackEffect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => attackEffect.destroy()
        });
        
        console.log(`斧头攻击植物！植物剩余血量: ${health}`);
        
        // 植物血量归零时销毁
        if (health <= 0) {
            this.gridState[row][col] = null;
            plant.destroy();
            console.log(`植物在 (${row}, ${col}) 被摧毁！`);
        }
    }

    explodeTNT(centerRow, centerCol) {
        console.log(`TNT在 (${centerRow}, ${centerCol}) 爆炸！`);
        
        // 创建爆炸视觉效果
        const centerPos = this.gridSystem.getGridCenter(centerRow, centerCol);
        const explosion = this.add.circle(centerPos.x, centerPos.y, 60, 0xff6600);
        explosion.setAlpha(0.8);
        
        // 爆炸动画
        this.tweens.add({
            targets: explosion,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });

        // 影响9宫格范围内的所有物体
        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (r >= 0 && r < this.gridSystem.rows && c >= 0 && c < this.gridSystem.cols) {
                    const cell = this.gridState[r][c];
                    if (cell) {
                        console.log(`爆炸影响到 (${r}, ${c}) 的 ${cell.type}`);
                        
                        // 销毁物体
                        if (cell.gameObject) {
                            // 如果是太空人，从太空人组中移除
                            if (cell.type === 'astronaut') {
                                this.astronauts.remove(cell.gameObject);
                                // 清理该位置的斧头
                                this.cleanupAxeAtPosition(r, c);
                            }
                            cell.gameObject.destroy();
                        }
                        
                        // 清除格子状态
                        this.gridState[r][c] = null;
                    }
                }
            }
        }
        
        // 检查游戏是否完成
        this.checkGameComplete();
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