// ==============================
// CONFIGURACIÓN
// ==============================
const GRID_SIZE = 20;       // tamaño de cada celda en px
const GRID_COUNT = 20;      // celdas por lado (20x20 = canvas 400x400)
const BASE_SPEED_MS = 130;  // ms entre cada tick del juego

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");

// ==============================
// ESTADO DEL JUEGO
// ==============================
let snake, direction, nextDirection, food, score, gameOver, loopInterval;
let highscore = Number(localStorage.getItem("snake-highscore")) || 0;
highscoreEl.textContent = highscore;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  food = spawnFood();
  score = 0;
  gameOver = false;

  scoreEl.textContent = score;
  gameOverScreen.classList.add("hidden");

  if (loopInterval) clearInterval(loopInterval);
  loopInterval = setInterval(gameLoop, BASE_SPEED_MS);
}

// ==============================
// LÓGICA
// ==============================
function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT),
    };
  } while (snake.some((seg) => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Colisión con bordes
  if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
    return endGame();
  }

  // Colisión con su propio cuerpo
  if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  // ¿Comió?
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    food = spawnFood();
  } else {
    snake.pop(); // si no comió, se mueve (quita la cola)
  }
}

function endGame() {
  gameOver = true;
  clearInterval(loopInterval);

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("snake-highscore", highscore);
    highscoreEl.textContent = highscore;
  }

  gameOverScreen.classList.remove("hidden");
}

// ==============================
// RENDERIZADO
// ==============================
function draw() {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Comida
  ctx.fillStyle = "#f87171";
  ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);

  // Serpiente
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#22c55e" : "#4ade80";
    ctx.fillRect(seg.x * GRID_SIZE, seg.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
  });
}

// ==============================
// GAME LOOP
// ==============================
function gameLoop() {
  if (gameOver) return;
  update();
  if (!gameOver) draw();
}

// ==============================
// CONTROLES
// ==============================
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (key === "ArrowUp" && direction.y === 0) nextDirection = { x: 0, y: -1 };
  else if (key === "ArrowDown" && direction.y === 0) nextDirection = { x: 0, y: 1 };
  else if (key === "ArrowLeft" && direction.x === 0) nextDirection = { x: -1, y: 0 };
  else if (key === "ArrowRight" && direction.x === 0) nextDirection = { x: 1, y: 0 };
});

restartBtn.addEventListener("click", resetGame);

// ==============================
// INICIO
// ==============================
resetGame();
draw();
