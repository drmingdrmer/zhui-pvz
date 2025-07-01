import { GridSystem } from '../systems/GridSystem.js'
import { DevTools } from '../utils/DevTools.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
        this.gridState = null; // 2D数组，追踪网格上每个格子的状态
        this.astronauts = null; // 用于存放所有太空人的Group
        this.bullets = null; // 用于存放所有子弹的Group
        this.axes = null; // 用于存放所有斧头的Group
        this.targetHeight = null; // 以TNT为基准的目标高度
        this.electricityCount = 0; // 电力数量，从0开始
        this.electricityText = null; // 显示电力数量的文字
    }

    create() {
        const width = this.cameras.main.width
        const height = this.cameras.main.height

        // 游戏背景
        this.add.rectangle(width / 2, height / 2, width, height, 0xffff00)

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

        // 初始化游戏对象组
        this.astronauts = this.add.group();
        this.bullets = this.add.group();
        this.axes = this.add.group();

        // 添加太空人移动定时器
        this.time.addEvent({
            delay: 2000,
            callback: this.moveAstronauts,
            callbackScope: this,
            loop: true
        });

        // 添加太空人随机生成定时器
        this.time.addEvent({
            delay: 3000, // 每3秒生成一个太空人
            callback: this.spawnRandomAstronaut,
            callbackScope: this,
            loop: true
        });

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

        // 在标题下方添加"不能种满屏"提示
        this.add.text(width / 2, 85, '不能种满屏', {
            fontSize: '24px',
            fill: '#ff6666',
            fontFamily: 'Arial',
            stroke: '#330000',
            strokeThickness: 1
        }).setOrigin(0.5)

        // --- 创建左下角的物品选择栏 ---
        const itemKeys = ['item_lightning', 'item_tnt', 'item_battery', 'item_pistol']
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
            
            // 如果是电，添加数量显示
            if (key === 'item_lightning') {
                this.electricityText = this.add.text(boxX + boxSize / 2, boxY + boxSize + 15, '0', {
                    fontSize: '16px',
                    fill: '#ffff00',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                }).setOrigin(0.5);
            } else {
                // 除了电之外的物品都可以拖拽
                itemImage.setInteractive({ useHandCursor: true });
                this.input.setDraggable(itemImage);
                itemImage.setData('type', key);
                itemImage.setData('sourceX', itemImage.x);
                itemImage.setData('sourceY', itemImage.y);
                itemImage.setData('isFromToolbar', true); // 标记来自工具栏
                
                // 设置血量
                if (key === 'item_pistol' || key === 'item_tnt') {
                    itemImage.setData('health', 10);
                    itemImage.setData('maxHealth', 10);
                } else if (key === 'item_battery') {
                    itemImage.setData('health', 10);
                    itemImage.setData('maxHealth', 10);
                }
            }
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
        // 点击网格不再生成太空人，太空人会自动随机生成
        console.log(`点击了网格位置: (${gridPos.row}, ${gridPos.col})`);
    }

    spawnRandomAstronaut() {
        // 随机选择一行
        const randomRow = Phaser.Math.Between(0, this.gridSystem.rows - 1);
        const rightmostCol = this.gridSystem.cols - 1;
        
        // 如果选择的行没有太空人，直接生成
        if (this.gridState[randomRow][rightmostCol] === null) {
            const centerPos = this.gridSystem.getGridCenter(randomRow, rightmostCol);
            this.addAstronaut(centerPos.x, centerPos.y, randomRow, rightmostCol);
            console.log(`在敌人路径第 ${randomRow} 行生成太空人`);
        } else {
            // 如果该行已有太空人，寻找下一个空的行
            let foundEmpty = false;
            for (let i = 0; i < this.gridSystem.rows; i++) {
                const tryRow = (randomRow + i) % this.gridSystem.rows;
                if (this.gridState[tryRow][rightmostCol] === null) {
                    const centerPos = this.gridSystem.getGridCenter(tryRow, rightmostCol);
                    this.addAstronaut(centerPos.x, centerPos.y, tryRow, rightmostCol);
                    console.log(`第 ${randomRow} 行已占用，在第 ${tryRow} 行生成太空人`);
                    foundEmpty = true;
                    break;
                }
            }
            
            // 如果所有行都满了，等待下一次
            if (!foundEmpty) {
                console.log(`所有行都有太空人，等待下次生成`);
            }
        }
    }

    addAstronaut(x, y, row, col) {
        // 确保我们有一个基于TNT高度的目标尺寸
        if (!this.targetHeight) {
            const refTexture = this.textures.get('item_tnt');
            const refHeight = refTexture.source[0].height;
            const cellSize = this.gridSystem.cellSize;
            const padding = 10;
            const scale = (cellSize - padding) / refHeight;
            this.targetHeight = refHeight * scale;
        }

        const astronaut = this.add.image(x, y, 'astronaut');
        
        // 统一大小
        const scaleToMatchHeight = this.targetHeight / astronaut.height;
        astronaut.setScale(scaleToMatchHeight);
        
        // 设置数据
        astronaut.setData('type', 'astronaut');
        astronaut.setData('sourceRow', row);
        astronaut.setData('sourceCol', col);
        astronaut.setData('health', 9);
        astronaut.setData('maxHealth', 9);
        
        // 添加到组，但不占用网格状态（允许多个太空人重叠）
        this.astronauts.add(astronaut);
        
        return astronaut;
    }

    startBatteryProduction(battery, row, col) {
        // 电池每20秒生产一个电
        const productionTimer = this.time.addEvent({
            delay: 20000, // 20秒
            callback: () => {
                this.produceLightning(battery, row, col);
            },
            callbackScope: this,
            loop: true
        });
        
        // 将定时器存储在电池对象中，以便清理
        battery.setData('productionTimer', productionTimer);
        console.log(`电池在 (${row}, ${col}) 开始生产，每20秒生产一个电`);
    }

    produceLightning(battery, row, col) {
        // 检查电池是否还存在
        if (!battery.active || this.gridState[row][col]?.gameObject !== battery) {
            return;
        }
        
        // 在电池上方生成一个可点击的电
        const lightning = this.add.image(battery.x, battery.y - 40, 'item_lightning');
        
        // 设置闪电大小小于一个铁板格子
        const cellSize = this.gridSystem.cellSize; // 80像素
        const maxSize = cellSize * 0.8; // 铁板大小的80%
        const scale = Math.min(maxSize / lightning.width, maxSize / lightning.height);
        lightning.setScale(scale);
        lightning.setInteractive({ useHandCursor: true });
        
        // 设置点击事件
        lightning.on('pointerdown', () => {
            this.collectElectricity(lightning);
        });
        
        // 添加闪烁效果
        this.tweens.add({
            targets: lightning,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: 3
        });
        
        console.log(`电池在 (${row}, ${col}) 生产了一个电`);
    }

    collectElectricity(lightning) {
        // 收集电力，增加25点
        this.electricityCount += 25;
        
        // 更新物品栏闪电下方的数量显示
        if (this.electricityText) {
            this.electricityText.setText(this.electricityCount.toString());
        }
        
        // 销毁电力图标
        lightning.destroy();
        
        console.log(`收集了电力，当前电力: ${this.electricityCount}`);
    }

    updateInfoDisplay() {
        const gridInfo = this.gridSystem.getGridInfo()
        this.infoText.setText(
            `铁板: ${gridInfo.rows}×7 (${7 * gridInfo.rows}块)\n` +
            `已占用: ${gridInfo.occupiedCells}/${gridInfo.totalCells - 10}`
        )
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
            const type = gameObject.getData('type');
            const isFromToolbar = gameObject.getData('isFromToolbar');

            // 检查是否是有效的放置位置 (在网格内，且目标格子为空)
            if (row !== -1 && col !== -1 && this.gridState[row][col] === null) {
                // 有效，放置到新位置
                const centerPos = this.gridSystem.getGridCenter(row, col);
                
                let placedObject = gameObject;
                
                // 如果来自工具栏，创建一个副本并将原对象放回工具栏
                if (isFromToolbar) {
                    // 创建副本
                    placedObject = this.add.image(centerPos.x, centerPos.y, type);
                    placedObject.setScale(gameObject.scaleX);
                    placedObject.setData('type', type);
                    placedObject.setData('sourceRow', row);
                    placedObject.setData('sourceCol', col);
                    placedObject.setData('isFromToolbar', false);
                    
                    // 复制血量数据
                    if (gameObject.getData('health')) {
                        placedObject.setData('health', gameObject.getData('health'));
                        placedObject.setData('maxHealth', gameObject.getData('maxHealth'));
                    }
                    
                    // 原对象回到工具栏位置
                    const sourceX = gameObject.getData('sourceX');
                    const sourceY = gameObject.getData('sourceY');
                    gameObject.setPosition(sourceX, sourceY);
                } else {
                    // 不是来自工具栏，直接移动
                    placedObject.setPosition(centerPos.x, centerPos.y);
                    placedObject.setData('sourceRow', row);
                    placedObject.setData('sourceCol', col);
                }

                // 更新网格状态
                this.gridState[row][col] = { type: type, gameObject: placedObject };
                
                // 如果是TNT，立即爆炸
                if (type === 'item_tnt') {
                    this.time.delayedCall(200, () => {
                        this.explodeTNT(row, col);
                    });
                } else if (type === 'item_battery') {
                    // 电池开始生产电
                    this.startBatteryProduction(placedObject, row, col);
                    placedObject.disableInteractive();
                } else {
                    // 其他物品放置后禁用拖拽
                    placedObject.disableInteractive();
                }
                
                console.log(`将 ${type} 放置在 (${row}, ${col})`);
            } else {
                // 无效，弹回原处
                const sourceX = gameObject.getData('sourceX');
                const sourceY = gameObject.getData('sourceY');
                gameObject.setPosition(sourceX, sourceY);
                console.log(`无效放置，已弹回`);
            }
        });
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
            // 检查这一行是否有太空人（从太空人组中检查）
            this.astronauts.getChildren().forEach(astronaut => {
                if (astronaut.getData('sourceRow') === r) {
                    astronautInRow = true;
                }
            });

            if (astronautInRow) {
                // 如果有太空人，就让这一行所有的手枪射击
                for (let c = 0; c < this.gridSystem.cols; c++) {
                    const cell = this.gridState[r][c];
                    if (cell && cell.type === 'item_pistol') {
                        const pistol = cell.gameObject;
                        const now = this.time.now;
                        const lastShot = pistol.getData('lastShot') || 0;
                        const cooldown = 1000; // 1秒冷却

                        if (now - lastShot > cooldown) {
                            pistol.setData('lastShot', now);
                            this.shootBullet(pistol.x, pistol.y);
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
        
        // 血量归零时销毁太空人
        if (health <= 0) {
            const row = astronaut.getData('sourceRow');
            const col = astronaut.getData('sourceCol');
            
            // 从太空人组中移除（不需要清理gridState，因为太空人不占用它）
            this.astronauts.remove(astronaut);
            astronaut.destroy();
            
            // 清理该位置的斧头
            this.cleanupAxeAtPosition(row, col);
        }
    }

    moveAstronauts() {
        Phaser.Actions.Call(this.astronauts.getChildren(), (astronaut) => {
            if (!astronaut.active || astronaut.getData('isMoving')) {
                return;
            }

            const sourceRow = astronaut.getData('sourceRow');
            const sourceCol = astronaut.getData('sourceCol');
            const targetCol = sourceCol - 1;

            // 检查左侧格子是否有障碍物
            if (targetCol >= 0 && this.gridState[sourceRow][targetCol] && 
                (this.gridState[sourceRow][targetCol].type === 'item_pistol' || 
                 this.gridState[sourceRow][targetCol].type === 'item_tnt' ||
                 this.gridState[sourceRow][targetCol].type === 'item_battery')) {
                
                // 有障碍物，在当前位置生成斧头
                this.createAxe(sourceRow, sourceCol);
                return;
            }

            // 检查左侧格子是否可以移动（太空人可以重叠，只有植物不能重叠）
            if (targetCol >= 0) {
                const targetCell = this.gridState[sourceRow][targetCol];
                const canMove = targetCell === null || targetCell.type === 'astronaut';
                
                if (canMove) {
                    astronaut.setData('isMoving', true);

                    // 如果目标位置是空的或者只有太空人，可以移动
                    // 太空人移动不更新gridState（允许重叠）
                    // 只有植物才占用gridState
                    
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
            }
        });
    }

    createAxe(row, col) {
        // 检查该位置是否已经有斧头
        const existingAxe = this.axes.getChildren().find(axe => 
            axe.getData('row') === row && axe.getData('col') === col
        );
        
        if (existingAxe) {
            return;
        }

        const centerPos = this.gridSystem.getGridCenter(row, col);
        const axe = this.add.rectangle(centerPos.x, centerPos.y, 30, 10, 0x8B4513);
        axe.setStrokeStyle(2, 0x654321);
        
        axe.setData('row', row);
        axe.setData('col', col);
        
        this.axes.add(axe);
    }

    cleanupAxeAtPosition(row, col) {
        const axeToRemove = this.axes.getChildren().find(axe => 
            axe.getData('row') === row && axe.getData('col') === col
        );
        
        if (axeToRemove) {
            this.axes.remove(axeToRemove);
            axeToRemove.destroy();
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
                 this.gridState[axeRow][targetCol].type === 'item_tnt' ||
                 this.gridState[axeRow][targetCol].type === 'item_battery')) {
                
                const plant = this.gridState[axeRow][targetCol].gameObject;
                this.axeAttackPlant(axe, plant, axeRow, targetCol);
            }
        });
    }

    axeAttackPlant(axe, plant, row, col) {
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
        
        // 植物血量归零时销毁
        if (health <= 0) {
            // 如果是电池，清理生产定时器
            if (plant.getData('type') === 'item_battery') {
                const timer = plant.getData('productionTimer');
                if (timer) {
                    timer.remove();
                }
            }
            
            this.gridState[row][col] = null;
            plant.destroy();
        }
    }

    explodeTNT(centerRow, centerCol) {
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

        // 影响3x3范围内的所有物体
        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (r >= 0 && r < this.gridSystem.rows && c >= 0 && c < this.gridSystem.cols) {
                    const cell = this.gridState[r][c];
                    if (cell) {
                        // 销毁植物
                        if (cell.gameObject) {
                            if (cell.type === 'item_battery') {
                                // 清理电池的生产定时器
                                const timer = cell.gameObject.getData('productionTimer');
                                if (timer) {
                                    timer.remove();
                                }
                            }
                            cell.gameObject.destroy();
                        }
                        
                        // 清除格子状态
                        this.gridState[r][c] = null;
                    }
                    
                    // 单独处理该区域内的太空人
                    this.astronauts.getChildren().forEach(astronaut => {
                        const astronautRow = astronaut.getData('sourceRow');
                        const astronautCol = astronaut.getData('sourceCol');
                        if (astronautRow === r && astronautCol === c) {
                            this.astronauts.remove(astronaut);
                            astronaut.destroy();
                            this.cleanupAxeAtPosition(r, c);
                        }
                    });
                }
            }
        }
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