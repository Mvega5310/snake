# 🐍 Snake

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-22c55e.svg)](LICENSE)
[![Deploy a GitHub Pages](https://github.com/Mvega5310/snake/actions/workflows/deploy.yml/badge.svg)](https://github.com/Mvega5310/snake/actions/workflows/deploy.yml)

Snake clásico y **didáctico** en **JavaScript vanilla + Canvas**, sin frameworks ni
build step. Instalable como app (PWA, funciona offline) y pensado para enseñar
jugando: los colores tienen significado pedagógico y hay una leyenda al empezar.

**🎮 Jugar en vivo:** https://mvega5310.github.io/snake/ — abrilo en el celular y
tocá "📲 Instalar juego" (o el ícono de instalar del navegador) para agregarlo a
la pantalla de inicio como una app nativa.

## Psicología del color (diseño pensado para aprender)

| Color      | Elemento              | Qué le enseña al jugador        |
|------------|------------------------|----------------------------------|
| 🟢 Verde   | La serpiente           | Crecer / avanzar — asociación positiva |
| 🟠 Naranja | La comida              | Recompensa — "esto suma, andá por eso" |
| 🔴 Rojo    | Choque / Game Over     | Peligro universal — frená, cuidado |
| 🟡 Dorado  | Logros                 | Mérito, algo especial que ganaste |
| 🔵 Azul    | Pausa                  | Calma — tomate tu tiempo sin presión |

La primera vez que se abre el juego (o tocando el botón ❔), se muestra una leyenda
que explica esto antes de empezar a jugar — el juego se pausa automáticamente
mientras se lee, para que nadie choque mientras aprende las reglas.

## Controles

| Acción            | Teclado          | Táctil (móvil)     |
|-------------------|-------------------|---------------------|
| Moverse           | Flechas           | Deslizar el dedo    |
| Pausar / reanudar | Barra espaciadora | —                   |
| Reiniciar         | Botón "Reiniciar" | Botón "Reiniciar"   |
| Elegir modo       | Botón 🎮          | Botón 🎮            |
| Ver logros        | Botón 🏅          | Botón 🏅            |
| Ver mejores puntajes | Botón 🏆       | Botón 🏆            |
| Silenciar sonido  | Botón 🔊 / 🔇     | Botón 🔊 / 🔇       |

## Retos

**Modos de juego** (botón 🎮, se elige antes de cada partida):
- **Clásico** — los bordes matan, la velocidad sube con el puntaje.
- **Sin Paredes** — atravesás los bordes y aparecés del otro lado (teletransporte).
- **Modo Calma** — velocidad fija y más lenta, pensado para aprender sin presión de tiempo.

**Logros** (botón 🏅, se guardan en `localStorage`): primera manzana, serpiente de
10 segmentos, 10 puntos, sobrevivir 30 segundos, jugar 5 partidas y probar los 3
modos. Se avisan con un toast al desbloquearse.

**Mejores puntajes** (botón 🏆): top 5 local guardado en `localStorage`, con nombre
y modo jugado. Al terminar una partida que entra al top 5, se pide un nombre antes
de volver a la pantalla de Game Over. *(Es un ranking local, no compartido entre
jugadores — un ranking global requeriría un backend.)*

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
├── index.html                      # Estructura HTML + canvas + HUD + leyenda de colores
├── style.css                       # Estilos visuales (responsive)
├── game.js                         # Toda la lógica del juego + registro de la PWA
├── manifest.json                   # Manifest de la PWA (nombre, íconos, modo standalone)
├── sw.js                           # Service worker: cachea assets para que funcione offline
├── icon-source.svg                 # Ícono maestro (editable)
├── icon-192.png / icon-512.png / icon-512-maskable.png   # Íconos generados para la PWA
├── favicon.svg                     # Ícono de la pestaña del navegador
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
  (o la teletransporta en "Sin Paredes"), llama a `checkAchievements()`
- `draw()` — limpia y redibuja canvas completo cada tick
- `speedUp()` — recalcula el intervalo del loop según el puntaje (no-op en Modo Calma)
- `togglePause()` — pausa/reanuda el juego (barra espaciadora)
- `pauseForOverlay()` / `resumeFromOverlay()` — pausan el juego mientras cualquier
  overlay (leyenda, modos, logros, puntajes) está abierto, y lo reanudan al cerrarlo
- `anyOverlayOpen()` — usado por el listener de teclado para no mover la serpiente
  ni togglear la pausa mientras hay un overlay tapando el juego
- `checkAchievements()` / `showAchievementToast()` — detectan y avisan logros nuevos
- `qualifiesForLeaderboard()` / `addToLeaderboard()` — tabla de top 5 en `localStorage`
- `beep()` / `playEatSound()` / `playGameOverSound()` — sonido generado con Web Audio API,
  sin archivos de audio externos
- `resetGame()` — reinicia todo el estado (según `currentMode`) y redibuja de inmediato
- `gameLoop()` — orquesta update → draw → repetir (se salta si `gameOver` o `paused`)
- Listeners de `keydown` (teclado + pausa) y `touchstart`/`touchend` (swipe móvil)

### 3.5 Service worker y versionado de caché
`sw.js` cachea los archivos estáticos con una estrategia *cache-first*. Si se edita
cualquier archivo cacheado (`index.html`, `style.css`, `game.js`, íconos, etc.), hay
que **subir el número en `CACHE_NAME`** (ej. `snake-cache-v2`) dentro de `sw.js` —
si no, quienes ya instalaron el juego van a seguir viendo la versión vieja para
siempre, porque el fetch handler nunca vuelve a pedir esos archivos a la red.

## 4. Roadmap incremental
1. ✅ Movimiento + colisiones + comida (prototipo base)
2. ✅ Pantalla de "Game Over" con reinicio
3. ✅ Velocidad progresiva (más rápido según score)
4. ✅ Guardar puntaje máximo en `localStorage`
5. ✅ Pausa, sonido y controles táctiles para móvil
6. ✅ Despliegue continuo a GitHub Pages vía GitHub Actions
7. ✅ PWA instalable y offline (manifest + service worker + íconos)
8. ✅ Rediseño con psicología del color + leyenda didáctica
9. ✅ Modos de juego (Clásico / Sin Paredes / Modo Calma)
10. ✅ Logros y misiones guardados localmente
11. ✅ Tabla de mejores puntajes local (top 5)
12. 🚧 Ranking global compartido (requeriría backend)

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
