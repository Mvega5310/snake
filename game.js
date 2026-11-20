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
const legendScreen = document.getElementById("legendScreen");
const legendBtn = document.getElementById("legendBtn");
const legendCloseBtn = document.getElementById("legendCloseBtn");
const installBtn = document.getElementById("installBtn");
const modeScreen = document.getElementById("modeScreen");
const modeBtn = document.getElementById("modeBtn");
const modeCancelBtn = document.getElementById("modeCancelBtn");
const modeOptionButtons = document.querySelectorAll(".mode-option");
const achievementsScreen = document.getElementById("achievementsScreen");
const achievementsBtn = document.getElementById("achievementsBtn");
const achievementsCloseBtn = document.getElementById("achievementsCloseBtn");
const achievementsList = document.getElementById("achievementsList");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const leaderboardCloseBtn = document.getElementById("leaderboardCloseBtn");
const leaderboardList = document.getElementById("leaderboardList");
const nameEntryScreen = document.getElementById("nameEntryScreen");
const nameEntryScore = document.getElementById("nameEntryScore");
const nameInput = document.getElementById("nameInput");
const nameSaveBtn = document.getElementById("nameSaveBtn");
const achievementToast = document.getElementById("achievementToast");

// Paleta con intención pedagógica (psicología del color):
// verde = crecer/avanzar, naranja = recompensa, rojo = peligro,
// dorado = logro, azul = calma/pausa.
const COLOR_SNAKE_HEAD = "#22c55e";
const COLOR_SNAKE_BODY = "#4ade80";
const COLOR_FOOD = "#fb923c";
const COLOR_BG = "#1f2937";

// ==============================
// MODOS DE JUEGO
// ==============================
const MODES = {
  classic: { id: "classic", label: "Clásico", wrap: false, progressiveSpeed: true, baseSpeed: BASE_SPEED_MS },
  noWalls: { id: "noWalls", label: "Sin Paredes", wrap: true, progressiveSpeed: true, baseSpeed: BASE_SPEED_MS },
  calm: { id: "calm", label: "Modo Calma", wrap: false, progressiveSpeed: false, baseSpeed: 170 },
};
let currentMode = MODES.classic;

// ==============================
// LOGROS
// ==============================
const ACHIEVEMENTS = [
  { id: "primera-manzana", title: "Primera manzana", desc: "Comé tu primera comida." },
  { id: "serpiente-larga", title: "Serpiente larga", desc: "Alcanzá una serpiente de 10 segmentos." },
  { id: "diez-puntos", title: "Diez puntos", desc: "Llegá a un puntaje de 10." },
  { id: "treinta-segundos", title: "Resistencia", desc: "Sobreviví 30 segundos sin chocar." },
  { id: "cinco-partidas", title: "Jugador constante", desc: "Jugá 5 partidas." },
  { id: "explorador", title: "Explorador", desc: "Probá los 3 modos de juego." },
];

// ==============================
// ESTADO DEL JUEGO
// ==============================
let snake, direction, nextDirection, food, score, gameOver, paused, speedMs, loopInterval;
let runStartedAt = 0;
let pendingScore = 0;
let highscore = Number(localStorage.getItem("snake-highscore")) || 0;
let muted = localStorage.getItem("snake-muted") === "true";
let gamesPlayed = Number(localStorage.getItem("snake-games-played")) || 0;
let modesPlayed = new Set(JSON.parse(localStorage.getItem("snake-modes-played") || "[]"));
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
  speedMs = currentMode.baseSpeed;
  runStartedAt = Date.now();

  scoreEl.textContent = score;
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");

  modesPlayed.add(currentMode.id);
  localStorage.setItem("snake-modes-played", JSON.stringify([...modesPlayed]));

  if (loopInterval) clearInterval(loopInterval);
  loopInterval = setInterval(gameLoop, speedMs);

  draw();
  checkAchievements();
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

  // Colisión con bordes: en "Sin Paredes" se teletransporta al lado opuesto
  if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
    if (currentMode.wrap) {
      head.x = (head.x + GRID_COUNT) % GRID_COUNT;
      head.y = (head.y + GRID_COUNT) % GRID_COUNT;
    } else {
      return endGame();
    }
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

  checkAchievements();
}

