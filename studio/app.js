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
const intro=stage.querySelector('.stage-copy'), about=stage.querySelector('.scene-about'), services=stage.querySelector('.scene-services');
const cue=stage.querySelector('.stage-work');
const clamp01=x=>Math.max(0,Math.min(1,x));
const ramp=(p,a,b)=>{const t=clamp01((p-a)/(b-a));return t*t*(3-2*t);};
const reel=document.querySelector('.work-reel'), pinned=reel.querySelector('.pinned-work'), track=reel.querySelector('.project-track');
const controls=Array.from(reel.querySelectorAll('[data-project]'));
function scrollDistance(section,child){return Math.max(1,section.offsetHeight-child.offsetHeight);}
function updatePage(){
  const p=clamp01(-opening.getBoundingClientRect().top/scrollDistance(opening,stage));
  const turn=ramp(p,.04,.29),wide=ramp(p,.46,.70);
  const aboutFade=turn*(1-ramp(p,.46,.60));
  stage.dataset.progress=String(turn);stage.dataset.wide=String(wide);
  stage.dispatchEvent(new Event('scenechange'));
  stage.style.setProperty('--turn',String(turn));stage.style.setProperty('--wide',String(wide));
  stage.style.setProperty('--intro-opacity',String(1-ramp(p,.04,.19)));
  stage.style.setProperty('--about-opacity',String(aboutFade));stage.style.setProperty('--services-opacity',String(wide));
  intro.inert=p>.18;about.inert=aboutFade<.5;services.inert=wide<.5;
  cue.href=p<.19?'#about':p<.62?'#services':'#process';
  cue.textContent=p<.19?'Scroll to About me':p<.62?'What I do':'My process';
  const w=clamp01(-reel.getBoundingClientRect().top/scrollDistance(reel,pinned));
  const cards=track.children;
  const travel=cards[cards.length-1].offsetLeft-cards[0].offsetLeft;
  track.style.transform='translate3d('+(-travel*w)+'px,0,0)';
  controls.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===Math.round(w*(cards.length-1)))));
}
controls.forEach((el,i)=>el.addEventListener('click',()=>{
  const top=window.scrollY+reel.getBoundingClientRect().top+scrollDistance(reel,pinned)*i/(controls.length-1);
  window.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}));
let pending=false;
function schedulePage(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;updatePage();});}
window.addEventListener('scroll',schedulePage,{passive:true});window.addEventListener('resize',schedulePage);
updatePage();const field=document.querySelector('.orbs');
const balls=Array.from(field.children,(el,i)=>({el,x:.09+(i%3)*.36,y:.1+Math.floor(i/3)*.53,vx:Math.cos(i+1)*32,vy:Math.sin(i+2)*24}));
let ballFrame=0,oldTime=0;
function drawBalls(time){
  const w=field.clientWidth,h=field.clientHeight,d=balls[0].el.offsetWidth;
  const dt=Math.min(.04,(time-oldTime)/1000);oldTime=time;
  for(const b of balls){
    b.x+=b.vx*dt/w;b.y+=b.vy*dt/h;
    if(b.x<=0||b.x>1-d/w){b.vx*=-1;b.x=Math.max(0,Math.min(1-d/w,b.x));}
    if(b.y<=0||b.y>1-d/h){b.vy*=-1;b.y=Math.max(0,Math.min(1-d/h,b.y));}
    b.el.style.transform='translate('+b.x*w+'px,'+b.y*h+'px)';
  }
  if(!matchMedia('(prefers-reduced-motion:reduce)').matches)ballFrame=requestAnimationFrame(drawBalls);
}
field.addEventListener('pointermove',e=>{
  const rect=field.getBoundingClientRect();
  for(const b of balls){const dx=b.x*rect.width+b.el.offsetWidth/2-(e.clientX-rect.left),dy=b.y*rect.height+b.el.offsetWidth/2-(e.clientY-rect.top);
    const distance=Math.hypot(dx,dy);if(distance>0&&distance<100){b.vx=55*dx/distance;b.vy=55*dy/distance;}}
});
new IntersectionObserver(([entry])=>{cancelAnimationFrame(ballFrame);if(entry.isIntersecting){oldTime=performance.now();drawBalls(oldTime);}}).observe(field);
