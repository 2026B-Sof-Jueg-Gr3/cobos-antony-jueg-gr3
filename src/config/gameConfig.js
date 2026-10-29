/**
 * Configuración General del Juego Phaser 3
 */

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const BG_COLOR = '#0d0e15';

export function getStoredHighScore() {
  return parseInt(localStorage.getItem('retro_shmup_highscore') || '0', 10);
}

export function saveHighScore(score) {
  localStorage.setItem('retro_shmup_highscore', score.toString());
}

export function createGameConfig(scene) {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BG_COLOR,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: scene
  };
}

