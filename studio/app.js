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
const campaignNames = {cobalt: "Cobalt", ember: "Ember", citrus: "Citrus"};
const picks = document.querySelectorAll("[data-pick]");
const shots = document.querySelectorAll("[data-scene]");
picks.forEach(pick => pick.addEventListener("click", () => {
  const key = pick.dataset.pick;
  picks.forEach(option => option.setAttribute("aria-pressed", String(option === pick)));
  shots.forEach(shot => shot.classList.toggle("active", shot.dataset.scene === key));
  document.querySelector("#hero-play").dataset.film = key;
  document.querySelector("#play-label").textContent = (key === "citrus" ? "View " : "Watch ") + campaignNames[key];
  document.querySelector("#hero-play").classList.toggle("still", key === "citrus");
}));
