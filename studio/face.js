/* The rig coordinates use a 400 x 500 view of the original studio portrait. */
function createFaceAnimation(stage) {
  const holder = stage.querySelector('.character');
  const portrait = holder.querySelector('img');
  const canvas = holder.querySelector('canvas');
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) return {setActive() {}};

  const scale = matchMedia('(max-width: 650px)').matches ? 1.5 : 2;
  const width = canvas.width = 400 * scale;
  const height = canvas.height = 500 * scale;
  const left = 44 * scale;
  const top = 0;
  const right = 330 * scale;
  const bottom = 302 * scale;
  let original, patch, pixels;
  let active = false, frame = 0, last = 0, elapsed = 0, nextBlink = 2350;
  let aimX = 0, aimY = 0, lookX = 0, lookY = 0, headX = 0, headY = 0;
  let hovered = false, brow = 0, touchUntil = 0;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const smooth = value => { const x = clamp(value, 0, 1); return x*x*(3-2*x); };
  function falloff(x, y) { return smooth(1 - x*x - y*y); }

  function render(blink, entrance) {
    // Inverse mapping keeps the original glasses and jacket texture continuous.
    const dx = headX * 12 - entrance * 9;
    const dy = headY * 6 + entrance * 13 + Math.sin(elapsed / 860) * .75;
    const roll = headX * .035 - entrance * .047;
    let sx, sy;
    function map(x, y) {
      const head = falloff((x-188)/163, (y-110)/198);
      const nose = falloff((x-200)/64, (y-153)/78);
      sx = x - head * (dx + (y-218)*roll) - nose * headX * 4;
      sy = y - head * (dy - (x-190)*roll);
      if (sy < 77 || sy > 166 || sx < 126 || sx > 255) return;
      const first = sx < 194;
      const ex = first ? 163 : 226, ey = first ? 143 : 131;
      const bx = first ? 160 : 216, by = first ? 111 : 96;
      const browWeight = falloff((sx-bx)/22,(sy-by+(sx-bx)*.24)/8);
      sy += browWeight * (brow * 5.2 + entrance * 2.5);
      const u = sx-ex, v = sy-ey + u*.16;
      const radius = first ? 17.8 : 16.1;
      if (Math.abs(u) >= radius || Math.abs(v) > 16) return;
      const arch = Math.sqrt(Math.max(0,1-(u/radius)**2));
      const upper = -6.7*arch, lower = 6.0*arch;
      const lid = upper + (lower-upper)*blink*.985;
      let sample = v;
      if (v > upper-7 && v < lid) {
        sample = upper-7 + (v-upper+7)*7/(lid-upper+7);
      } else if (v >= lid && v < lower) {
        sample = upper + (v-lid)*(lower-upper)/Math.max(.025,lower-lid);
      }
      sy += sample-v;
      const iris = falloff(u/radius,(sample+.5)/7.4);
      sx -= (lookX * 4.4 - 1.9) * iris;
      sy -= lookY * 2.3 * iris;
    }
    // Bilinear sampling on horizontal spans. The eyes use a one-pixel grid.
    let out = 0;
    for (let py=top; py<bottom; py++) {
      const y = py/scale;
      map(left/scale,y);
      let ax=sx*scale, ay=sy*scale;
      for (let px=left; px<right;) {
        const fine = y>113 && y<160 && px>126*scale && px<258*scale;
        const count = Math.min(fine ? 2 : 10,right-px);
        map((px+count)/scale,y);
        const endX=sx*scale, endY=sy*scale;
        const stepx=(endX-ax)/count, stepy=(endY-ay)/count;
        for (let n=0;n<count;n++,ax+=stepx,ay+=stepy,out++) {
          const yy=clamp(ay,0,height-2), xx=clamp(ax,0,width-2);
          const xi=xx|0, yi=yy|0, fx=(xx-xi)*256|0, fy=(yy-yi)*256|0;
          const i=yi*width+xi;
          const a=blend(original[i],original[i+1],fx);
          const b=blend(original[i+width],original[i+width+1],fx);
          pixels[out]=blend(a,b,fy);
        }
        px+=count; ax=endX; ay=endY;
      }
    }
    context.putImageData(patch,left,top);
  }
  function blend(a,b,t) {
    const s=256-t;
    const rb=((((a&0xff00ff)*s+(b&0xff00ff)*t)>>>8)&0xff00ff);
    const g=((((a&0xff00)*s+(b&0xff00)*t)>>>8)&0xff00);
    return (0xff000000|rb|g)>>>0;
  }
  function tick(now) {
    if (!active || !original) return;
    frame=requestAnimationFrame(tick);
    const dt=Math.min(now-last,100);
    if(dt<32) return;
    last=now; elapsed+=dt;
    const eyeEase=1-Math.exp(-dt/70), headEase=1-Math.exp(-dt/210);
    lookX+=(aimX-lookX)*eyeEase; lookY+=(aimY-lookY)*eyeEase;
    headX+=(aimX-headX)*headEase; headY+=(aimY-headY)*headEase;
    brow+=((hovered || now<touchUntil ? 1 : 0)-brow)*(1-Math.exp(-dt/135));
    const phase=elapsed-nextBlink;
    const blink=phase<0 ? 0 : phase<90 ? smooth(phase/90) : 1-smooth((phase-90)/145);
    if(phase>235) nextBlink=elapsed+2700+Math.random()*2300;
    render(blink,1-smooth(elapsed/1150));
  }
  function setActive(value) {
    active=value;
    cancelAnimationFrame(frame);
    if(!original) return;
    if(value) {last=performance.now();frame=requestAnimationFrame(tick);}
    else {context.drawImage(portrait,0,0,width,height);}
  }
  function point(event) {
    const box=stage.getBoundingClientRect(), shape=canvas.getBoundingClientRect();
    if(!shape.width) return;
    aimX=clamp(2*(event.clientX-box.left)/box.width-1,-1,1);
    aimY=clamp(2*(event.clientY-box.top)/box.height-1,-1,1);
    const cover=Math.max(shape.width/400,shape.height/500);
    const offsetY=(shape.height-cover*500)*parseFloat(getComputedStyle(canvas).objectPosition.split(' ')[1])/100;
    const x=(event.clientX-shape.left-(shape.width-cover*400)/2)/cover;
    const y=(event.clientY-shape.top-offsetY)/cover;
    hovered=((x-195)/98)**2+((y-150)/93)**2<1;
    if(event.pointerType==='touch' && hovered) touchUntil=performance.now()+750;
  }
  stage.addEventListener('pointermove',point);
  stage.addEventListener('pointerdown',point);
  stage.addEventListener('pointerleave',()=>{aimX=0;aimY=0;hovered=false;});
  function initialize() {
    context.drawImage(portrait,0,0,width,height);
    original=new Uint32Array(context.getImageData(0,0,width,height).data.buffer);
    patch=context.createImageData(right-left,bottom-top);
    pixels=new Uint32Array(patch.data.buffer);
    holder.classList.add('ready');
    setActive(active);
  }
  if(portrait.complete && portrait.naturalWidth) initialize();
  else portrait.addEventListener('load',initialize,{once:true});
  return {setActive};
}
