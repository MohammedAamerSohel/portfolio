/* Original character geometry in model space. The head joint pivots at the neck. */
function createFaceAnimation(stage) {
  const holder = stage.querySelector('.character');
  const canvas = holder.querySelector('canvas');
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:false});
  const limit = (v,a,b) => Math.max(a,Math.min(b,v));
  let targetX=0, targetY=0, gazeX=0, gazeY=0, yaw=0, pitch=0, brow=0;
  let overFace=false, active=false, frame=0, last=0, age=0, nextBlink=2.6;
  let renderer;
  const original = new Image();
  original.onload=()=>{
    if(gl && !gl.isContextLost()) renderer=buildModel(gl,original);
    if(renderer){renderer(0,0,0,0,0,0,0,0);holder.classList.add("ready");}
    setActive(active);
  };
  original.src='assets/filmmaker.jpg';
  function point(e) {
    const rect=holder.getBoundingClientRect();
    if (!rect.width) return;
    targetX=limit((e.clientX-rect.left-rect.width*.5)/(Math.min(rect.width,rect.height)*.54),-1,1);
    targetY=limit((e.clientY-rect.top-rect.height*.39)/(rect.height*.45),-1,1);
    overFace=Math.abs(targetX)<.45 && Math.abs(targetY)<.5;
  }
  window.addEventListener('pointermove',point,{passive:true});
  stage.addEventListener('pointerdown',point,{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{targetX=targetY=0;overFace=false;});
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
    renderer(yaw-intro*.22,pitch+intro*.13,gazeX,gazeY,brow,blink,age,0);
    holder.classList.add('ready');
  }
  function setActive(value) {
    active=value;cancelAnimationFrame(frame);
    if(!renderer)return;
    if(value){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  canvas.addEventListener('webglcontextlost',()=>{cancelAnimationFrame(frame);renderer=null;holder.classList.remove('ready');});
  return {setActive};
}

function buildModel(gl,original) {
  const vertex=`
    attribute vec3 pos, normal, color;
    attribute float joint;
    uniform vec4 head; uniform vec4 face; uniform vec2 viewport;
    varying vec3 n, c, world; varying vec2 uv; varying float isPortrait;
    mat2 spin(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
    void main(){
      vec3 p=pos; n=normal; c=color;
      isPortrait=step(7.5,joint);
      uv=color.xy;
      if(isPortrait>.5){
        // The entire face and both glasses rims rotate together above the collar.
        float w=1.-smoothstep(.47,.63,uv.y);
        p.y+=.24;
        p.yz=spin(head.y*w*.55)*p.yz;
        p.xz=spin(-head.x*w*.55)*p.xz;
        p.y-=.24;
      }else if(joint>4.5){p.y+=.016*sin(head.w*7.+joint*2.);}
      if(isPortrait<.5)p.y-=2.8*(1.-smoothstep(.12,.72,head.z));
      p.xz=spin(.10+.62*head.z)*p.xz;
      n.xz=spin(.14+.42*head.z)*n.xz;
      p.y+=mix(-.24,1.35,head.z);
      p.yz=spin(.10+.06*head.z)*p.yz;
      n.yz=spin(.10+.06*head.z)*n.yz;
      world=p;
      float camera=9.5-p.z;
      float zoom=mix(3.55,1.62,head.z);
      gl_Position=vec4(p.x*zoom*viewport.y/viewport.x,(p.y+.07)*zoom,-p.z*.6,camera*.54);
    }`;
  const fragment=`
    precision mediump float;
    varying vec3 n,c,world; varying vec2 uv; varying float isPortrait;
    uniform sampler2D art; uniform vec4 face;
    void main(){
      if(isPortrait>.5){
        vec2 q=uv*vec2(400.,500.);
        vec2 eye=q.x<194.?vec2(163.,143.):vec2(226.,131.);
        vec2 d=q-eye;
        float lidY=d.y+.16*d.x;
        float arch=sqrt(max(0.,1.-pow(d.x/17.,2.)));
        float high=-6.7*arch, low=6.*arch, lid=mix(high,low,face.w*.98);
        if(arch>0. && lidY>high-7. && lidY<low){
          float sourceY=lidY<lid ? high-7.+(lidY-high+7.)*7./(lid-high+7.) : high+(lidY-lid)*(low-high)/max(.03,low-lid);
          q.y+=sourceY-lidY;
          float iris=max(0.,1.-dot(vec2(d.x/17.,sourceY/7.5),vec2(d.x/17.,sourceY/7.5)));
          q-=vec2(3.6*face.x,1.8*face.y)*iris;
        }
        vec2 eyebrow=q.x<194.?vec2(159.,111.):vec2(215.,96.);
        vec2 bd=(q-eyebrow)/vec2(22.,7.);
        q.y+=2.5*face.z*max(0.,1.-dot(bd,bd));
        vec4 pixel=texture2D(art,q/vec2(400.,500.));
        if(pixel.a<.35)discard;
        gl_FragColor=pixel;return;
      }
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
  surface((u,v)=>{
    const shoulder=1.-.29*Math.max(0.,(v-.65)/.35);
    return [(u-.5)*2.5*shoulder,1.47-v*3.52,.15+.17*Math.sin(pi*u)];
  },64,60,(u,v)=>[u,v,0],8);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  for(const [name,size,offset] of [['pos',3,0],['normal',3,3],['color',3,6],['joint',1,9]]){
    const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset*4);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(tris),gl.STATIC_DRAW);
  const loc=name=>gl.getUniformLocation(program,name),head=loc('head'),face=loc('face'),vp=loc('viewport');
  // Trace the silhouette from the original artwork; retain its face and fabric pixels.
  const cut=document.createElement('canvas');cut.width=original.naturalWidth;cut.height=original.naturalHeight;
  const ctx=cut.getContext('2d');ctx.scale(cut.width/400,cut.height/500);
  const outline=new Path2D('M0 374 Q8 326 31 319 L71 305 102 300 Q101 257 139 239 L151 234 151 218 Q120 230 108 206 Q102 191 109 167 L96 158 89 137 79 134 81 126 72 124 81 118 69 115 80 111 Q67 76 103 56 Q106 33 132 35 L143 15 154 24 Q171 7 187 15 Q208 -2 230 8 Q252 5 260 29 L271 30 275 54 Q292 62 287 74 L296 73 290 96 282 105 282 134 Q302 158 285 185 L267 193 261 224 Q300 235 312 284 L295 299 Q352 312 375 325 L400 377 400 500 0 500 Z');
  ctx.clip(outline);ctx.drawImage(original,0,0,400,500);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cut);
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
