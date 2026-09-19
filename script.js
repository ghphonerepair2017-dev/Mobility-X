const audio = document.querySelector('#site-audio');
const musicToggle = document.querySelector('.music-toggle');
const musicLabel = document.querySelector('.music-label');
const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');

musicToggle?.addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); } catch (_) {}
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
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
