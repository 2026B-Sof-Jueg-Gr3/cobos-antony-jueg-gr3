# Retro Space Shooter 2D - Phaser 3

Juego 2D estilo retro vertical space shooter desarrollado con **Phaser 3** y **Arcade Physics**.

## Estructura del Proyecto

```text
/ (raíz del repositorio)
├── index.html          # Punto de entrada principal (Live Server & GitHub Pages)
├── README.md           # Documentación del proyecto
├── src/                # Lógica del juego
│   └── game.js         # Código del juego, mecánicas, HUD y escenas
└── assets/             # Recursos multimedia organizados
    ├── images/         # Sprites, texturas y fondos futuros
    ├── audio/          # Efectos de sonido (SFX) y música de fondo
    └── fonts/          # Tipografías retro y personalizadas
```

## Características Técnicas y de Arquitectura
- **Framework:** Phaser 3 (importado vía CDN en `index.html`).
- **Compatibilidad:** 100% compatible con **Live Server** y **GitHub Pages** (rutas relativas sin slash inicial).
- **Resolución:** Canvas de 800x600 px con fondo retro `#0d0e15`.
- **Assets Autocontenidos:** Generación procedural de texturas vectoriales en memoria mediante `make.graphics`, eliminando problemas de CORS o enlaces rotos.

## Mecánicas del Juego
- **Controles:**
  - `WASD` o `Flechas del Teclado`: Movimiento de la nave en 8 direcciones.
  - `Barra Espaciadora (SPACE)`: Disparo de proyectiles láser (cooldown de ~220 ms).
  - `ENTER` o `R`: Reiniciar la partida tras Game Over o Victoria.
- **Misión / Objetivo:**
  - Destruir **10 naves enemigas**.
  - Destruir **6 meteoritos**.
- **HUD:**
  - Marcador de puntaje actual (`SCORE`).
  - Progreso del objetivo en tiempo real (`MISIÓN: NAVES x/10 | METEOROS y/6`).
  - Persistencia del récord (`RECORD`) en `localStorage`.

## Despliegue en GitHub Pages
1. Sube los cambios a la rama principal (`main`).
2. En GitHub, dirígete a **Settings > Pages**.
3. En **Build and deployment > Branch**, selecciona `main` y la carpeta `/ (root)`.
4. Guarda los cambios. Tu juego estará disponible en:
   `https://<tu-usuario>.github.io/<nombre-del-repositorio>/`
