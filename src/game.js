/**
 * Punto de Entrada Principal (Bootstrap)
 * Inicializa la instancia del juego Phaser 3 cargando la escena y la configuración modular
 * Compatible con Live Server y GitHub Pages mediante ES Modules nativos
 */

import { SpaceShooterScene } from './scenes/SpaceShooterScene.js';
import { createGameConfig } from './config/gameConfig.js';

// Generar la configuración general inyectando la escena principal
const config = createGameConfig(SpaceShooterScene);

// Inicializar la instancia de Phaser 3
const game = new Phaser.Game(config);

export default game;
