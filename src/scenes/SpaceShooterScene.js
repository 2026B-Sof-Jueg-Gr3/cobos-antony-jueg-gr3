/**
 * Escena Principal de Combate Espacial (Phaser 3)
 */

import { retroAudio } from '../audio/RetroAudio.js';
import { createProceduralTextures } from '../graphics/TextureGenerator.js';
import { getStoredHighScore, saveHighScore } from '../config/gameConfig.js';

export class SpaceShooterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceShooterScene' });
  }

  preload() {
    // =========================================================================
    // GUÍA DE INTEGRACIÓN DE RECURSOS EXTERNOS (GitHub Pages & Live Server)
    // =========================================================================
    // Si deseas cargar archivos externos desde 'assets/', usa rutas relativas:
    //
    // --- Carga de Sprites (assets/images/) ---
    // this.load.image('playerShip', 'assets/images/player.png');
    // this.load.image('enemyTier2', 'assets/images/enemy_tier2.png');
    //
    // --- Carga de Audio (assets/audio/) ---
    // this.load.audio('laserSfx', 'assets/audio/laser.wav');
    // this.load.audio('explosionSfx', 'assets/audio/explosion.wav');
    // =========================================================================

    // Generación procedural de texturas vectoriales retro en memoria
    createProceduralTextures(this);
  }

  create() {
    // Estado del juego
    this.score = 0;
    this.highScore = getStoredHighScore();
    this.isGameOver = false;
    this.isVictory = false;
    this.currentLevel = 0; // 0 = Fase Inicial, 1 = Nivel 1
    this.lastFired = 0;

    // Sistema de 3 vidas con penalizaciones progresivas
    this.playerLives = 3;
    this.isInvulnerable = false;

    // Objetivos - Fase 0 (Inicial)
    this.targetShips = 10;
    this.targetMeteors = 6;
    this.shipsDestroyed = 0;
    this.meteorsDestroyed = 0;

    // Objetivos - Nivel 1
    this.targetTier2 = 4;        // 4 Naves Pesadas (4 HP)
    this.targetShipsL1 = 12;     // 12 Naves Normales en Nivel 1
    this.tier2Destroyed = 0;
    this.shipsL1Destroyed = 0;

    // 1. Fondo de estrellas con efecto parallax retro
    this.createStarfield();

    // 2. Grupos de físicas
    this.lasers = this.physics.add.group();
    this.enemyLasers = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.meteors = this.physics.add.group();

    // 3. Creación y configuración de la nave del Jugador
    this.player = this.physics.add.sprite(400, 520, 'playerShip');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(28, 32);
    this.player.body.setOffset(6, 6);

    // 4. Captura de teclas (Flechas, WASD, Disparo y Reinicio)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // 5. Configuración de Colisiones (Overlaps)
    this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.lasers, this.meteors, this.hitMeteor, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.meteors, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.enemyLasers, this.playerHit, null, this);

    // 6. Generador periódico de amenazas
    this.spawnTimer = this.time.addEvent({
      delay: 850,
      callback: this.spawnHazard,
      callbackScope: this,
      loop: true
    });

    // 7. Interfaz de usuario (HUD)
    this.createHUD();
  }

  update(time) {
    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.scene.restart();
      }
      return;
    }

    this.updateStarfield();
    this.handlePlayerMovement();

    if (this.spaceKey.isDown) {
      this.fireLaser(time);
    }

    this.cleanupOutOfBounds();
  }

  createStarfield() {
    this.stars = [];
    const starCount = 65;

    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const isFast = Math.random() < 0.25;

      const size = isFast ? 2 : 1;
      const speed = isFast ? 2.8 : 1.2;
      const alpha = isFast ? 0.95 : 0.55;

      const star = this.add.rectangle(x, y, size, size, 0xffffff, alpha);
      this.stars.push({ obj: star, speed: speed });
    }
  }

  updateStarfield() {
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.obj.y += star.speed;
      if (star.obj.y > 600) {
        star.obj.y = 0;
        star.obj.x = Phaser.Math.Between(0, 800);
      }
    }
  }

  handlePlayerMovement() {
    let vx = 0;
    let vy = 0;

    // Velocidad normal: 320 px/s. Daño crítico en motores (1 vida restante): 215 px/s
    const speed = this.playerLives <= 1 ? 215 : 320;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx -= speed;
    }
    if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx += speed;
    }
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vy -= speed;
    }
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vy += speed;
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);

    if (vx < 0) {
      this.player.setAngle(-8);
    } else if (vx > 0) {
      this.player.setAngle(8);
    } else {
      this.player.setAngle(0);
    }
  }

  fireLaser(time) {
    // Cadencia normal: 220 ms. Armas dañadas (<= 2 vidas): 380 ms
    const currentCooldown = this.playerLives <= 2 ? 380 : 220;

    if (time < this.lastFired + currentCooldown) return;

    this.lastFired = time;

    const laser = this.lasers.create(this.player.x, this.player.y - 24, 'laser');
    if (laser) {
      laser.setVelocityY(-650);
      laser.body.setSize(6, 18);
      retroAudio.playPlayerLaser();
    }
  }

  spawnHazard() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(45, 755);

    if (this.currentLevel === 0) {
      // Fase Inicial (Nivel 0)
      let enemyProb = 0.5;
      if (this.shipsDestroyed >= this.targetShips && this.meteorsDestroyed < this.targetMeteors) {
        enemyProb = 0.2;
      } else if (this.meteorsDestroyed >= this.targetMeteors && this.shipsDestroyed < this.targetShips) {
        enemyProb = 0.8;
      }

      if (Math.random() < enemyProb) {
        this.spawnNormalEnemy(x);
      } else {
        this.spawnMeteor(x);
      }
    } else {
      // Nivel 1: Naves estándar, meteoritos y Naves Pesadas Tier 2 (4 HP)
      const roll = Math.random();
      if (roll < 0.25) {
        this.spawnTier2Enemy(x);
      } else if (roll < 0.70) {
        this.spawnNormalEnemy(x);
      } else {
        this.spawnMeteor(x);
      }
    }
  }

  spawnNormalEnemy(x) {
    const enemy = this.enemies.create(x, -35, 'enemyShip');
    if (enemy) {
      const vy = Phaser.Math.Between(150, 240);
      const vx = Phaser.Math.Between(-45, 45);
      enemy.setVelocity(vx, vy);
      enemy.body.setSize(28, 28);
      enemy.body.setOffset(4, 4);
      enemy.isTier2 = false;
      enemy.hp = 1;
    }
  }

  spawnTier2Enemy(x) {
    const heavy = this.enemies.create(x, -45, 'enemyTier2');
    if (heavy) {
      const vy = Phaser.Math.Between(85, 130);
      const vx = Phaser.Math.Between(-25, 25);
      heavy.setVelocity(vx, vy);
      heavy.body.setSize(44, 40);
      heavy.body.setOffset(3, 3);
      heavy.isTier2 = true;
      heavy.hp = 4;
      heavy.maxHp = 4;
    }
  }

  spawnMeteor(x) {
    const meteor = this.meteors.create(x, -40, 'meteor');
    if (meteor) {
      const vy = Phaser.Math.Between(110, 190);
      const vx = Phaser.Math.Between(-30, 30);
      meteor.setVelocity(vx, vy);
      meteor.setAngularVelocity(Phaser.Math.Between(-70, 70));
      meteor.body.setCircle(17, 4, 4);
    }
  }

  handleEnemyFire() {
    if (this.isGameOver || this.currentLevel < 1) return;

    const onScreenEnemies = [];
    this.enemies.getChildren().forEach(e => {
      if (e.active && e.y > 30 && e.y < 460) {
        onScreenEnemies.push(e);
      }
    });

    if (onScreenEnemies.length === 0) return;

    const shooter = Phaser.Utils.Array.GetRandom(onScreenEnemies);
    const laser = this.enemyLasers.create(shooter.x, shooter.y + 20, 'enemyLaser');
    if (laser) {
      laser.setVelocityY(330);
      laser.body.setSize(6, 16);
      retroAudio.playEnemyLaser();
    }

    onScreenEnemies.forEach(e => {
      if (e.isTier2 && e !== shooter && Math.random() < 0.5) {
        const t2Laser = this.enemyLasers.create(e.x, e.y + 24, 'enemyLaser');
        if (t2Laser) {
          t2Laser.setVelocityY(350);
          t2Laser.body.setSize(6, 16);
        }
      }
    });
  }

  cleanupOutOfBounds() {
    const laserList = this.lasers.getChildren();
    for (let i = laserList.length - 1; i >= 0; i--) {
      if (laserList[i].y < -30) {
        laserList[i].destroy();
      }
    }

    const enemyLaserList = this.enemyLasers.getChildren();
    for (let i = enemyLaserList.length - 1; i >= 0; i--) {
      if (enemyLaserList[i].y > 630) {
        enemyLaserList[i].destroy();
      }
    }

    const enemyList = this.enemies.getChildren();
    for (let i = enemyList.length - 1; i >= 0; i--) {
      if (enemyList[i].y > 640) {
        enemyList[i].destroy();
      }
    }

    const meteorList = this.meteors.getChildren();
    for (let i = meteorList.length - 1; i >= 0; i--) {
      if (meteorList[i].y > 640) {
        meteorList[i].destroy();
      }
    }
  }

  hitEnemy(laser, enemy) {
    const x = enemy.x;
    const y = enemy.y;
    laser.destroy();

    if (enemy.isTier2) {
      enemy.hp--;
      if (enemy.hp > 0) {
        retroAudio.playHit();
        this.createExplosion(x, y, 0xffea00, 6);
        this.addScore(15);

        enemy.setTint(0xffffff);
        this.time.delayedCall(85, () => {
          if (enemy && enemy.active) {
            enemy.clearTint();
          }
        });
        return;
      }
    }

    enemy.destroy();
    retroAudio.playExplosion();

    if (enemy.isTier2) {
      this.createExplosion(x, y, 0xba135d, 22);
      this.createExplosion(x, y, 0xffea00, 16);
      this.addScore(100);

      if (this.currentLevel === 1 && this.tier2Destroyed < this.targetTier2) {
        this.tier2Destroyed++;
        this.updateObjectiveUI();
        this.checkWinCondition();
      }
    } else {
      this.createExplosion(x, y, 0xff1744, 16);
      this.addScore(20);

      if (this.currentLevel === 0) {
        if (this.shipsDestroyed < this.targetShips) {
          this.shipsDestroyed++;
          this.updateObjectiveUI();
          this.checkWinCondition();
        }
      } else if (this.currentLevel === 1) {
        if (this.shipsL1Destroyed < this.targetShipsL1) {
          this.shipsL1Destroyed++;
          this.updateObjectiveUI();
          this.checkWinCondition();
        }
      }
    }
  }

  hitMeteor(laser, meteor) {
    const x = meteor.x;
    const y = meteor.y;
    laser.destroy();
    meteor.destroy();

    retroAudio.playExplosion();
    this.createExplosion(x, y, 0xb8865c, 12);
    this.addScore(10);

    if (this.currentLevel === 0 && this.meteorsDestroyed < this.targetMeteors) {
      this.meteorsDestroyed++;
      this.updateObjectiveUI();
      this.checkWinCondition();
    }
  }

  playerHit(player, hazard) {
    if (this.isGameOver || this.isInvulnerable) return;

    if (hazard) {
      hazard.destroy();
    }

    this.playerLives--;
    this.cameras.main.shake(250, 0.02);

    if (this.playerLives > 0) {
      retroAudio.playPlayerDamage();
      this.createExplosion(player.x, player.y, 0xffa500, 12);
      this.triggerInvulnerability();
      this.updateHUDLives();

      if (this.playerLives === 2) {
        this.showDamageWarning('¡DAÑO EN CAÑONES! (Disparo más lento)');
      } else if (this.playerLives === 1) {
        this.showDamageWarning('¡MOTORES DAÑADOS! (Velocidad reducida)');
      }
    } else {
      this.playerLives = 0;
      this.updateHUDLives();
      this.triggerPlayerDeath();
    }
  }

  triggerInvulnerability() {
    this.isInvulnerable = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      yoyo: true,
      repeat: 6,
      duration: 120,
      onComplete: () => {
        if (this.player && this.player.active) {
          this.player.alpha = 1;
        }
        this.isInvulnerable = false;
      }
    });
  }

  triggerPlayerDeath() {
    this.isGameOver = true;
    retroAudio.playExplosion();

    const x = this.player.x;
    const y = this.player.y;

    this.player.setActive(false);
    this.player.setVisible(false);
    this.player.body.enable = false;

    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.enemyFireTimer) this.enemyFireTimer.remove();

    this.createExplosion(x, y, 0x00f0ff, 25);
    this.createExplosion(x, y, 0xffea00, 20);
    this.createExplosion(x, y, 0xff1744, 18);

    this.cameras.main.shake(350, 0.03);
    this.showGameOverScreen();
  }

  checkWinCondition() {
    if (this.isGameOver) return;

    if (this.currentLevel === 0) {
      if (this.shipsDestroyed >= this.targetShips && this.meteorsDestroyed >= this.targetMeteors) {
        this.transitionToLevel1();
      }
    } else if (this.currentLevel === 1) {
      if (this.tier2Destroyed >= this.targetTier2 && this.shipsL1Destroyed >= this.targetShipsL1) {
        this.triggerVictory();
      }
    }
  }

  transitionToLevel1() {
    this.currentLevel = 1;
    retroAudio.playLevelUp();

    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    this.lasers.clear(true, true);
    this.enemyLasers.clear(true, true);

    this.enemies.getChildren().forEach(e => {
      this.createExplosion(e.x, e.y, 0xff1744, 8);
    });
    this.meteors.getChildren().forEach(m => {
      this.createExplosion(m.x, m.y, 0xb8865c, 8);
    });
    this.enemies.clear(true, true);
    this.meteors.clear(true, true);

    const bannerBox = this.add.rectangle(400, 300, 680, 220, 0x060b19, 0.93);
    bannerBox.setStrokeStyle(3, 0x00f0ff);
    bannerBox.setDepth(20);

    const t1 = this.add.text(400, 225, '¡FASE INICIAL COMPLETADA!', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#39ff14'
    }).setOrigin(0.5).setDepth(21);

    const t2 = this.add.text(400, 265, '► INICIANDO NIVEL 1 ◄', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffea00'
    }).setOrigin(0.5).setDepth(21);

    const t3 = this.add.text(400, 310, '¡ALERTA! Las naves enemigas ahora DISPARAN.', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '16px',
      color: '#ff4444'
    }).setOrigin(0.5).setDepth(21);

    const t4 = this.add.text(400, 342, 'Amenazas Pesadas Tier 2 detectadas (4 HP)', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00f0ff'
    }).setOrigin(0.5).setDepth(21);

    const elements = [bannerBox, t1, t2, t3, t4];

    this.time.delayedCall(2700, () => {
      this.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          elements.forEach(el => el.destroy());

          this.spawnTimer = this.time.addEvent({
            delay: 900,
            callback: this.spawnHazard,
            callbackScope: this,
            loop: true
          });

          this.enemyFireTimer = this.time.addEvent({
            delay: 1150,
            callback: this.handleEnemyFire,
            callbackScope: this,
            loop: true
          });

          this.updateObjectiveUI();
        }
      });
    });

    this.updateObjectiveUI();
  }

  triggerVictory() {
    this.isGameOver = true;
    this.isVictory = true;

    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.enemyFireTimer) this.enemyFireTimer.remove();

    this.player.body.enable = false;

    this.enemies.clear(true, true);
    this.meteors.clear(true, true);
    this.lasers.clear(true, true);
    this.enemyLasers.clear(true, true);

    this.tweens.add({
      targets: this.player,
      y: -90,
      duration: 1000,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.showVictoryScreen();
      }
    });

    const celebrationColors = [0x00f0ff, 0x39ff14, 0xffea00, 0xff0055];
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 150, () => {
        const rx = Phaser.Math.Between(150, 650);
        const ry = Phaser.Math.Between(100, 360);
        this.createExplosion(rx, ry, celebrationColors[i % celebrationColors.length], 20);
      });
    }
  }

  createExplosion(x, y, tint = 0xffa500, count = 12) {
    const shockwave = this.add.circle(x, y, 4, tint, 0.85);
    this.tweens.add({
      targets: shockwave,
      radius: 36,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave.destroy()
    });

    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(3, 5);
      const spark = this.add.rectangle(x, y, size, size, tint);
      const angle = Phaser.Math.Between(0, 360);
      const dist = Phaser.Math.Between(25, 80);
      const rad = Phaser.Math.DegToRad(angle);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(rad) * dist,
        y: y + Math.sin(rad) * dist,
        alpha: 0,
        scale: 0.1,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(280, 520),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  addScore(points) {
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.padNumber(this.score, 5)}`);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
      this.highScoreText.setText(`RECORD: ${this.padNumber(this.highScore, 5)}`);
    }
  }

  padNumber(num, size) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  createHUD() {
    this.add.rectangle(400, 48, 800, 2, 0x1f2937);

    this.scoreText = this.add.text(24, 14, `SCORE: ${this.padNumber(this.score, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    this.objectiveText = this.add.text(400, 14, '', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this.highScoreText = this.add.text(776, 14, `RECORD: ${this.padNumber(this.highScore, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffea00'
    }).setOrigin(1, 0);

    this.livesText = this.add.text(24, 54, '', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    this.updateHUDLives();
    this.updateObjectiveUI();

    const hintText = this.add.text(400, 580, '[WASD / FLECHAS] Mover  •  [ESPACIO] Disparar  •  Supera la Fase Inicial', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hintText,
      alpha: 0,
      delay: 5000,
      duration: 1500,
      onComplete: () => hintText.destroy()
    });
  }

  updateHUDLives() {
    const hearts = '❤️'.repeat(this.playerLives) + '🖤'.repeat(Math.max(0, 3 - this.playerLives));
    let penaltyInfo = '';

    if (this.playerLives === 3) {
      penaltyInfo = ' [INTEGRIDAD: 100%]';
      this.livesText.setColor('#00f0ff');
    } else if (this.playerLives === 2) {
      penaltyInfo = ' [ARMAS DAÑADAS: -40% CADENCIA]';
      this.livesText.setColor('#ffea00');
    } else if (this.playerLives === 1) {
      penaltyInfo = ' [CRÍTICO: CADENCIA & VEL -35%]';
      this.livesText.setColor('#ff3344');
    } else {
      penaltyInfo = ' [DESTRUIDO]';
      this.livesText.setColor('#ff1744');
    }

    this.livesText.setText(`VIDAS: ${hearts}${penaltyInfo}`);
  }

  showDamageWarning(msg) {
    const alertBox = this.add.text(400, 475, msg, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ff3344',
      backgroundColor: '#0a0d1acc',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: alertBox,
      y: 440,
      alpha: 0,
      delay: 1400,
      duration: 500,
      onComplete: () => alertBox.destroy()
    });
  }

  updateObjectiveUI() {
    if (this.currentLevel === 0) {
      const shipsDone = this.shipsDestroyed >= this.targetShips;
      const meteorsDone = this.meteorsDestroyed >= this.targetMeteors;
      const sTag = `NAVES: ${this.shipsDestroyed}/${this.targetShips}${shipsDone ? ' ✓' : ''}`;
      const mTag = `METEOROS: ${this.meteorsDestroyed}/${this.targetMeteors}${meteorsDone ? ' ✓' : ''}`;

      this.objectiveText.setText(`FASE 0: ${sTag} | ${mTag}`);
      this.objectiveText.setColor(shipsDone && meteorsDone ? '#39ff14' : '#ffffff');
    } else {
      const t2Done = this.tier2Destroyed >= this.targetTier2;
      const s1Done = this.shipsL1Destroyed >= this.targetShipsL1;
      const t2Tag = `TIER 2 (4 HP): ${this.tier2Destroyed}/${this.targetTier2}${t2Done ? ' ✓' : ''}`;
      const s1Tag = `NAVES: ${this.shipsL1Destroyed}/${this.targetShipsL1}${s1Done ? ' ✓' : ''}`;

      this.objectiveText.setText(`NIVEL 1: ${t2Tag} | ${s1Tag}`);
      this.objectiveText.setColor(t2Done && s1Done ? '#39ff14' : '#ffea00');
    }
  }

  showVictoryScreen() {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x050a14, 0.88);
    overlay.setDepth(10);

    this.add.text(400, 180, '¡VICTORIA SUPREMA!', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#39ff14'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 245, '¡Has completado el Nivel 1!', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffea00'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 275, 'Destruiste a las 4 Naves Acorazadas Tier 2 y a la flota enemiga', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      color: '#00f0ff'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 325, `PUNTAJE FINAL: ${this.padNumber(this.score, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);

    if (this.score >= this.highScore && this.score > 0) {
      this.add.text(400, 365, '★ ¡NUEVO RECORD CONSEGUIDO! ★', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffea00'
      }).setOrigin(0.5).setDepth(11);
    }

    const restartPrompt = this.add.text(400, 425, 'Presiona [ENTER] o [R] para jugar de nuevo', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#39ff14'
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: restartPrompt,
      alpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 550
    });
  }

  showGameOverScreen() {
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x07080d, 0.85);
    overlay.setDepth(10);

    this.add.text(400, 200, 'GAME OVER', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff1744'
    }).setOrigin(0.5).setDepth(11);

    const levelText = this.currentLevel === 0 ? 'Fase Inicial' : 'Nivel 1';
    this.add.text(400, 260, `Caíste en: ${levelText}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 305, `PUNTAJE FINAL: ${this.padNumber(this.score, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);

    if (this.score >= this.highScore && this.score > 0) {
      this.add.text(400, 345, '¡NUEVO RECORD CONSEGUIDO!', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffea00'
      }).setOrigin(0.5).setDepth(11);
    }

    const restartPrompt = this.add.text(400, 405, 'Presiona [ENTER] o [R] para reiniciar', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00f0ff'
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: restartPrompt,
      alpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 550
    });
  }
}

