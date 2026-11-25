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
updateMotion();
const opening=document.querySelector('.opening');
const intro=stage.querySelector('.stage-copy'), about=stage.querySelector('.scene-about'), work=stage.querySelector('.scene-work');
const cards=Array.from(work.querySelectorAll('article')), choices=Array.from(work.querySelectorAll('.film-links a'));
const cue=stage.querySelector('.stage-work');
const clamp01=x=>Math.max(0,Math.min(1,x));
const ramp=(p,a,b)=>{const t=clamp01((p-a)/(b-a));return t*t*(3-2*t);};
function frameOpening(){
  const distance=opening.offsetHeight-stage.offsetHeight;
  const p=distance>0?clamp01(-opening.getBoundingClientRect().top/distance):0;
  const turn=ramp(p,.035,.205);
  const aboutFade=turn*(1-ramp(p,.345,.445));
  const workFade=ramp(p,.37,.48);
  stage.dataset.progress=String(turn);
  stage.dispatchEvent(new Event('scenechange'));
  stage.style.setProperty('--turn',String(turn));
  stage.style.setProperty('--intro-opacity',String(1-ramp(p,.035,.15)));
  stage.style.setProperty('--about-opacity',String(aboutFade));
  stage.style.setProperty('--work-opacity',String(workFade));
  intro.inert=p>.13;about.inert=aboutFade<.5;work.inert=workFade<.5;
  const index=p<.64?0:p<.82?1:2;
  cards.forEach((card,i)=>{card.hidden=i!==index;});
  choices.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
  cue.href=p<.15?'#about':p<.40?'#work':p<.64?'#cobalt':p<.82?'#citrus':'#services';
  cue.textContent=p<.15?'Scroll to About me':p<.40?'Explore my work':p<.82?'Next campaign':'Creative services';
}
let pending=false;
function scheduleOpening(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;frameOpening();});}
window.addEventListener('scroll',scheduleOpening,{passive:true});
window.addEventListener('resize',scheduleOpening);
frameOpening();