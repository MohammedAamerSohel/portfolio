/* Original character geometry in model space. The head joint pivots at the neck. */
function createFaceAnimation(stage) {
  const holder = stage.querySelector('.character');
  const canvas = holder.querySelector('canvas');
  const poster = holder.querySelector('img');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:false});
  const limit = (v,a,b) => Math.max(a,Math.min(b,v));
  let targetX=0, targetY=0, gazeX=0, gazeY=0, yaw=0, pitch=0, brow=0;
  let overFace=false, active=false, frame=0, last=0, age=0, nextBlink=2.6;
  let renderer;
  if (gl) renderer=buildModel(gl);
  const views=['left','center','right'];
  let fallbackView='';
  function fallback() {
    const view=Number(stage.dataset.wide)>.5 ? "desk" : views[targetX < -.28 ? 0 : targetX > .28 ? 2 : 1];
    if(view!==fallbackView) {fallbackView=view;poster.src='assets/pose-'+view+'.png';}
  }
  stage.addEventListener('scenechange',()=>{if(!renderer)fallback();});
  function point(e) {
    const rect=holder.getBoundingClientRect();
    if (!rect.width) return;
    targetX=limit((e.clientX-rect.left-rect.width*.5)/(Math.min(rect.width,rect.height)*.54),-1,1);
    targetY=limit((e.clientY-rect.top-rect.height*.39)/(rect.height*.45),-1,1);
    overFace=Math.abs(targetX)<.45 && Math.abs(targetY)<.5;
    if (!renderer) fallback();
  }
  window.addEventListener('pointermove',point,{passive:true});
  stage.addEventListener('pointerdown',point,{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{targetX=targetY=0;overFace=false;if(!renderer)fallback();});
  function tick(now) {
    if(!active || !renderer)return;
    frame=requestAnimationFrame(tick);
    const dt=Math.min(.07,(now-last)/1000);
    if(dt<.015)return;
    last=now;age+=dt;
    const ease=t=>1-Math.exp(-dt/t);
    gazeX+=(targetX-gazeX)*ease(.064);gazeY+=(targetY-gazeY)*ease(.064);
    const progress=Number(stage.dataset.progress || 0);
    yaw+=((1-progress)*targetX*.51+progress*.42-yaw)*ease(.16);pitch+=((1-progress)*targetY*.22+progress*.07-pitch)*ease(.18);
    brow+=((overFace?1:0)-brow)*ease(.13);
    const blinkTime=age-nextBlink;
    const blink=blinkTime<0?0:blinkTime<.09?blinkTime/.09:Math.max(0,1-(blinkTime-.09)/.14);
    if(blinkTime>.24)nextBlink=age+2.8+Math.random()*1.8;
    const intro=Math.max(0,1-age/1.2)**2;
    renderer(yaw-intro*.22,pitch+intro*.13,gazeX,gazeY,brow,blink,age,Number(stage.dataset.wide || 0));
    holder.classList.add('ready');
  }
  function setActive(value) {
    active=value;cancelAnimationFrame(frame);
    if(!renderer){fallback();return;}
    if(value){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  canvas.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(frame);renderer=null;holder.classList.remove('ready');fallback();});
  return {setActive};
}

