// Moving neural camouflage background (WebGL1, procedural, original pattern).
// Layers: soft earth-tone blotches -> scale cells that densify around drifting "somas"
// -> faint dendrite/wire filaments near the somas. One soma lazily follows the pointer.
(() => {
  const canvas = document.getElementById('camo');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false, alpha: false });
  if (!gl) { canvas.style.background = '#3a3a2a'; return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VS = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const FS = `
  precision highp float;
  uniform vec2 R; uniform float T; uniform vec3 S[4];

  float h1(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  vec2  h2(vec2 p){ float n=h1(p); return vec2(n, h1(p+n)); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
    return mix(mix(h1(i),h1(i+vec2(1,0)),u.x), mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+17.1; a*=.5; } return s; }

  // returns (F1, F2-F1, cell hash)
  vec3 vor(vec2 p, float t){
    vec2 i=floor(p), f=fract(p); float d1=8., d2=8., id=0.;
    for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
      vec2 g=vec2(float(x),float(y)); vec2 o=h2(i+g);
      o=.5+.32*sin(t*.12+6.2831*o);
      vec2 r=g+o-f; float d=dot(r,r);
      if(d<d1){ d2=d1; d1=d; id=h1(i+g); } else if(d<d2) d2=d;
    }
    return vec3(sqrt(d1), sqrt(d2)-sqrt(d1), id);
  }

  void main(){
    float ar = R.x/R.y;
    vec2 uv = gl_FragCoord.xy / R.y;
    float t = T;

    // slow domain warp: the whole pattern creeps
    vec2 w = uv + .13*vec2(fbm(uv*1.4 + t*.018), fbm(uv*1.4 - t*.015 + 5.2));

    // palette
    vec3 olive=vec3(.27,.30,.19), moss=vec3(.37,.38,.27), tan=vec3(.60,.51,.40),
         cream=vec3(.80,.75,.65), brown=vec3(.22,.15,.12), rust=vec3(.46,.28,.21);

    // base blotches (soft-edged, like out-of-focus foliage)
    float n1=fbm(w*1.8 + vec2(t*.010,0.)), n2=fbm(w*3.0 + 9. + vec2(0.,t*.012)), n3=fbm(w*4.6 + 3.);
    vec3 col = mix(olive, moss, smoothstep(.40,.62,n3));
    col = mix(col, tan,   smoothstep(.47,.57,n1));
    col = mix(col, cream, smoothstep(.60,.70,n1)*.75);
    col = mix(col, brown, smoothstep(.54,.63,n2)*.8);

    // somas: drifting neuron cell bodies that organize the scales around them
    float field=0., core=0.; vec2 burst=vec2(0.);
    for(int i=0;i<4;i++){
      vec2 c = vec2(S[i].x*ar, S[i].y);
      float d = length(uv-c);
      field += S[i].z * exp(-d*d/.07);
      float g = S[i].z * exp(-d*d/.07);
      core  += S[i].z * exp(-d*d/.0006);
      burst += (uv-c) * g * .55;          // pull cells toward the soma -> radial bursts
    }
    field = clamp(field, 0., 1.);

    // scale cells: coarse everywhere in patches, fine and dense near somas
    vec2 ws = w + burst*1.3;
    vec3 vc = vor(ws*10.,  t), vf = vor(ws*22. + 3.1, t);
    float k = smoothstep(.25,.85,field);
    float patchy = smoothstep(.60,.74, fbm(w*2.4 + 21. + t*.006) + field*.40);
    float eC = 1.-smoothstep(.012,.04,vc.y), eF = 1.-smoothstep(.018,.05,vf.y);
    float fillC = step(.80,vc.z)*(1.-eC), fillF = step(.68,vf.z)*(1.-eF);
    float edge = mix(eC, eF, k), fill = mix(fillC, fillF, k);
    float idv  = mix(vc.z, vf.z, k);
    float shade = 1. - .35*smoothstep(.0,.45, mix(vc.x, vf.x, k));      // darker toward cell centre
    vec3 cellCol = mix(rust, brown, step(.80, idv)) * (.85 + .3*shade);
    col = mix(col, cellCol, fill*patchy*.75);
    col = mix(col, mix(tan, cream, .55), edge*patchy*.6);

    // dendrites / wire: thin noise isolines, mostly near somas, faint elsewhere
    float a = noise(w*6.5 + t*.025) - .5, b = noise(w*12. + 40. - t*.02) - .5;
    float l1 = 1.-smoothstep(0.,.016,abs(a)), l2 = 1.-smoothstep(0.,.011,abs(b));
    float wireMask = smoothstep(.05,.45,field)*.9 + .18*smoothstep(.55,.7,fbm(w*1.7+60.));
    col = mix(col, cream*1.05, clamp((l1*.55 + l2*.4)*wireMask, 0., 1.)*.6);

    // cell bodies themselves: subtle dark nucleus with a pale membrane
    col = mix(col, brown*.75, clamp(core,0.,1.)*.55);

    // finish: slight darken for text legibility, vignette, film grain
    vec2 q = gl_FragCoord.xy/R;
    col *= .78 * (.72 + .28*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y), .25));
    col += (h1(gl_FragCoord.xy + fract(t)*91.) - .5) * .03;
    gl_FragColor = vec4(col, 1.);
  }`;

  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  const uR = gl.getUniformLocation(prog, 'R'), uT = gl.getUniformLocation(prog, 'T'), uS = gl.getUniformLocation(prog, 'S');

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);

  // render below native resolution; the pattern is soft enough that it upscales cleanly
  const SCALE = 0.7;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * SCALE;
    const w = Math.max(1, Math.floor(innerWidth * dpr)), h = Math.max(1, Math.floor(innerHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }
  addEventListener('resize', resize); resize();

  // somas: three wanderers + one that eases toward the pointer
  const seeds = [0, 1, 2].map(() => [Math.random() * 100, .7 + Math.random() * .3]);
  const target = { x: .62, y: .4 }, follow = { x: .62, y: .4 };
  const mv = (x, y) => { target.x = x / innerWidth; target.y = 1 - y / innerHeight; };
  addEventListener('mousemove', e => mv(e.clientX, e.clientY));
  addEventListener('touchmove', e => mv(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  const S = new Float32Array(12);
  let t0 = performance.now(), last = t0;
  function frame(now) {
    const t = (now - t0) / 1000, dt = Math.min((now - last) / 1000, .05); last = now;
    resize();
    seeds.forEach(([s, str], i) => {
      const tt = t * .035 + s;
      S[i * 3] = .5 + .42 * Math.sin(tt * 1.1 + i * 2.1) * Math.cos(tt * .37);
      S[i * 3 + 1] = .5 + .40 * Math.sin(tt * .83 + i * 1.3);
      S[i * 3 + 2] = str;
    });
    const ease = 1 - Math.exp(-dt * 1.6);
    follow.x += (target.x - follow.x) * ease; follow.y += (target.y - follow.y) * ease;
    S[9] = follow.x; S[10] = follow.y; S[11] = 1;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, 40 + t);
    gl.uniform3fv(uS, S);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
