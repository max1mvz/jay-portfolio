/* ============================================================
   THE PALETTE — scroll-scrubbed color burst (procedural scene)
   Pantone-style color cards explode from the centre as you
   scroll, then settle into a tidy swatch strip. Colors come
   from the real brand palettes in data/brands.json (grad1/2 of
   every brand + the site lime/bone), so it's literally the
   palettes of the work, detonating.
   ============================================================ */
(function () {
  "use strict";
  var section = document.getElementById("burst");
  if (!section) return;
  var canvas = section.querySelector("canvas");
  var ctx = canvas.getContext("2d");
  var lines = [].slice.call(section.querySelectorAll(".reveal-line"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var chips = [];

  var FALLBACK = ["#c6ff3d", "#3a5a4a", "#8ac9a0", "#5a4a3a", "#c9a86a", "#4a3a5a", "#a08ac9",
    "#3a4a5a", "#8aa0c9", "#5a3a4a", "#c99ab0", "#3a4a6b", "#8aa0c8", "#2f4a55", "#6fb3c9",
    "#5a523a", "#c9bf7f", "#5a3a3a", "#c98a8a", "#efe9d8"];

  fetch("../data/brands.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var cols = [];
      (d.items || []).forEach(function (b) {
        if (b.grad1) cols.push(b.grad1);
        if (b.grad2) cols.push(b.grad2);
      });
      cols.push("#c6ff3d", "#efe9d8");
      build(cols.length > 2 ? cols : FALLBACK);
    })
    .catch(function () { build(FALLBACK); });

  function build(colors) {
    chips = colors.map(function (c, i) {
      var n = colors.length;
      return {
        c: c,
        a: (i / n) * Math.PI * 2 + (i % 5) * 0.35,          /* burst direction */
        d: 0.3 + ((i * 137) % 100) / 100 * 0.7,             /* burst distance  */
        r: (((i * 97) % 100) / 100) * 2 - 1,                /* spin            */
        s: 0.75 + ((i * 53) % 100) / 100 * 0.65,            /* size            */
        label: "JL-" + String(i + 1).padStart(2, "0")
      };
    });
    draw(reduce ? 0.55 : progress()); /* first frame as soon as palette is ready */
  }

  function smooth(p) { return p * p * (3 - 2 * p); }
  function progress() {
    var rect = section.getBoundingClientRect();
    var travel = rect.height - window.innerHeight;
    if (travel <= 0) return 0;
    var p = -rect.top / travel;
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  function draw(p) {
    var w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== w * DPR) { canvas.width = w * DPR; canvas.height = h * DPR; }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#08090c";
    ctx.fillRect(0, 0, w, h);
    if (!chips.length) return;

    var q = smooth(p);
    var e = smooth(Math.min(1, q / 0.7));                    /* explode phase */
    var f = smooth(Math.max(0, (q - 0.78) / 0.22));          /* settle phase  */
    var cx = w / 2, cy = h * 0.46;
    var maxR = Math.sqrt(w * w + h * h) / 2 * 0.92;
    var n = chips.length;

    /* faint lime shockwave ring */
    if (e > 0.02 && f < 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.72 * e, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(198,255,61," + (0.22 * (1 - e) * (1 - f)).toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    for (var i = 0; i < n; i++) {
      var ch = chips[i];
      /* exploded position */
      var ex = cx + Math.cos(ch.a) * maxR * ch.d * e;
      var ey = cy + Math.sin(ch.a) * maxR * ch.d * e * 0.72;
      /* settled swatch-strip position */
      var gap = Math.min(58, (w * 0.86) / n);
      var ax = w / 2 + (i - (n - 1) / 2) * gap;
      var ay = h * 0.55;
      var x = ex + (ax - ex) * f;
      var y = ey + (ay - ey) * f;
      var rot = ch.r * 2.4 * e * (1 - f);
      var cw = (46 + 34 * ch.s) * (0.25 + 0.75 * e) * (1 - 0.3 * f);
      var chh = cw * 1.38;
      var alpha = Math.max(0, Math.min(1, e * 1.4));

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      /* pantone-style card: white frame, colour block, label strip */
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#f5f2e9";
      ctx.fillRect(-cw / 2, -chh / 2, cw, chh);
      ctx.shadowColor = "transparent";
      ctx.fillStyle = ch.c;
      ctx.fillRect(-cw / 2 + cw * 0.07, -chh / 2 + cw * 0.07, cw * 0.86, chh * 0.68);
      if (cw > 46) {
        ctx.fillStyle = "#1d1b16";
        ctx.font = "600 " + Math.max(7, cw * 0.11) + "px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(ch.label, -cw / 2 + cw * 0.09, chh / 2 - chh * 0.16);
        ctx.fillStyle = "rgba(29,27,22,0.55)";
        ctx.font = "500 " + Math.max(6, cw * 0.085) + "px Inter, sans-serif";
        ctx.fillText(ch.c.toUpperCase(), -cw / 2 + cw * 0.09, chh / 2 - chh * 0.06);
      }
      ctx.restore();
    }

    /* caption lines share the engine's [in,out] opacity windows */
    for (var j = 0; j < lines.length; j++) {
      var el = lines[j];
      var a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
      var mid = (a + b) / 2, half = (b - a) / 2;
      var o = Math.max(0, Math.min(1, 1 - Math.abs(p - mid) / half));
      el.style.opacity = o.toFixed(3);
      el.style.transform = "translateY(" + ((1 - o) * 30).toFixed(1) + "px)";
    }
  }

  window.__burstDraw = draw; /* debug/test hook: draw one frame at a given progress */

  if (reduce) {
    /* static exploded still */
    var t = setInterval(function () { if (chips.length) { draw(0.55); clearInterval(t); } }, 120);
    window.addEventListener("resize", function () { draw(0.55); });
    return;
  }
  var raf = null, visible = false;
  function loop() { draw(progress()); raf = requestAnimationFrame(loop); }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  new IntersectionObserver(function (es) {
    es.forEach(function (en) { visible = en.isIntersecting; (visible && !document.hidden) ? start() : stop(); });
  }, { threshold: 0 }).observe(section);
  document.addEventListener("visibilitychange", function () { (visible && !document.hidden) ? start() : stop(); });
})();
