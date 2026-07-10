/* =========================================================
   Jay Lovete — "Undertones" animated background
   An original WebGL shader: near-black base with slow,
   domain-warped colour undertones (cool blue / teal, with
   faint lime pockets) flowing underneath the page. Inspired
   by the flowing-gradient look; not copied from any source.

   Degrades gracefully: if WebGL is unavailable the page keeps
   its CSS radial-gradient background. Honours reduced-motion
   (renders a single still frame) and pauses when the tab is
   hidden.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("shaderBg");
  if (!canvas) return;

  var gl = canvas.getContext("webgl", { antialias: false, depth: false, alpha: false }) ||
           canvas.getContext("experimental-webgl", { antialias: false, depth: false, alpha: false });
  if (!gl) return; /* fallback: CSS gradient on .bg-mesh stays visible */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var VERT = [
    "attribute vec2 a_pos;",
    "void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res;",
    "uniform float u_time;",

    "float hash(vec2 p){",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  float a = hash(i), b = hash(i + vec2(1.0,0.0));",
    "  float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);",
    "}",
    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res.xy;",
    "  vec2 p = uv;",
    "  p.x *= u_res.x / u_res.y;",          /* aspect correct */
    "  p *= 1.6;",
    "  float t = u_time * 0.045;",

    /* one domain-warp pass = slow flowing motion */
    "  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.8));",
    "  float f = fbm(p + 2.2 * q + vec2(t * 0.3, 0.0));",
    "  float g = fbm(p * 0.8 - 1.5 * q - vec2(0.0, t * 0.25));",

    /* palette — keep it dark so text stays readable */
    "  vec3 base = vec3(0.031, 0.035, 0.047);",   /* near-black, faint cool */
    "  vec3 cool = vec3(0.10, 0.17, 0.34);",      /* deep blue */
    "  vec3 teal = vec3(0.05, 0.21, 0.21);",      /* muted teal */
    "  vec3 violet = vec3(0.17, 0.09, 0.28);",    /* dusk violet */
    "  vec3 lime = vec3(0.78, 1.0, 0.24);",       /* accent */

    "  vec3 col = base;",
    "  col = mix(col, cool, smoothstep(0.20, 0.95, f) * 0.70);",
    "  col = mix(col, teal, smoothstep(0.32, 0.9, g) * 0.45);",
    "  col = mix(col, violet, smoothstep(0.30, 0.92, q.x) * 0.34);",
    "  col += lime * pow(smoothstep(0.6, 1.0, f), 3.0) * 0.12;",  /* faint lime pockets */

    /* soft top glow to match the site's existing radial */
    "  col += vec3(0.05, 0.06, 0.09) * smoothstep(0.95, 0.0, uv.y);",

    /* vignette */
    "  float vig = smoothstep(1.35, 0.3, length(uv - 0.5));",
    "  col *= mix(0.72, 1.06, vig);",

    /* fine grain to keep it filmic / avoid banding */
    "  col += (hash(gl_FragCoord.xy + t) * 2.0 - 1.0) * 0.012;",

    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("shader-bg compile error:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("shader-bg link error:", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  /* Fullscreen triangle */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "u_res");
  var uTime = gl.getUniformLocation(prog, "u_time");

  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    var w = Math.floor(canvas.clientWidth * dpr);
    var h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  function draw(timeSec) {
    gl.uniform1f(uTime, timeSec);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var start = performance.now();
  var raf = null, running = false;
  function frame(now) {
    if (!running) return;
    resize();
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  /* Reveal once the first frame is painted (avoids a flash). */
  resize();
  draw(0);
  canvas.classList.add("is-ready");

  if (reduceMotion) {
    /* single still frame; just keep it sized on resize */
    window.addEventListener("resize", function () { resize(); draw(8.0); });
    draw(8.0);
  } else {
    play();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause(); else play();
    });
    window.addEventListener("resize", resize);
  }
})();
