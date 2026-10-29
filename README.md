# Retro Space Shooter 2D - Phaser 3

Juego 2D estilo retro vertical space shooter desarrollado con **Phaser 3**, arquitectura modular en **ES Modules** y **Arcade Physics**.

## Estructura Modular del Proyecto

```text
/ (raíz del repositorio)
├── index.html                  # Punto de entrada principal (Live Server & GitHub Pages)
├── README.md                   # Documentación del proyecto
├── assets/                     # Recursos multimedia organizados
│   ├── audio/                  # Efectos de sonido (SFX) y música externa (.gitkeep)
│   ├── fonts/                  # Tipografías retro (.gitkeep)
│   └── images/                 # Sprites, texturas y fondos futuros (.gitkeep)
└── src/                        # Arquitectura modular desacoplada
    ├── audio/
    │   └── RetroAudio.js       # Sintetizador Web Audio API 8-bit procedural (SFX sin dependencias)
    ├── config/
    │   └── gameConfig.js       # Configuración de Phaser, canvas, físicas y récords
    ├── graphics/
    │   └── TextureGenerator.js # Generación procedural de texturas vectoriales en memoria
    ├── scenes/
    │   └── SpaceShooterScene.js# Escena principal: mecánicas, colisiones, HUD y niveles
    └── game.js                 # Punto de entrada / Bootstrap de Phaser.Game
```

## Características Técnicas y de Arquitectura
- **Framework:** Phaser 3 (importado vía CDN en `index.html`).
- **Arquitectura:** ES Modules nativos (`type="module"`), compatible con navegadores modernos, **Live Server** y **GitHub Pages** sin necesidad de empaquetadores (Vite/Webpack).
- **Motor de Audio Retro:** Sintetizador procedural 8-bit mediante **Web Audio API** (`RetroAudio`), eliminando dependencias de archivos externos y problemas de CORS.
- **Resolución:** Canvas de 800x600 px con fondo retro `#0d0e15`.
- **Assets Autocontenidos:** Generación procedural de texturas vectoriales en memoria mediante `TextureGenerator.js`.

## Mecánicas del Juego
- **Controles:**
  - `WASD` o `Flechas del Teclado`: Movimiento de la nave en 8 direcciones.
  - `Barra Espaciadora (SPACE)`: Disparo de proyectiles láser con sonido retro.
  - `ENTER` o `R`: Reiniciar la partida tras Game Over o Victoria.

- **Sistema de Integridad / 3 Vidas (Daño Progresivo):**
  - **3 Vidas (100% Integridad):** Velocidad completa (320 px/s) y cadencia rápida (220 ms).
  - **2 Vidas (Daño en Armas):** La nave dispara más lento (380 ms).
  - **1 Vida (Daño Crítico):** Se mantiene el disparo lento y se reduce la velocidad de maniobra (215 px/s).
  - **0 Vidas:** Destrucción de la nave y Game Over.
  - *Cuadros de invulnerabilidad temporal (i-frames) y sacudida de pantalla al recibir impactos.*

- **Progresión de Niveles:**
  - **Fase 0 (Inicial):**
    - Objetivo: Destruir **10 naves estándar** y **6 meteoritos**.
    - Al completarse, se activa una fanfarria y un anuncio de alerta en pantalla de transición al **Nivel 1**.
  - **Nivel 1:**
    - **Naves Enemigas Armadas:** Disparan proyectiles de plasma hacia el jugador con un sonido alienígena característico.
    - **Naves Pesadas Tier 2:** Cazas acorazados de gran tamaño que requieren **4 impactos** para ser destruidos, con destellos de impacto y recompensa de +100 puntos.
    - Objetivo del Nivel 1: Destruir **4 Naves Tier 2** y **12 naves estándar**.

- **HUD:**
  - Marcador de puntaje actual (`SCORE`).
  - Progreso del objetivo en tiempo real (`FASE 0` / `NIVEL 1`).
  - Indicador de vidas (`VIDAS: ❤️❤️❤️`) y estado de penalización.
  - Persistencia del récord (`RECORD`) en `localStorage`.

## Despliegue en GitHub Pages
1. Sube los cambios a la rama principal (`main`).
2. En GitHub, dirígete a **Settings > Pages**.
3. En **Build and deployment > Branch**, selecciona `main` y la carpeta `/ (root)`.
4. Guarda los cambios. Tu juego estará disponible en:
   `https://<tu-usuario>.github.io/<nombre-del-repositorio>/`
