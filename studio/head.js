/* A depth mesh for Aamer's portrait. Its face and shoulders pivot around the neck. */
function createHeadRenderer(textureCanvas, holder) {
  const surface = document.createElement('canvas');
  const gl = surface.getContext('webgl', {alpha:false, antialias:true, preserveDrawingBuffer:false});
  if (!gl) return null;
  const vertex = `
    attribute vec2 position;
    uniform vec3 pose;
    varying vec2 uv;
    float mound(vec2 p, vec2 center, vec2 radius) {
      vec2 d=(p-center)/radius;
      return max(0.0,1.0-dot(d,d));
    }
    void main() {
      vec2 p=position*vec2(400.,500.);
      uv=position;
      float skull=mound(p,vec2(186.,126.),vec2(119.,139.));
      float nose=mound(p,vec2(199.,156.),vec2(28.,32.));
      float cheeks=mound(p,vec2(193.,159.),vec2(82.,60.));
      float shoulders=mound(p,vec2(200.,407.),vec2(245.,162.));
      float depth=68.*sqrt(skull)+19.*nose+9.*cheeks+17.*shoulders;
      float influence=smoothstep(0.,.31,mound(p,vec2(186.,105.),vec2(173.,190.)));
      float yaw=pose.x*.51*influence;
      float pitch=(pose.y*.23+pose.z*.13)*influence;
      vec3 local=vec3(p-vec2(186.,214.),depth-13.);
      float x=cos(yaw)*local.x+sin(yaw)*local.z;
      float z=cos(yaw)*local.z-sin(yaw)*local.x;
      float y=cos(pitch)*local.y+sin(pitch)*z;
      z=cos(pitch)*z-sin(pitch)*local.y;
      vec2 projected=vec2(x,y)+vec2(186.,214.);
      projected.x+=pose.x*5.*shoulders;
      projected.y+=pose.z*9.*influence;
      gl_Position=vec4(projected.x/200.-1.,1.-projected.y/250.,-z/300.,1.);
    }`;
  const fragment = `precision mediump float;
    varying vec2 uv;
    uniform sampler2D portrait;
    void main(){gl_FragColor=texture2D(portrait,uv);}`;
  const program=gl.createProgram();
  for(const [kind,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const shader=gl.createShader(kind);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) return null;
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const cols=96, rows=120, positions=[], indices=[];
  for(let y=0;y<=rows;y++) {
    for(let x=0;x<=cols;x++) {
      const i=y*(cols+1)+x;
      positions.push(x/cols,y/rows);
      if(x<cols && y<rows) indices.push(i,i+1,i+cols+1,i+1,i+cols+2,i+cols+1);
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const pose=gl.getUniformLocation(program,'pose');
  surface.width=800; surface.height=1000;
  surface.className='head-surface';
  surface.setAttribute('aria-hidden','true');
  holder.append(surface);
  gl.viewport(0,0,surface.width,surface.height);
  gl.enable(gl.DEPTH_TEST);
  const renderer={
    surface, available:true,
    draw(x,y,intro) {
      if(!renderer.available)return;
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureCanvas);
      gl.uniform3f(pose,x,y,intro);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      holder.classList.add('spatial');
    }
  };
  surface.addEventListener('webglcontextlost',()=>{
    renderer.available=false;
    holder.classList.remove('spatial');
    surface.remove();
  });
  return renderer;
}