function speedUp() {
  if (!currentMode.progressiveSpeed) return;
  const target = Math.max(MIN_SPEED_MS, currentMode.baseSpeed - score * SPEED_STEP_MS);
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
  flashDanger();

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("snake-highscore", highscore);
    highscoreEl.textContent = highscore;
  }

  gamesPlayed++;
  localStorage.setItem("snake-games-played", String(gamesPlayed));
  checkAchievements();

  gameOverScreen.classList.remove("hidden");

  if (qualifiesForLeaderboard(score)) {
    pendingScore = score;
    nameEntryScore.textContent = score;
    nameInput.value = "";
    nameEntryScreen.classList.remove("hidden");
    nameInput.focus();
  }
}

function flashDanger() {
  canvas.classList.remove("danger-flash");
  // forzar reflow para poder re-disparar la animación en choques consecutivos
  void canvas.offsetWidth;
  canvas.classList.add("danger-flash");
}

// ==============================
// RENDERIZADO
// ==============================
function drawCell(x, y, color) {
  const px = x * GRID_SIZE;
  const py = y * GRID_SIZE;
  const size = GRID_SIZE - 2;
  const radius = 5;

  ctx.fillStyle = color;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px, py, size, size, radius);
  } else {
    ctx.rect(px, py, size, size);
  }
  ctx.fill();
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Comida (naranja = recompensa)
  drawCell(food.x, food.y, COLOR_FOOD);

  // Serpiente (verde = crecer/avanzar)
  snake.forEach((seg, i) => {
    drawCell(seg.x, seg.y, i === 0 ? COLOR_SNAKE_HEAD : COLOR_SNAKE_BODY);
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

  if (anyOverlayOpen()) return;

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
// OVERLAYS: pausa compartida + helper de "hay alguno abierto"
// ==============================
const ALL_OVERLAYS = [legendScreen, modeScreen, achievementsScreen, leaderboardScreen, nameEntryScreen];

function anyOverlayOpen() {
  return ALL_OVERLAYS.some((el) => !el.classList.contains("hidden"));
}

let pausedByOverlay = false;

function pauseForOverlay() {
  if (!gameOver && !paused) {
    pausedByOverlay = true;
    paused = true;
    pauseScreen.classList.remove("hidden");
  }
}

function resumeFromOverlay() {
  if (pausedByOverlay) {
    pausedByOverlay = false;
    paused = false;
    pauseScreen.classList.add("hidden");
  }
}

// ==============================
// LEYENDA DE COLORES (onboarding didáctico)
// ==============================
function showLegend() {
  pauseForOverlay();
  legendScreen.classList.remove("hidden");
}

function hideLegend() {
  legendScreen.classList.add("hidden");
  localStorage.setItem("snake-seen-legend", "true");
  resumeFromOverlay();
}

legendBtn.addEventListener("click", showLegend);
legendCloseBtn.addEventListener("click", hideLegend);

// ==============================
// MODOS DE JUEGO (selección)
// ==============================
function highlightCurrentMode() {
  modeOptionButtons.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.mode === currentMode.id);
  });
}

function showModeScreen() {
  pauseForOverlay();
  highlightCurrentMode();
  modeScreen.classList.remove("hidden");
}

function hideModeScreen() {
  modeScreen.classList.add("hidden");
  resumeFromOverlay();
}

modeBtn.addEventListener("click", showModeScreen);
modeCancelBtn.addEventListener("click", hideModeScreen);

modeOptionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = MODES[btn.dataset.mode];
    modeScreen.classList.add("hidden");
    pausedByOverlay = false;
    resetGame();
  });
});

// ==============================
// LOGROS
// ==============================
let toastQueue = [];
let toastShowing = false;

function showAchievementToast(id) {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return;
  toastQueue.push(def);
  if (!toastShowing) processToastQueue();
}

function processToastQueue() {
  const next = toastQueue.shift();
  if (!next) {
    toastShowing = false;
    return;
  }
  toastShowing = true;
  achievementToast.textContent = `🏅 ¡Logro desbloqueado! ${next.title}`;
  achievementToast.classList.add("show");
  setTimeout(() => {
    achievementToast.classList.remove("show");
    setTimeout(processToastQueue, 300);
  }, 2500);
}

function checkAchievements() {
  const unlocked = new Set(JSON.parse(localStorage.getItem("snake-achievements") || "[]"));
  const newly = [];
  const tryUnlock = (id) => {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newly.push(id);
    }
  };

  if (score >= 1) tryUnlock("primera-manzana");
  if (snake.length >= 10) tryUnlock("serpiente-larga");
  if (score >= 10) tryUnlock("diez-puntos");
  if (!gameOver && Date.now() - runStartedAt >= 30000) tryUnlock("treinta-segundos");
  if (gamesPlayed >= 5) tryUnlock("cinco-partidas");
  if (modesPlayed.size >= 3) tryUnlock("explorador");

  if (newly.length) {
    localStorage.setItem("snake-achievements", JSON.stringify([...unlocked]));
    newly.forEach(showAchievementToast);
  }
}

