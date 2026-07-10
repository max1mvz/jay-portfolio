/* ============================================================
   THE REEL — live scenes (data-driven)
   Loads the image list from ../data/reel.json (editable in
   Monogram → Reel), composes the graded "wall of work" on an
   offscreen canvas, and renders the two camera moves — dolly-in
   and tracking shot — directly per scroll frame. No pre-rendered
   frames, no ffmpeg: change the JSON, refresh, new film.
   ============================================================ */
(function () {
  "use strict";
  const S = { wall: null, W: 0, H: 0 };
  const BG = "#08090c";
  const ss = (p) => p * p * (3 - 2 * p); /* smoothstep */

  /* ---------- compose the wall ---------- */
  function buildWall(srcs) {
    const imgs = srcs.map((src) => new Promise((res) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    }));
    Promise.all(imgs).then((loaded) => {
      const pics = loaded.filter(Boolean);
      if (!pics.length) return;
      const TILE = 640, PAD = 10, CELL = TILE + PAD * 2;
      const cols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(pics.length * 2))));
      const rows = Math.ceil(pics.length / cols);
      const W = cols * CELL;
      const gridH = rows * CELL;
      const H = Math.max(gridH, Math.round(W * 9 / 16)); /* at least 16:9 */
      const offY = Math.round((H - gridH) / 2);
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const x = c.getContext("2d");
      x.fillStyle = BG;
      x.fillRect(0, 0, W, H);
      const filterOK = "filter" in x;
      if (filterOK) x.filter = "brightness(0.74) saturate(1.35) contrast(1.08)"; /* the cinematic grade */
      pics.forEach((im, i) => {
        const cx = (i % cols) * CELL + PAD, cy = offY + Math.floor(i / cols) * CELL + PAD;
        /* cover-crop into a square tile */
        const r = im.naturalWidth / im.naturalHeight;
        let sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight;
        if (r > 1) { sw = sh; sx = (im.naturalWidth - sw) / 2; }
        else { sh = sw; sy = (im.naturalHeight - sh) / 2; }
        x.drawImage(im, sx, sy, sw, sh, cx, cy, TILE, TILE);
      });
      x.filter = "none";
      if (!filterOK) { /* fallback grade for browsers without ctx.filter */
        x.fillStyle = "rgba(4,6,2,0.34)";
        x.fillRect(0, 0, W, H);
      }
      S.wall = c; S.W = W; S.H = H;
    });
  }

  /* ---------- draw one camera-move frame ---------- */
  function drawWindow(ctx, canvas, cx, cy, zoom) {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cw, ch);
    if (!S.wall) return;
    let sw = S.W / zoom;
    let sh = sw * ch / cw;
    if (sh > S.H) { sh = S.H; sw = sh * cw / ch; }
    const sx = Math.max(0, Math.min(S.W - sw, cx - sw / 2));
    const sy = Math.max(0, Math.min(S.H - sh, cy - sh / 2));
    ctx.drawImage(S.wall, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  /* ---------- the two shots (scroll progress = timeline) ---------- */
  window.SCRUB_SECTIONS = [
    { section: "#dive", bg: BG,
      render(ctx, canvas, p) {
        const q = ss(p);
        drawWindow(ctx, canvas, 0.583 * S.W, 0.5 * S.H, 1 + 1.8 * q); /* wide wall → one piece */
      } },
    { section: "#track", bg: BG,
      render(ctx, canvas, p) {
        const q = ss(p);
        const zoom = 2 + 0.12 * Math.sin(Math.PI * p);               /* gentle breathe */
        const sw = S.W / zoom;
        drawWindow(ctx, canvas, sw / 2 + q * (S.W - sw), 0.5 * S.H, zoom); /* glide across */
      } }
  ];

  /* ---------- load the picked images ---------- */
  fetch("../data/reel.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => buildWall((d.images || []).filter(Boolean)))
    .catch((e) => console.error("reel: couldn't load data/reel.json", e));
})();
