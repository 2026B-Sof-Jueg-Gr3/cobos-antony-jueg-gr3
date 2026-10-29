/**
 * Generador Procedural de Texturas Retro
 * Dibuja y almacena en el TextureManager de Phaser los sprites vectoriales en memoria
 * para garantizar 100% de autocontención sin problemas de CORS ni enlaces rotos.
 */

export function createProceduralTextures(scene) {
  // Evitar duplicación si la textura ya existe en caché tras un reinicio de escena
  if (scene.textures.exists('playerShip')) return;

  // =========================================================================
  // 1. Nave del Jugador (Cian / Neón)
  // =========================================================================
  const pGfx = scene.make.graphics({ add: false });
  pGfx.fillStyle(0x00f0ff, 1);
  pGfx.beginPath();
  pGfx.moveTo(20, 2);     // Punta
  pGfx.lineTo(38, 36);    // Ala derecha
  pGfx.lineTo(28, 30);
  pGfx.lineTo(24, 40);    // Propulsor der
  pGfx.lineTo(16, 40);    // Propulsor izq
  pGfx.lineTo(12, 30);
  pGfx.lineTo(2, 36);     // Ala izquierda
  pGfx.closePath();
  pGfx.fillPath();

  pGfx.fillStyle(0x008099, 1);
  pGfx.fillTriangle(20, 10, 27, 28, 13, 28);

  pGfx.fillStyle(0xffffff, 1);
  pGfx.fillTriangle(20, 8, 23, 20, 17, 20);

  pGfx.fillStyle(0x39ff14, 1);
  pGfx.fillRect(17, 38, 6, 4);

  pGfx.generateTexture('playerShip', 40, 44);
  pGfx.destroy();

  // =========================================================================
  // 2. Proyectil Láser del Jugador (Rojo/Amarillo brillante)
  // =========================================================================
  const lGfx = scene.make.graphics({ add: false });
  lGfx.fillStyle(0xff0055, 0.7);
  lGfx.fillRoundedRect(0, 0, 6, 20, 3);
  lGfx.fillStyle(0xffea00, 1);
  lGfx.fillRoundedRect(1, 2, 4, 16, 2);
  lGfx.fillStyle(0xffffff, 1);
  lGfx.fillRect(2, 4, 2, 12);
  lGfx.generateTexture('laser', 6, 20);
  lGfx.destroy();

  // =========================================================================
  // 3. Proyectil Láser Enemigo (Plasma Naranja/Rojo)
  // =========================================================================
  const elGfx = scene.make.graphics({ add: false });
  elGfx.fillStyle(0xff1100, 0.8);
  elGfx.fillRoundedRect(0, 0, 6, 18, 3);
  elGfx.fillStyle(0xff7700, 1);
  elGfx.fillRoundedRect(1, 2, 4, 14, 2);
  elGfx.fillStyle(0xffffcc, 1);
  elGfx.fillRect(2, 4, 2, 10);
  elGfx.generateTexture('enemyLaser', 6, 18);
  elGfx.destroy();

  // =========================================================================
  // 4. Nave Enemiga Estándar (Tier 1 - Rojo carmesí)
  // =========================================================================
  const eGfx = scene.make.graphics({ add: false });
  eGfx.fillStyle(0xff1744, 1);
  eGfx.beginPath();
  eGfx.moveTo(0, 6);
  eGfx.lineTo(10, 14);
  eGfx.lineTo(18, 34);    // Punta hacia abajo
  eGfx.lineTo(26, 14);
  eGfx.lineTo(36, 6);
  eGfx.lineTo(30, 22);
  eGfx.lineTo(22, 18);
  eGfx.lineTo(18, 2);
  eGfx.lineTo(14, 18);
  eGfx.lineTo(6, 22);
  eGfx.closePath();
  eGfx.fillPath();

  eGfx.fillStyle(0xffea00, 1);
  eGfx.fillCircle(18, 16, 4);
  eGfx.fillStyle(0xffffff, 1);
  eGfx.fillCircle(18, 15, 2);

  eGfx.generateTexture('enemyShip', 36, 36);
  eGfx.destroy();

  // =========================================================================
  // 5. Nave Enemiga de 2.° Nivel (Tier 2 - Acorazada / 4 HP)
  // =========================================================================
  const t2Gfx = scene.make.graphics({ add: false });
  // Blindaje morado/carmesí pesado
  t2Gfx.fillStyle(0x791a45, 1);
  t2Gfx.beginPath();
  t2Gfx.moveTo(25, 44);   // Ariete frontal
  t2Gfx.lineTo(45, 22);   // Ala exterior der
  t2Gfx.lineTo(50, 8);    // Alerón superior der
  t2Gfx.lineTo(35, 12);
  t2Gfx.lineTo(25, 2);    // Popa
  t2Gfx.lineTo(15, 12);
  t2Gfx.lineTo(0, 8);     // Alerón superior izq
  t2Gfx.lineTo(5, 22);    // Ala exterior izq
  t2Gfx.closePath();
  t2Gfx.fillPath();

  // Placas de refuerzo
  t2Gfx.fillStyle(0xba135d, 1);
  t2Gfx.fillTriangle(25, 12, 40, 32, 10, 32);

  // Puertos de cañones dobles (Cian)
  t2Gfx.fillStyle(0x00f0ff, 1);
  t2Gfx.fillRect(7, 24, 5, 8);
  t2Gfx.fillRect(38, 24, 5, 8);

  // Reactor dorado central
  t2Gfx.fillStyle(0xffea00, 1);
  t2Gfx.fillCircle(25, 22, 6);
  t2Gfx.fillStyle(0xffffff, 1);
  t2Gfx.fillCircle(25, 21, 3);

  t2Gfx.generateTexture('enemyTier2', 50, 46);
  t2Gfx.destroy();

  // =========================================================================
  // 6. Meteorito / Asteroide
  // =========================================================================
  const mGfx = scene.make.graphics({ add: false });
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

  mGfx.fillStyle(0x483222, 1);
  mGfx.fillCircle(13, 17, 4);
  mGfx.fillCircle(26, 25, 5);
  mGfx.fillCircle(24, 13, 3);

  mGfx.generateTexture('meteor', 42, 42);
  mGfx.destroy();
}

