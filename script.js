const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const audio = $('#site-audio');
const musicToggle = $('.music-toggle');
const musicLabel = $('.music-label');
const nav = $('.nav');
const menuToggle = $('.menu-toggle');
const progress = $('.scroll-progress span');

musicToggle?.addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); } catch (_) { return; }
    musicToggle.classList.add('is-playing');
    musicToggle.setAttribute('aria-pressed', 'true');
    if (musicLabel) musicLabel.textContent = 'Sound on';
  } else {
    audio.pause();
    musicToggle.classList.remove('is-playing');
    musicToggle.setAttribute('aria-pressed', 'false');
    if (musicLabel) musicLabel.textContent = 'Sound off';
  }
});

menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
$$('.nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}));

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progress) progress.style.height = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((element) => revealObserver.observe(element));

$$('iframe').forEach((frame) => frame.addEventListener('load', () => frame.closest('.video-shell')?.classList.add('is-loaded')));

// Ambient particle/grid background. It intentionally stays tiny and dependency-free.
const ambientCanvas = $('#ambient-canvas');
const ambientContext = ambientCanvas?.getContext('2d');
const ambientDots = Array.from({ length: 42 }, (_, index) => ({
  x: (index * 83) % 1000,
  y: (index * 137) % 700,
  radius: index % 4 === 0 ? 1.5 : 0.7,
  speed: 0.08 + (index % 5) * 0.02,
}));
let ambientWidth = 0;
let ambientHeight = 0;
const resizeAmbient = () => {
  if (!ambientCanvas || !ambientContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  ambientWidth = window.innerWidth;
  ambientHeight = window.innerHeight;
  ambientCanvas.width = ambientWidth * ratio;
  ambientCanvas.height = ambientHeight * ratio;
  ambientContext.setTransform(ratio, 0, 0, ratio, 0, 0);
};
const drawAmbient = (time = 0) => {
  if (!ambientContext) return;
  ambientContext.clearRect(0, 0, ambientWidth, ambientHeight);
  ambientDots.forEach((dot, index) => {
    const x = ((dot.x + time * dot.speed * 0.015 + index * 3) % 1100) / 1100 * ambientWidth;
    const y = ((dot.y + Math.sin(time * 0.0004 + index) * 30) % 760) / 760 * ambientHeight;
    ambientContext.beginPath();
    ambientContext.fillStyle = index % 3 === 0 ? 'rgba(97,246,227,.38)' : 'rgba(109,140,255,.18)';
    ambientContext.arc(x, y, dot.radius, 0, Math.PI * 2);
    ambientContext.fill();
  });
  requestAnimationFrame(drawAmbient);
};
window.addEventListener('resize', resizeAmbient);
resizeAmbient();
requestAnimationFrame(drawAmbient);

// Space Guardian: a small offline canvas mission with no external dependencies.
const modal = $('#game-modal');
const openGame = $('#open-game');
const closeGame = $('#close-game');
const startGame = $('#start-game');
const canvas = $('#game-canvas');
const context = canvas?.getContext('2d');
const gameOverlay = $('#game-overlay');
const gameStatus = $('#game-status');
const scoreValue = $('#game-score-value');
const timeValue = $('#game-time');
let gameFrame = 0;
let gameTimer = 0;
let gameRunning = false;
let gameScore = 0;
let gameStartedAt = 0;
let targets = [];

const openGameModal = () => {
  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  closeGame?.focus();
};
const closeGameModal = () => {
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  stopGame();
};
openGame?.addEventListener('click', openGameModal);
closeGame?.addEventListener('click', closeGameModal);
modal?.addEventListener('click', (event) => { if (event.target === modal) closeGameModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeGameModal(); });

const fitCanvas = () => {
  if (!canvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 720 * ratio;
  canvas.height = 420 * ratio;
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
};
const resetGame = () => {
  gameScore = 0;
  targets = [];
  if (scoreValue) scoreValue.textContent = '0000';
  if (timeValue) timeValue.textContent = '30';
  if (gameStatus) gameStatus.textContent = 'READY';
};
const spawnTarget = () => targets.push({ x: 40 + Math.random() * 640, y: -20, size: 11 + Math.random() * 8, speed: 0.7 + Math.random() * 1.15, phase: Math.random() * Math.PI });
const drawGame = (time = 0) => {
  if (!context || !canvas) return;
  context.clearRect(0, 0, 720, 420);
  context.fillStyle = '#070b14';
  context.fillRect(0, 0, 720, 420);
  context.strokeStyle = 'rgba(97,246,227,.07)';
  context.lineWidth = 1;
  for (let y = 0; y < 420; y += 35) { context.beginPath(); context.moveTo(0, y); context.lineTo(720, y); context.stroke(); }
  for (let x = 0; x < 720; x += 45) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 420); context.stroke(); }
  const shipX = 360 + Math.sin(time * 0.002) * 170;
  const shipY = 365;
  context.shadowBlur = 20;
  context.shadowColor = '#61f6e3';
  context.fillStyle = '#61f6e3';
  context.beginPath(); context.moveTo(shipX, shipY - 18); context.lineTo(shipX - 14, shipY + 12); context.lineTo(shipX, shipY + 6); context.lineTo(shipX + 14, shipY + 12); context.closePath(); context.fill();
  context.shadowBlur = 0;
  targets.forEach((target) => {
    context.save();
    context.translate(target.x, target.y);
    context.rotate(time * .001 + target.phase);
    context.shadowBlur = 18;
    context.shadowColor = '#ff70ba';
    context.strokeStyle = '#ff70ba';
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(0, -target.size); context.lineTo(target.size, 0); context.lineTo(0, target.size); context.lineTo(-target.size, 0); context.closePath(); context.stroke();
    context.restore();
  });
};
const endGame = () => {
  gameRunning = false;
  cancelAnimationFrame(gameFrame);
  clearInterval(gameTimer);
  if (gameStatus) gameStatus.textContent = 'MISSION COMPLETE';
  if (gameOverlay) {
    gameOverlay.style.display = 'grid';
    gameOverlay.querySelector('strong').textContent = `Mission complete — ${String(gameScore).padStart(4, '0')} points.`;
    startGame.textContent = 'Run it again';
  }
};
const stopGame = () => {
  gameRunning = false;
  cancelAnimationFrame(gameFrame);
  clearInterval(gameTimer);
  resetGame();
  if (gameOverlay) gameOverlay.style.display = 'grid';
  if (startGame) startGame.textContent = 'Start mission';
};
const gameLoop = (time) => {
  if (!gameRunning) return;
  if (Math.random() < .032) spawnTarget();
  targets.forEach((target) => { target.y += target.speed; });
  targets = targets.filter((target) => target.y < 440);
  drawGame(time);
  gameFrame = requestAnimationFrame(gameLoop);
};
const startMission = () => {
  if (!canvas) return;
  stopGame();
  gameRunning = true;
  gameStartedAt = Date.now();
  gameOverlay.style.display = 'none';
  gameStatus.textContent = 'MISSION LIVE';
  gameTimer = window.setInterval(() => {
    const remaining = Math.max(0, 30 - Math.floor((Date.now() - gameStartedAt) / 1000));
    timeValue.textContent = String(remaining).padStart(2, '0');
    if (remaining === 0) endGame();
  }, 250);
  gameFrame = requestAnimationFrame(gameLoop);
};
const hitTest = (event) => {
  if (!gameRunning || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 720;
  const y = ((event.clientY - rect.top) / rect.height) * 420;
  const targetIndex = targets.findIndex((target) => Math.hypot(target.x - x, target.y - y) < target.size + 18);
  if (targetIndex >= 0) {
    targets.splice(targetIndex, 1);
    gameScore += 100;
    scoreValue.textContent = String(gameScore).padStart(4, '0');
  }
};
startGame?.addEventListener('click', startMission);
canvas?.addEventListener('pointerdown', hitTest);
window.addEventListener('resize', fitCanvas);
fitCanvas();
resetGame();

// Archive reader: the Drive PDF stays inside the site while remaining available in a new tab.
const documentationModal = $('#documentation-modal');
const documentationOpeners = ['#open-documentation', '#open-documentation-map', '#open-documentation-cta'].flatMap((selector) => $$(selector));
const documentationClose = $('#close-documentation');
const openDocumentation = () => {
  if (!documentationModal) return;
  if (typeof documentationModal.showModal === 'function') documentationModal.showModal();
  else documentationModal.setAttribute('open', '');
  document.body.classList.add('modal-open');
};
const closeDocumentation = () => {
  if (!documentationModal) return;
  if (typeof documentationModal.close === 'function') documentationModal.close();
  else documentationModal.removeAttribute('open');
  document.body.classList.remove('modal-open');
};
documentationOpeners.forEach((opener) => opener.addEventListener('click', openDocumentation));
documentationClose?.addEventListener('click', closeDocumentation);
documentationModal?.addEventListener('click', (event) => { if (event.target === documentationModal) closeDocumentation(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDocumentation(); });
