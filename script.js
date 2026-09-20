const audio = document.querySelector('#site-audio');
const musicToggle = document.querySelector('.music-toggle');
const musicLabel = document.querySelector('.music-label');
const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');
const progress = document.querySelector('.scroll-progress span');
const cursor = document.querySelector('.cursor-orb');

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
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}));

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progress) progress.style.height = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
};
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

if (cursor && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });
  document.querySelectorAll('a, button').forEach((element) => {
    element.addEventListener('mouseenter', () => { cursor.style.transform = 'translate(-50%, -50%) scale(1.8)'; });
    element.addEventListener('mouseleave', () => { cursor.style.transform = 'translate(-50%, -50%) scale(1)'; });
  });
}
