const viewer = document.querySelector('#viewer');
const media = document.querySelector('#media');
const titles = { ember: 'Ember · Fragrance film', cobalt: 'Cobalt · Virtual model editorial', citrus: 'Citrus · Campaign still' };
document.querySelectorAll('[data-film]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.film;
    document.querySelector('#dialog-title').textContent = titles[key];
    const isStill = key === 'citrus';
    const item = document.createElement(isStill ? 'img' : 'video');
    if (isStill) {
      item.alt = 'Tangerine beverage campaign with blood orange slices';
      item.src = 'assets/citrus.jpg';
    } else {
      item.controls = true;
      item.playsInline = true;
      item.poster = 'assets/' + key + '.jpg';
      item.src = 'assets/' + key + '.mp4';
    }
    media.replaceChildren(item);
    viewer.showModal();
    if (!isStill) item.play().catch(() => {});
  });
});
document.querySelector('#close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => { media.replaceChildren(); });
const stage = document.querySelector('.stage');
const roleText = document.querySelector('#role-text');
const toggle = document.querySelector('#motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const roles = ['AI filmmaker', 'Virtual model director', 'Social strategist'];
let paused = preference.matches;
let visible = true;
let roleIndex = 0;
let timer;
function updateMotion() {
  clearInterval(timer);
  stage.classList.toggle('motion-paused', paused || !visible || document.hidden);
  toggle.textContent = paused ? 'Play motion' : 'Pause motion';
  toggle.setAttribute('aria-pressed', String(paused));
  if (paused || !visible || document.hidden) {
    stage.removeAttribute('style');
    return;
  }
  timer = setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;
    roleText.textContent = roles[roleIndex];
    roleText.classList.remove('swap');
    void roleText.offsetWidth;
    roleText.classList.add('swap');
  }, 3000);
}
toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
preference.addEventListener('change', () => { paused = preference.matches; updateMotion(); });
document.addEventListener('visibilitychange', updateMotion);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateMotion(); }).observe(stage);
stage.addEventListener('pointermove', event => {
  if (paused || event.pointerType !== 'mouse') return;
  const box = stage.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  stage.style.setProperty('--mx', (x * 20) + 'px');
  stage.style.setProperty('--my', (y * 9) + 'px');
  stage.style.setProperty('--tilt', (x * 10) + 'deg');
});
stage.addEventListener('pointerleave', () => stage.removeAttribute('style'));
const reveals = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('reveal');
    reveals.unobserve(entry.target);
  });
});
document.querySelectorAll('.gallery article').forEach(card => reveals.observe(card));
updateMotion();