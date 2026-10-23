/**
 * Retro Space Shooter 2D - Phaser 3
 * 100% autocontenido (texturas generadas proceduralmente en memoria)
 */

// Persistencia del récord (High Score) durante la sesión
let highScore = parseInt(localStorage.getItem('retro_shmup_highscore') || '0', 10);

class SpaceShooterScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceShooterScene' });
  }

  preload() {
    // Generación procedural de texturas vectoriales retro en memoria (sin dependencias externas ni CORS)
    this.createProceduralTextures();
  }

  create() {
    // Estado del juego
    this.score = 0;
    this.isGameOver = false;
    this.lastFired = 0;
    this.fireCooldown = 220; // Cooldown de disparo en milisegundos (~220 ms)

    // 1. Fondo de estrellas con efecto parallax retro
    this.createStarfield();

    // 2. Grupos de físicas
    this.lasers = this.physics.add.group();
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
    // Disparos vs Enemigos y Meteoritos
    this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.lasers, this.meteors, this.hitMeteor, null, this);

    // Jugador vs Enemigos y Meteoritos
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);
    this.physics.add.overlap(this.player, this.meteors, this.playerHit, null, this);

    // 6. Generador periódico de amenazas (Enemigos y Asteroides)
    this.spawnTimer = this.time.addEvent({
      delay: 850,
      callback: this.spawnHazard,
      callbackScope: this,
      loop: true
    });

    // 7. Interfaz de usuario (HUD) con estilo retro monospace
    this.createHUD();
  }

  update(time) {
    // Si la partida terminó, solo escuchamos la tecla de reinicio
    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.scene.restart();
      }
      return;
    }

    // Actualizar movimiento de las estrellas (Parallax)
    this.updateStarfield();

    // Control de movimiento del Jugador (Flechas o WASD)
    this.handlePlayerMovement();

    // Sistema de disparo con cooldown al presionar la barra espaciadora
    if (this.spaceKey.isDown) {
      this.fireLaser(time);
    }

    // Limpieza de entidades fuera de los límites de la pantalla
    this.cleanupOutOfBounds();
  }

  /**
   * Genera las texturas en memoria mediante gráficos geométricos de Phaser
   */
  createProceduralTextures() {
    // Si ya existen (por ejemplo tras reiniciar la escena), no se vuelven a crear
    if (this.textures.exists('playerShip')) return;

    // --- Nave del Jugador (Cian / Verde Neón con cabina y propulsor) ---
    const pGfx = this.make.graphics({ add: false });
    // Alas y fuselaje
    pGfx.fillStyle(0x00f0ff, 1);
    pGfx.beginPath();
    pGfx.moveTo(20, 2);     // Punta
    pGfx.lineTo(38, 36);    // Ala derecha
    pGfx.lineTo(28, 30);    // Quiebre ala der
    pGfx.lineTo(24, 40);    // Propulsor der
    pGfx.lineTo(16, 40);    // Propulsor izq
    pGfx.lineTo(12, 30);    // Quiebre ala izq
    pGfx.lineTo(2, 36);     // Ala izquierda
    pGfx.closePath();
    pGfx.fillPath();

    // Blindaje interior
    pGfx.fillStyle(0x008099, 1);
    pGfx.fillTriangle(20, 10, 27, 28, 13, 28);

    // Cabina brillante
    pGfx.fillStyle(0xffffff, 1);
    pGfx.fillTriangle(20, 8, 23, 20, 17, 20);

    // Fuego de propulsión
    pGfx.fillStyle(0x39ff14, 1);
    pGfx.fillRect(17, 38, 6, 4);

    pGfx.generateTexture('playerShip', 40, 44);
    pGfx.destroy();

    // --- Proyectil Láser (Rojo neón y amarillo brillante) ---
    const lGfx = this.make.graphics({ add: false });
    lGfx.fillStyle(0xff0055, 0.7);
    lGfx.fillRoundedRect(0, 0, 6, 20, 3);
    lGfx.fillStyle(0xffea00, 1);
    lGfx.fillRoundedRect(1, 2, 4, 16, 2);
    lGfx.fillStyle(0xffffff, 1);
    lGfx.fillRect(2, 4, 2, 12);

    lGfx.generateTexture('laser', 6, 20);
    lGfx.destroy();

    // --- Nave Enemiga (Rojo carmesí agresivo con núcleo amarillo) ---
    const eGfx = this.make.graphics({ add: false });
    eGfx.fillStyle(0xff1744, 1);
    eGfx.beginPath();
    eGfx.moveTo(0, 6);      // Ala izq
    eGfx.lineTo(10, 14);
    eGfx.lineTo(18, 34);    // Punta apuntando hacia abajo
    eGfx.lineTo(26, 14);
    eGfx.lineTo(36, 6);     // Ala der
    eGfx.lineTo(30, 22);
    eGfx.lineTo(22, 18);
    eGfx.lineTo(18, 2);     // Popa
    eGfx.lineTo(14, 18);
    eGfx.lineTo(6, 22);
    eGfx.closePath();
    eGfx.fillPath();

    // Ojo / reactor central enemigo
    eGfx.fillStyle(0xffea00, 1);
    eGfx.fillCircle(18, 16, 4);
    eGfx.fillStyle(0xffffff, 1);
    eGfx.fillCircle(18, 15, 2);

    eGfx.generateTexture('enemyShip', 36, 36);
    eGfx.destroy();

    // --- Meteorito / Asteroide (Roca facetada marrón con cráteres) ---
    const mGfx = this.make.graphics({ add: false });
    mGfx.fillStyle(0x7b583f, 1);
    mGfx.lineStyle(2, 0x483222, 1);
    mGfx.beginPath();
    mGfx.moveTo(21, 3);
    mGfx.lineTo(34, 8);
    mGfx.lineTo(39, 22);
    mGfx.lineTo(30, 37);
    mGfx.lineTo(14, 39);
    mGfx.lineTo(3, 27);
    mGfx.lineTo(5, 11);
    mGfx.closePath();
    mGfx.fillPath();
    mGfx.strokePath();

    // Cráteres del meteorito
    mGfx.fillStyle(0x483222, 1);
    mGfx.fillCircle(13, 17, 4);
    mGfx.fillCircle(26, 25, 5);
    mGfx.fillCircle(24, 13, 3);

    mGfx.generateTexture('meteor', 42, 42);
    mGfx.destroy();
  }

  /**
   * Crea el campo estelar con dos planos de profundidad
   */
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

  /**
   * Movimiento en 8 direcciones normalizado para velocidad constante
   */
  handlePlayerMovement() {
    let vx = 0;
    let vy = 0;
    const speed = 320;

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

    // Normalizar vector en diagonal para evitar mayor velocidad
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);

    // Inclinación visual retro al desplazarse lateralmente
    if (vx < 0) {
      this.player.setAngle(-8);
    } else if (vx > 0) {
      this.player.setAngle(8);
    } else {
      this.player.setAngle(0);
    }
  }

  /**
   * Sistema de disparo con límite de cadencia (cooldown)
   */
  fireLaser(time) {
    if (time < this.lastFired + this.fireCooldown) return;

    this.lastFired = time;

    const laser = this.lasers.create(this.player.x, this.player.y - 24, 'laser');
    if (laser) {
      laser.setVelocityY(-650);
      laser.body.setSize(6, 18);
    }
  }

  /**
   * Generación periódica de enemigos o asteroides en la parte superior
   */
  spawnHazard() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(40, 760);
    const isEnemy = Math.random() < 0.45;

    if (isEnemy) {
      // Enemigo (Fighter)
      const enemy = this.enemies.create(x, -35, 'enemyShip');
      if (enemy) {
        const vy = Phaser.Math.Between(150, 240);
        const vx = Phaser.Math.Between(-45, 45);
        enemy.setVelocity(vx, vy);
        enemy.body.setSize(28, 28);
        enemy.body.setOffset(4, 4);
      }
    } else {
      // Meteorito / Asteroide
      const meteor = this.meteors.create(x, -40, 'meteor');
      if (meteor) {
        const vy = Phaser.Math.Between(110, 190);
        const vx = Phaser.Math.Between(-30, 30);
        meteor.setVelocity(vx, vy);
        meteor.setAngularVelocity(Phaser.Math.Between(-70, 70));
        meteor.body.setCircle(17, 4, 4);
      }
    }
  }

  /**
   * Limpieza de proyectiles y amenazas fuera de la pantalla
   */
  cleanupOutOfBounds() {
    // Proyectiles que superan la parte superior
    const laserList = this.lasers.getChildren();
    for (let i = laserList.length - 1; i >= 0; i--) {
      if (laserList[i].y < -30) {
        laserList[i].destroy();
      }
    }

    // Enemigos que salen por la parte inferior
    const enemyList = this.enemies.getChildren();
    for (let i = enemyList.length - 1; i >= 0; i--) {
      if (enemyList[i].y > 640) {
        enemyList[i].destroy();
      }
    }

    // Meteoritos que salen por la parte inferior
    const meteorList = this.meteors.getChildren();
    for (let i = meteorList.length - 1; i >= 0; i--) {
      if (meteorList[i].y > 640) {
        meteorList[i].destroy();
      }
    }
  }

  /**
   * Colisión: Láser impacta Nave Enemiga (+20 puntos)
   */
  hitEnemy(laser, enemy) {
    const x = enemy.x;
    const y = enemy.y;
    laser.destroy();
    enemy.destroy();

    this.createExplosion(x, y, 0xff1744, 16);
    this.addScore(20);
  }

  /**
   * Colisión: Láser impacta Meteorito (+10 puntos)
   */
  hitMeteor(laser, meteor) {
    const x = meteor.x;
    const y = meteor.y;
    laser.destroy();
    meteor.destroy();

    this.createExplosion(x, y, 0xb8865c, 12);
    this.addScore(10);
  }

  /**
   * Colisión: Jugador choca contra enemigo o asteroide (Game Over)
   */
  playerHit(player, hazard) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const x = player.x;
    const y = player.y;

    hazard.destroy();
    player.setActive(false);
    player.setVisible(false);
    player.body.enable = false;

    // Detener generador de enemigos
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    // Explosión masiva del jugador
    this.createExplosion(x, y, 0x00f0ff, 25);
    this.createExplosion(x, y, 0xffea00, 20);
    this.createExplosion(x, y, 0xff1744, 18);

    // Sacudida de cámara retro
    this.cameras.main.shake(320, 0.025);

    // Pantalla de Game Over
    this.showGameOverScreen();
  }

  /**
   * Efecto visual de explosión con onda de choque y chispas
   */
  createExplosion(x, y, tint = 0xffa500, count = 12) {
    // Anillo de choque expansivo
    const shockwave = this.add.circle(x, y, 4, tint, 0.85);
    this.tweens.add({
      targets: shockwave,
      radius: 36,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave.destroy()
    });

    // Partículas de metralla / chispas
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

  /**
   * Suma de puntuación y actualización de récord
   */
  addScore(points) {
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.padNumber(this.score, 5)}`);

    if (this.score > highScore) {
      highScore = this.score;
      localStorage.setItem('retro_shmup_highscore', highScore.toString());
      this.highScoreText.setText(`RECORD: ${this.padNumber(highScore, 5)}`);
    }
  }

  padNumber(num, size) {
    let s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  }

  /**
   * Creación del HUD retro
   */
  createHUD() {
    // Línea divisoria superior retro
    this.add.rectangle(400, 48, 800, 2, 0x1f2937);

    // Texto de Puntaje
    this.scoreText = this.add.text(24, 16, `SCORE: ${this.padNumber(this.score, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00f0ff'
    });

    // Texto de Récord
    this.highScoreText = this.add.text(776, 16, `RECORD: ${this.padNumber(highScore, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffea00'
    }).setOrigin(1, 0);

    // Mensaje tutorial inicial que se desvanece
    const hintText = this.add.text(400, 575, '[WASD / FLECHAS] Mover  •  [ESPACIO] Disparar', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#64748b'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hintText,
      alpha: 0,
      delay: 4500,
      duration: 1500,
      onComplete: () => hintText.destroy()
    });
  }

  /**
   * Despliegue de la pantalla de Game Over
   */
  showGameOverScreen() {
    // Capa de fondo oscurecida
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x07080d, 0.82);
    overlay.setDepth(10);

    // Título GAME OVER
    const title = this.add.text(400, 210, 'GAME OVER', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff1744'
    }).setOrigin(0.5).setDepth(11);

    // Puntaje final alcanzado
    const scoreSummary = this.add.text(400, 285, `PUNTAJE FINAL: ${this.padNumber(this.score, 5)}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);

    // Indicador si superó el récord
    if (this.score >= highScore && this.score > 0) {
      this.add.text(400, 325, '¡NUEVO RECORD CONSEGUIDO!', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffea00'
      }).setOrigin(0.5).setDepth(11);
    }

    // Instrucción para reiniciar con animación titilante
    const restartPrompt = this.add.text(400, 385, 'Presiona [ENTER] o [R] para reiniciar', {
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

// Configuración general del juego en Phaser 3
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0d0e15',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: SpaceShooterScene
};

// Instanciación del juego
const game = new Phaser.Game(config);
