# 🐍 Snake

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-22c55e.svg)](LICENSE)
[![Deploy a GitHub Pages](https://github.com/Mvega5310/snake/actions/workflows/deploy.yml/badge.svg)](https://github.com/Mvega5310/snake/actions/workflows/deploy.yml)

Snake clásico en **JavaScript vanilla + Canvas**, sin frameworks ni build step.
Pensado como base de aprendizaje del *game loop* que luego se reutiliza para
otros prototipos (Tetris, Tower Defense, etc.).

**🎮 Jugar en vivo:** https://mvega5310.github.io/snake/
*(requiere activar GitHub Pages en Settings → Pages → Source: "GitHub Actions")*

## Controles

| Acción            | Teclado          | Táctil (móvil)     |
|-------------------|-------------------|---------------------|
| Moverse           | Flechas           | Deslizar el dedo    |
| Pausar / reanudar | Barra espaciadora | —                   |
| Reiniciar         | Botón "Reiniciar" | Botón "Reiniciar"   |
| Silenciar sonido  | Botón 🔊 / 🔇     | Botón 🔊 / 🔇       |

## 1. Objetivo
Prototipo de Snake en JavaScript puro + Canvas, pensado como base de aprendizaje del
*game loop* que luego reutilizaremos para Tetris, Tower Defense, etc.

## 2. Mecánica de juego
- Tablero cuadriculado (20x20 celdas de 20px = canvas de 400x400, escalado de forma
  responsive en pantallas chicas).
- La serpiente se mueve en una dirección constante; el jugador solo puede girar
  (no puede ir directo hacia atrás sobre sí misma — la validación compara contra la
  dirección ya confirmada, no contra el buffer pendiente, así que no hay forma de
  encolar un giro de 180° aunque se presionen teclas muy rápido).
- Al comer comida, la serpiente crece 1 celda, aparece nueva comida en posición
  aleatoria que no colisione con el cuerpo, suena un beep y la velocidad aumenta
  levemente (hasta un piso de `MIN_SPEED_MS`).
- Se puede pausar y reanudar en cualquier momento con la barra espaciadora.
- Game over al chocar contra el borde o contra su propio cuerpo, con un beep distinto.
- Puntaje = número de comidas consumidas. El máximo se guarda en `localStorage`.

## 3. Arquitectura técnica

### 3.1 Estructura de archivos
```
snake/
├── index.html                      # Estructura HTML + canvas + HUD
├── style.css                       # Estilos visuales (responsive)
├── game.js                         # Toda la lógica del juego
├── favicon.svg                     # Ícono del sitio
├── LICENSE                         # Licencia MIT
├── .gitignore
├── .github/workflows/deploy.yml    # CI: publica en GitHub Pages en cada push a main
└── README.md                       # Este documento
```

### 3.2 El Game Loop (el corazón del juego)
Todo juego en canvas sigue este patrón, sin importar su complejidad:

```
loop():
  1. actualizar estado (mover serpiente, detectar colisiones)
  2. limpiar canvas
  3. dibujar estado actual (serpiente, comida, score)
  4. esperar el siguiente frame → volver a loop()
```

Usamos `setInterval` con un intervalo variable (velocidad del juego, que baja a
medida que sube el puntaje) en lugar de `requestAnimationFrame` puro, porque Snake
se mueve por "ticks" discretos, no por movimiento continuo. Esto simplifica el
control de velocidad: cada vez que cambia, simplemente se reinicia el `setInterval`
con el nuevo valor (`speedUp()` en `game.js`).

### 3.3 Modelo de datos
```js
snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}]  // array de segmentos, [0] es la cabeza
direction = {x: 1, y: 0}                                  // vector de movimiento actual
food = {x: 15, y: 7}
score = 0
gameOver = false
paused = false
speedMs = 130                                             // intervalo actual del game loop
```

### 3.4 Funciones principales (en `game.js`)
- `update()` — mueve la cabeza según `direction`, detecta colisión con comida/borde/cuerpo
- `draw()` — limpia y redibuja canvas completo cada tick
- `speedUp()` — recalcula el intervalo del loop según el puntaje
- `togglePause()` — pausa/reanuda el juego (barra espaciadora)
- `beep()` / `playEatSound()` / `playGameOverSound()` — sonido generado con Web Audio API,
  sin archivos de audio externos
- `resetGame()` — reinicia todo el estado y redibuja de inmediato
- `gameLoop()` — orquesta update → draw → repetir (se salta si `gameOver` o `paused`)
- Listeners de `keydown` (teclado + pausa) y `touchstart`/`touchend` (swipe móvil)

## 4. Roadmap incremental
1. ✅ Movimiento + colisiones + comida (prototipo base)
2. ✅ Pantalla de "Game Over" con reinicio
3. ✅ Velocidad progresiva (más rápido según score)
4. ✅ Guardar puntaje máximo en `localStorage`
5. ✅ Pausa, sonido y controles táctiles para móvil
6. ✅ Despliegue continuo a GitHub Pages vía GitHub Actions
7. Modo "paredes atraviesan" (teletransporte en bordes) como variante

## 5. Siguiente paso: Tetris
Reutilizamos exactamente este mismo patrón de Game Loop y estructura de carpetas.
Lo que cambia es el modelo de datos: en vez de un array de segmentos, usamos una
matriz 2D (tablero) + una pieza activa (tetromino) que cae y rota.

## 6. Cómo correrlo localmente
1. Clona el repo o abre la carpeta en tu editor.
2. Instala la extensión "Live Server" de VS Code (o similar) — o simplemente
   abre `index.html` directo en el navegador, no requiere build ni dependencias.
3. Clic derecho en `index.html` → "Open with Live Server".
4. Usa las flechas del teclado (o deslizá el dedo en móvil) para jugar.

## 7. Despliegue
Cada push a `main` dispara `.github/workflows/deploy.yml`, que publica el contenido
del repo (sitio estático, sin build) en GitHub Pages. Para activarlo la primera vez:
**Settings → Pages → Source → "GitHub Actions"** en el repositorio de GitHub.