function buildModel(gl) {
  const vertex=`
    attribute vec3 pos, normal, color;
    attribute float joint;
    uniform vec4 head; uniform vec4 face; uniform vec2 viewport;
    varying vec3 n, c, world;
    mat2 spin(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
    void main(){
      vec3 p=pos; n=normal; c=color;
      if(joint>1.5 && joint<2.5){p.y+=face.z*.077;}
      if(joint>2.5 && joint<4.5){
        float eyeX=sign(p.x)*.311;
        if(joint>3.5){p.x+=face.x*.066;p.y-=face.y*.034;}
        float open=max(.025,1.-face.w);
        p.y=.427+(p.y-.427)*open;
        n=normalize(vec3(n.x,n.y/open,n.z));
      }
      if(joint>.5 && joint<4.5){
        p.y+=.47;
        p.yz=spin(head.y)*p.yz;n.yz=spin(head.y)*n.yz;
        p.xz=spin(-head.x)*p.xz;n.xz=spin(-head.x)*n.xz;
        p.y-=.47;
      }
      if(joint>4.5)p.y+=.016*sin(head.w*7.+joint*2.);
      p.xz=spin(.10+.62*head.z)*p.xz;
      n.xz=spin(.14+.42*head.z)*n.xz;
      p.y+=mix(-.24,1.35,head.z);
      p.yz=spin(.10+.06*head.z)*p.yz;
      n.yz=spin(.10+.06*head.z)*n.yz;
      world=p;
      float camera=9.5-p.z;
      float zoom=mix(4.55,1.62,head.z);
      gl_Position=vec4(p.x*zoom*viewport.y/viewport.x,(p.y+.07)*zoom,-p.z*.6,camera*.54);
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 n,c,world;
    void main(){
      vec3 N=normalize(n), V=normalize(vec3(0.,.02,5.)-world);
      vec3 L=normalize(vec3(-.5,.8,1.1));
      float key=max(dot(N,L),0.);
      float rim=pow(1.-max(dot(N,V),0.),2.7);
      vec3 shade=c*(.49+.53*key+.09*max(N.y,0.));
      shade+=c*vec3(.06,.12,.12)*max(-N.x,0.);
      shade+=rim*mix(vec3(.025,.29,.28),vec3(.21,.13,.29),smoothstep(-.7,.7,N.x));
      shade+=.088*pow(max(dot(N,normalize(L+V)),0.),28.);
      gl_FragColor=vec4(shade,1.);
    }`;
  const program=gl.createProgram();
  for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return null;
    gl.attachShader(program,s);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
  gl.useProgram(program);
  const verts=[], tris=[];
  const pi=Math.PI, tau=2*pi;
  const normalize=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  function surface(fn,cols,rows,color,joint=1) {
    const start=verts.length/10, h=.0003;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const u=i/cols,v=j/rows,p=fn(u,v);
      const du=sub(fn(u+h,v),fn(u-h,v)),dv=sub(fn(u,Math.min(.99999,Math.max(.00001,v)+h)),fn(u,Math.max(.00001,Math.min(.99999,v)-h)));
      const n=normalize(cross(du,dv));
      const col=typeof color==='function'?color(u,v):color;
      verts.push(...p,...n,...col,joint);
      if(i<cols && j<rows){const k=start+j*(cols+1)+i;tris.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
    }
  }
  function oval(center,r,color,joint=1,tilt=0){
    surface((u,v)=>{const a=u*tau,b=(v-.5)*pi,x=r[0]*Math.cos(b)*Math.sin(a),y=r[1]*Math.sin(b);
      return [center[0]+x*Math.cos(tilt)-y*Math.sin(tilt),center[1]+x*Math.sin(tilt)+y*Math.cos(tilt),center[2]+r[2]*Math.cos(b)*Math.cos(a)];},32,20,color,joint);
  }
  function tube(path,radius,color,joint=1,steps=32,sides=9){
    surface((u,v)=>{const t=Math.max(0,Math.min(1,v)),p=path(t),d=normalize(sub(path(Math.min(1,t+.001)),path(Math.max(0,t-.001))));
      const a=normalize(cross(d,Math.abs(d[2])>.92?[0,1,0]:[0,0,1])),b=cross(d,a);
      const r=typeof radius==='function'?radius(t):radius;
      return p.map((x,i)=>x+r*(a[i]*Math.cos(u*tau)+b[i]*Math.sin(u*tau)));},sides,steps,color,joint);
  }
  const skin=[.79,.50,.34], ear=[.64,.34,.25], hair=[.092,.068,.066], teal=[.025,.60,.54],black=[.13,.15,.18],white=[.96,.93,.85];
  // A continuous tapered jaw and cheeks with warm lower-face stubble.
  surface((u,v)=>{const a=u*tau,b=(v-.5)*pi, f=Math.cos(b),y=Math.sin(b);
    const jaw=.84+.16/(1+Math.exp(-(y+.20)*7));
    return [.73*f*Math.sin(a)*jaw,.36+.81*y,.58*f*Math.cos(a)+.043*(1-y)];},64,40,
    (u,v)=>{const beard=Math.max(0,Math.min(1,(.40-v)*8))*Math.max(0,Math.cos(tau*u));return skin.map((c,i)=>c*(1-beard*[.28,.27,.19][i]));});
  oval([0,-.58,0],[.245,.40,.23],skin,0);
  oval([0,-1.35,-.06],[1.1,.74,.46],black,0);
  oval([0,-1.12,.25],[.36,.65,.23],[.066,.09,.108],0);
  for(const side of [-1,1]){
    oval([side*.685,.27,.025],[.155,.235,.126],skin);
    oval([side*.732,.27,.123],[.084,.146,.034],ear);
    oval([side*.72,.255,.151],[.045,.072,.016],skin);
    oval([side*.329,-.99,.30],[.145,.41,.081],[.20,.225,.25],0,-side*.49);
    tube(t=>[side*(.20+.15*t),-.80-.91*t,.414-.04*t],.009,[.52,.59,.60],0);
    oval([side*.311,.427,.544],[.178,.105,.083],white,3,side*.025);
    oval([side*.311,.427,.612],[.087,.09,.036],[.30,.18,.105],4);
    oval([side*.311,.427,.643],[.047,.057,.014],[.054,.044,.047],4);
    oval([side*.311-.017,.454,.658],[.017,.017,.008],[1,1,1],4);
    tube(t=>[side*(.123+.37*t),.625+.057*Math.sin(pi*t)+.024*(1-t),.565-.12*t*t],t=>.012+.037*Math.sin(pi*t)**.6,hair,2);
    tube(t=>{const a=pi*t;return [side*.311+.174*Math.cos(a),.427+.097*Math.sin(a),.604+.008*Math.sin(a)];},t=>.006+.009*Math.sin(pi*t),[.36,.20,.16],3);
    // Closed tubular frame and long temples are rigid members of the head joint.
    tube(t=>{const a=t*tau;return [side*.313+.258*Math.cos(a),.43+.209*Math.sin(a),.674-.046*Math.cos(a)*side];},.026,teal,1,64,10);
    tube(t=>[side*(.564+.142*Math.sin(t*pi*.5)),.46-.075*t,.625-.635*t],.024,teal);
  }
  tube(t=>[(t-.5)*.138,.452+.041*Math.sin(pi*t),.696],.023,teal);
  oval([0,.345,.562],[.096,.186,.126],skin);
  oval([0,.245,.659],[.119,.079,.11],[.805,.49,.323]);
  tube(t=>[(t-.5)*.37,-.055+.044*(2*t-1)**2+.014*(t-.5),.563-.024*(2*t-1)**2],t=>.005+.012*Math.sin(pi*t),[.38,.198,.152]);
  oval([0,-.078,.541],[.145,.028,.021],[.68,.37,.277]);
  // Swept cap and tapered sculpted locks share the same head transform.
  surface((u,v)=>{const a=u*tau,edge=.02+.60*Math.cos(a)+.06*Math.sin(2*a);
    const b=edge+(pi/2-edge)*v;
    return [.755*Math.cos(b)*Math.sin(a),.47+.835*Math.sin(b),.64*Math.cos(b)*Math.cos(a)-.015];},64,26,hair);
  for(let k=0;k<10;k++){
    const x=-.59+k*.119,base=.79+.085*Math.cos(x*3)+.08*x;
    surface((u,v)=>{const w=Math.max(.0001,Math.sin(pi*v))**.58;
      const center=[x+.15*Math.sin(v*pi*1.4)+.13*v,base+(.41+.14*Math.cos(x*3))*v+.10*Math.sin(pi*v),.48+.16*Math.sin(pi*v)-.55*v-.44*x*x];
      return [center[0]+.175*w*Math.cos(tau*u),center[1]+.038*w*Math.cos(tau*u),center[2]-.172*w*Math.sin(tau*u)];},16,21,[.095+k*.002,.067+k*.001,.068+k*.001]);
  }
  // Solid furniture, chair, seated legs and arms share the character's camera.
  function box(center, size, color, angle=0) {
    for(const [axis,sign] of [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]){
      const first=(axis+1)%3, second=(axis+2)%3, start=verts.length/10;
      for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const q=[0,0,0],n=[0,0,0];q[axis]=sign*size[axis]/2;
        q[first]=a*size[first]/2;q[second]=b*size[second]/2;n[axis]=sign;
        const rotate=v=>[v[0]*Math.cos(angle)+v[2]*Math.sin(angle),v[1],v[2]*Math.cos(angle)-v[0]*Math.sin(angle)];
        verts.push(...rotate(q).map((v,i)=>v+center[i]),...rotate(n),...color,0);
      }
      tris.push(start,start+1,start+2,start,start+2,start+3);
    }
  }
  function limb(from,to,r,color,joint=0){
    tube(t=>from.map((v,i)=>v+(to[i]-v)*t),t=>r*(.78+.22*Math.sin(pi*t)),color,joint,12,12);
  }
  const metal=[.19,.23,.26], leather=[.135,.16,.19], denim=[.17,.22,.26];
  oval([0,-1.54,-.46],[.87,1.03,.17],leather,0);
  oval([0,-2.18,-.08],[.83,.17,.66],leather,0);
  box([0,-2.65,-.18],[.13,1,.13],metal);
  for(const side of [-1,1]){
    box([side*.79,-1.72,-.12],[.18,.095,.75],leather);
    box([side*.79,-1.94,-.2],[.08,.44,.08],metal);
    limb([0,-3.04,-.17],[side*.68,-3.20,-.35],.085,metal);
    oval([side*.68,-3.24,-.35],[.106,.10,.09],black,0);
    const knee=[side*.43,-2.27,.82];
    limb([side*.35,-1.99,.03],knee,.29,denim);
    limb(knee,[side*.46,-3.16,.68],.20,denim);
    oval([side*.45,-3.24,.86],[.24,.13,.37],black,0);
    const elbow=[side*.97,-1.68,.18],wrist=[side*.52,-1.57,.94];
    limb([side*.77,-1.13,-.02],elbow,.20,black);
    limb(elbow,wrist,.16,black);
    oval(wrist,[.14,.10,.12],skin,0);
    oval([side*.47,-1.57,1.04],[.19,.083,.19],skin,side<0?5:6);
    for(let k=0;k<4;k++)limb([side*(.36+k*.065),-1.58,1.09],[side*(.34+k*.064),-1.63,1.27],.028,skin,side<0?5:6);
    box([side*1.54,-2.55,1.17],[.10,1.58,.11],metal);
    box([side*1.54,-3.31,1.13],[.21,.08,.90],metal);
  }
  box([0,-1.77,1.00],[3.46,.11,1.22],[.39,.27,.19]);
  box([0,-1.84,1.00],[3.33,.045,1.12],metal);
  box([-.1,-1.689,1.12],[1.26,.045,.42],[.19,.23,.26]);
  for(let row=0;row<3;row++)for(let key=0;key<12;key++)
    box([-.66+key*.101,-1.655,.98+row*.097],[.08,.032,.072],[.31,.38,.40]);
  // A side-mounted editing monitor leaves the filmmaker's face visible.
  box([1.13,-1.675,.86],[.42,.05,.31],metal);
  box([1.13,-1.39,.87],[.075,.55,.08],metal);
  box([1.12,-.91,.90],[1.12,.68,.07],[.13,.18,.22],-.49);
  box([1.106,-.91,.943],[1.02,.57,.015],[.12,.32,.35],-.49);
  for(let k=0;k<5;k++)box([1.01+.036*k,-1.07+k*.032,.90+(k*.036-.11)*.53+.065],[.55-.052*k,.017,.012],[.31,.70,.64],-.49);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  for(const [name,size,offset] of [['pos',3,0],['normal',3,3],['color',3,6],['joint',1,9]]){
    const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset*4);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(tris),gl.STATIC_DRAW);
  const loc=name=>gl.getUniformLocation(program,name),head=loc('head'),face=loc('face'),vp=loc('viewport');
  gl.enable(gl.DEPTH_TEST);
  return (yaw,pitch,gx,gy,brow,blink,time=0,progress=0)=>{
    const canvas=gl.canvas;
    const w=960,h=960;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(vp,w,h);gl.uniform4f(head,yaw,pitch,progress,time);gl.uniform4f(face,gx,gy,brow,blink);
    gl.drawElements(gl.TRIANGLES,tris.length,gl.UNSIGNED_SHORT,0);
  };
}