function renderAchievements() {
  const unlocked = new Set(JSON.parse(localStorage.getItem("snake-achievements") || "[]"));
  achievementsList.innerHTML = "";

  ACHIEVEMENTS.forEach((a) => {
    const isUnlocked = unlocked.has(a.id);
    const li = document.createElement("li");
    li.className = `achievement ${isUnlocked ? "unlocked" : "locked"}`;

    const icon = document.createElement("span");
    icon.className = "achievement-icon";
    icon.textContent = isUnlocked ? "🏅" : "🔒";

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = a.title;
    const desc = document.createElement("span");
    desc.className = "achievement-desc";
    desc.textContent = a.desc;
    text.append(title, document.createElement("br"), desc);

    li.append(icon, text);
    achievementsList.appendChild(li);
  });
}

function showAchievementsScreen() {
  pauseForOverlay();
  renderAchievements();
  achievementsScreen.classList.remove("hidden");
}

function hideAchievementsScreen() {
  achievementsScreen.classList.add("hidden");
  resumeFromOverlay();
}

achievementsBtn.addEventListener("click", showAchievementsScreen);
achievementsCloseBtn.addEventListener("click", hideAchievementsScreen);

// ==============================
// TABLA DE MEJORES PUNTAJES (local)
// ==============================
function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem("snake-leaderboard")) || [];
  } catch {
    return [];
  }
}

function saveLeaderboard(list) {
  localStorage.setItem("snake-leaderboard", JSON.stringify(list));
}

function qualifiesForLeaderboard(s) {
  if (s <= 0) return false;
  const list = getLeaderboard();
  if (list.length < 5) return true;
  return s > Math.min(...list.map((entry) => entry.score));
}

function addToLeaderboard(name, s, modeLabel) {
  const list = getLeaderboard();
  list.push({ name: name || "Jugador", score: s, mode: modeLabel });
  list.sort((a, b) => b.score - a.score);
  saveLeaderboard(list.slice(0, 5));
}

function createLeaderboardRow(entry, rank) {
  const li = document.createElement("li");
  li.className = "leaderboard-row";

  const rankEl = document.createElement("span");
  rankEl.className = "leaderboard-rank";
  rankEl.textContent = `${rank}.`;

  const nameEl = document.createElement("span");
  nameEl.className = "leaderboard-name";
  nameEl.textContent = entry.name;

  const scoreEl2 = document.createElement("span");
  scoreEl2.className = "leaderboard-score";
  scoreEl2.textContent = entry.score;

  const modeEl = document.createElement("span");
  modeEl.className = "leaderboard-mode";
  modeEl.textContent = entry.mode;

  li.append(rankEl, nameEl, scoreEl2, modeEl);
  return li;
}

function renderLeaderboard() {
  const list = getLeaderboard();
  leaderboardList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "leaderboard-empty";
    li.textContent = "Todavía no hay puntajes. ¡Jugá para ser el primero!";
    leaderboardList.appendChild(li);
    return;
  }

  list.forEach((entry, i) => leaderboardList.appendChild(createLeaderboardRow(entry, i + 1)));
}

function showLeaderboardScreen() {
  pauseForOverlay();
  renderLeaderboard();
  leaderboardScreen.classList.remove("hidden");
}

function hideLeaderboardScreen() {
  leaderboardScreen.classList.add("hidden");
  resumeFromOverlay();
}

leaderboardBtn.addEventListener("click", showLeaderboardScreen);
leaderboardCloseBtn.addEventListener("click", hideLeaderboardScreen);

nameSaveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim().slice(0, 12) || "Jugador";
  addToLeaderboard(name, pendingScore, currentMode.label);
  nameEntryScreen.classList.add("hidden");
  nameInput.value = "";
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") nameSaveBtn.click();
});

// ==============================
// PWA: instalación y service worker
// ==============================
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  installBtn.classList.add("hidden");
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

window.addEventListener("appinstalled", () => {
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ==============================
// INICIO
// ==============================
resetGame();

if (!localStorage.getItem("snake-seen-legend")) {
  showLegend();
}
