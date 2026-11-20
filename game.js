// ==============================
// CONFIGURACIÓN
// ==============================
const GRID_SIZE = 20;       // tamaño de cada celda en px
const GRID_COUNT = 20;      // celdas por lado (20x20 = canvas 400x400)
const BASE_SPEED_MS = 130;  // ms entre cada tick al empezar
const MIN_SPEED_MS = 70;    // velocidad máxima (piso del intervalo)
const SPEED_STEP_MS = 4;    // cuánto baja el intervalo por cada comida
const SWIPE_THRESHOLD = 20; // px mínimos para contar como swipe

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");

// ==============================
// ESTADO DEL JUEGO
// ==============================
let snake, direction, nextDirection, food, score, gameOver, paused, speedMs, loopInterval;
let highscore = Number(localStorage.getItem("snake-highscore")) || 0;
let muted = localStorage.getItem("snake-muted") === "true";
highscoreEl.textContent = highscore;
updateMuteButton();

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
  paused = false;
  speedMs = BASE_SPEED_MS;

  scoreEl.textContent = score;
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");

  if (loopInterval) clearInterval(loopInterval);
  loopInterval = setInterval(gameLoop, speedMs);

  draw();
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
    playEatSound();
    speedUp();
  } else {
    snake.pop(); // si no comió, se mueve (quita la cola)
  }
}

function speedUp() {
  const target = Math.max(MIN_SPEED_MS, BASE_SPEED_MS - score * SPEED_STEP_MS);
  if (target === speedMs) return;
  speedMs = target;
  clearInterval(loopInterval);
  loopInterval = setInterval(gameLoop, speedMs);
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  pauseScreen.classList.toggle("hidden", !paused);
}

function endGame() {
  gameOver = true;
  clearInterval(loopInterval);
  playGameOverSound();

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
  if (gameOver || paused) return;
  update();
  if (!gameOver) draw();
}

// ==============================
// SONIDO (Web Audio API, sin archivos externos)
// ==============================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function beep(freq, duration, type = "sine") {
  if (muted) return;
  const ctx2 = getAudioCtx();
  const osc = ctx2.createOscillator();
  const gain = ctx2.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx2.destination);

  gain.gain.setValueAtTime(0.15, ctx2.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx2.currentTime + duration);

  osc.start();
  osc.stop(ctx2.currentTime + duration);
}

function playEatSound() {
  beep(660, 0.08);
}

function playGameOverSound() {
  beep(160, 0.4, "sawtooth");
}

function updateMuteButton() {
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-pressed", String(muted));
}

muteBtn.addEventListener("click", () => {
  muted = !muted;
  localStorage.setItem("snake-muted", String(muted));
  updateMuteButton();
});

// ==============================
// CONTROLES — TECLADO
// ==============================
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (key === " " || key === "Spacebar") {
    e.preventDefault();
    return togglePause();
  }

  if (gameOver || paused) return;

  if (key === "ArrowUp" && direction.y === 0) nextDirection = { x: 0, y: -1 };
  else if (key === "ArrowDown" && direction.y === 0) nextDirection = { x: 0, y: 1 };
  else if (key === "ArrowLeft" && direction.x === 0) nextDirection = { x: -1, y: 0 };
  else if (key === "ArrowRight" && direction.x === 0) nextDirection = { x: 1, y: 0 };
});

// ==============================
// CONTROLES — TÁCTIL (swipe)
// ==============================
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  (e) => {
    if (gameOver || paused) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && direction.x === 0) nextDirection = { x: 1, y: 0 };
      else if (dx < 0 && direction.x === 0) nextDirection = { x: -1, y: 0 };
    } else {
      if (dy > 0 && direction.y === 0) nextDirection = { x: 0, y: 1 };
      else if (dy < 0 && direction.y === 0) nextDirection = { x: 0, y: -1 };
    }
  },
  { passive: true }
);

restartBtn.addEventListener("click", resetGame);

// ==============================
// INICIO
// ==============================
resetGame();
