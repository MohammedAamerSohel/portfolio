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
const roles = ['AI filmmaker', 'Virtual model director', 'Social strategist'];
let visible = true;
let roleIndex = 0;
let timer;
const face = createFaceAnimation(stage);
function updateMotion() {
  clearInterval(timer);
  face.setActive(visible && !document.hidden);
  stage.classList.toggle('motion-paused', !visible || document.hidden);
  if (!visible || document.hidden) {
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
document.addEventListener('visibilitychange', updateMotion);
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateMotion(); }).observe(stage);
const reveals = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('reveal');
    reveals.unobserve(entry.target);
  });
});
document.querySelectorAll('.gallery article').forEach(card => reveals.observe(card));
updateMotion();