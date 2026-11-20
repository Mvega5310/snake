# Snake — Documento de Diseño y Arquitectura

## 1. Objetivo
Prototipo de Snake en JavaScript puro + Canvas, pensado como base de aprendizaje del
*game loop* que luego reutilizaremos para Tetris, Tower Defense, etc.

## 2. Mecánica de juego
- Tablero cuadriculado (20x20 celdas de 20px = canvas de 400x400).
- La serpiente se mueve en una dirección constante; el jugador solo puede girar
  (no puede ir directo hacia atrás sobre sí misma).
- Al comer comida, la serpiente crece 1 celda y aparece nueva comida en posición
  aleatoria que no colisione con el cuerpo.
- Game over al chocar contra el borde o contra su propio cuerpo.
- Puntaje = número de comidas consumidas.

## 3. Arquitectura técnica

### 3.1 Estructura de archivos
```
snake-game/
├── index.html      # Estructura HTML + canvas
├── style.css        # Estilos visuales
├── game.js          # Toda la lógica del juego
└── README.md         # Este documento
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

Usamos `setInterval` con un intervalo fijo (velocidad del juego) en lugar de
`requestAnimationFrame` puro, porque Snake se mueve por "ticks" discretos, no
por movimiento continuo. Esto simplifica el control de velocidad.

### 3.3 Modelo de datos
```js
snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}]  // array de segmentos, [0] es la cabeza
direction = {x: 1, y: 0}                                  // vector de movimiento actual
food = {x: 15, y: 7}
score = 0
gameOver = false
```

### 3.4 Funciones principales (en `game.js`)
- `update()` — mueve la cabeza según `direction`, detecta colisión con comida/borde/cuerpo
- `draw()` — limpia y redibuja canvas completo cada tick
- `changeDirection(event)` — listener de teclado, valida que no sea 180° opuesto
- `resetGame()` — reinicia todo el estado
- `gameLoop()` — orquesta update → draw → repetir

## 4. Roadmap incremental
1. ✅ Movimiento + colisiones + comida (prototipo base)
2. Pantalla de "Game Over" con reinicio
3. Velocidad progresiva (más rápido según score)
4. Guardar puntaje máximo en `localStorage`
5. Modo "paredes atraviesan" (teletransporte en bordes) como variante

## 5. Siguiente paso: Tetris
Reutilizamos exactamente este mismo patrón de Game Loop y estructura de carpetas.
Lo que cambia es el modelo de datos: en vez de un array de segmentos, usamos una
matriz 2D (tablero) + una pieza activa (tetromino) que cae y rota.

## 6. Cómo correrlo en VSC
1. Abre la carpeta `snake-game/` en VSC.
2. Instala la extensión "Live Server" (o similar).
3. Clic derecho en `index.html` → "Open with Live Server".
4. Usa las flechas del teclado para jugar.
