/* =========================================================
   Jay Lovete — Portfolio interactions (v2 · motion layer)
   ========================================================= */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(min-width: 901px)").matches && !reduce;
  const raf = window.requestAnimationFrame.bind(window);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Project data ----------
     Drop a file named images/<slug>.jpg (or .png) into the project and the card
     will use it automatically. If the file is missing, the elegant gradient +
     monogram placeholder shows instead. */
  const projects = [
    { name: "Ease Healthcare", slug: "ease", cat: "pH-balanced intimate wellness · full case study inside", monogram: "E", c1: "#3a4a6b", c2: "#8aa0c8", tag: "Case study", page: "ease.html", url: "https://www.amazon.com/stores/Ease/page/91A7CE5A-BD29-4BA9-8320-8B8ACDABF13A?lp_asin=B0BGYCGD4N&ref_=ast_bln", wide: true },
  ];

  const grid = document.getElementById("workGrid");
  if (grid) {
    projects.forEach((p, i) => {
      const a = document.createElement("a");
      const dest = p.page || p.url;
      a.href = dest;
      a.className = "card" + (p.wide ? " card--wide" : "");
      a.setAttribute("data-cursor", "");
      const hasLink = dest && dest !== "#";
      if (hasLink) {
        a.classList.add("card--linked");
        if (!p.page) { a.target = "_blank"; a.rel = "noopener"; }
      }
      a.style.transitionDelay = (i % 2) * 0.08 + "s";
      a.innerHTML = `
        <span class="card__art" style="background:linear-gradient(135deg, ${p.c1}, ${p.c2})"></span>
        <span class="card__monogram">${p.monogram}</span>
        <span class="card__tag">${p.tag}</span>
        <span class="card__index">0${i + 1} — Amazon</span>
        <span class="card__name">${p.name}</span>
        <span class="card__cat">${p.cat}</span>
        <span class="card__cta">${p.page ? "View case study" : "Visit storefront"} <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5"/></svg></span>`;
      grid.appendChild(a);
      const art = a.querySelector(".card__art");
      const probe = new Image();
      let triedPng = false;
      probe.onload = () => {
        art.style.backgroundImage = `url('${probe.src}')`;
        art.style.backgroundSize = "cover";
        art.style.backgroundPosition = "center";
        a.classList.add("has-img");
      };
      probe.onerror = () => {
        if (!triedPng) { triedPng = true; probe.src = `images/${p.slug}.png`; }
      };
      probe.src = `images/${p.slug}.jpg`;
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  if (cursor && desktop) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf(loop);
    })();
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest(".card, .cat-card");
      if (view) { cursor.classList.add("is-view"); return; }
      if (e.target.closest("[data-cursor], a, button")) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(".card, .cat-card")) cursor.classList.remove("is-view");
      if (e.target.closest("[data-cursor], a, button")) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- Scroll: progress, nav state, hero parallax, marquee velocity ---------- */
  const nav = document.getElementById("nav");
  const progress = document.querySelector(".scroll-progress");
  const heroInner = document.querySelector(".hero__inner");
  const heroCredit = document.querySelector(".hero__credit");
  const marquee = document.querySelector(".marquee");

  const lightZones = document.querySelectorAll('[data-nav="light"]');

  let lastY = window.scrollY;
  let skew = 0, skewTarget = 0;

  function onScroll() {
    const h = document.documentElement;
    const y = h.scrollTop;
    const sc = y / (h.scrollHeight - h.clientHeight || 1);
    if (progress) progress.style.width = sc * 100 + "%";
    if (nav) {
      nav.classList.toggle("is-scrolled", y > 40);
      // Invert nav colours while a light (lime) section sits under the bar
      let light = false;
      lightZones.forEach((z) => {
        const r = z.getBoundingClientRect();
        if (r.top <= 70 && r.bottom >= 70) light = true;
      });
      nav.classList.toggle("is-light", light);
    }

    if (!reduce) {
      if (heroInner && y < window.innerHeight) {
        heroInner.style.transform = `translateY(${y * 0.18}px)`;
        if (heroCredit) heroCredit.style.opacity = String(clamp(1 - y / 400, 0, 1));
      }
      // marquee skew reacts to scroll speed
      skewTarget = clamp((y - lastY) * 0.35, -10, 10);
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (marquee && !reduce) {
    (function marqueeLoop() {
      skewTarget *= 0.9;                         // decay back to rest
      skew += (skewTarget - skew) * 0.1;
      if (Math.abs(skew) > 0.01) marquee.style.transform = `skewX(${skew}deg)`;
      raf(marqueeLoop);
    })();
  }

  /* ---------- Reveal on scroll (blur-in + local stagger) ---------- */
  document.querySelectorAll(".reveal").forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const sibs = [...parent.children].filter((c) => c.classList.contains("reveal"));
    const idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = (idx * 0.07).toFixed(2) + "s";
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .card").forEach((el) => io.observe(el));

  /* ---------- Hero kinetic reveal ---------- */
  function revealHero() {
    document.querySelectorAll(".hero__title .word").forEach((w, i) => {
      w.style.transition = "transform 1.1s cubic-bezier(0.22,1,0.36,1)";
      w.style.transitionDelay = (0.05 + i * 0.08).toFixed(2) + "s";
      raf(() => { w.style.transform = "translateY(0)"; });
    });
  }

  /* ---------- 3D tilt on cards ---------- */
  function initTilt() {
    if (!desktop) return;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const strength = parseFloat(el.dataset.tilt) || 6;
      const lift = parseFloat(el.dataset.lift) || 0;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform .1s linear";
        el.style.transform =
          `perspective(1000px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateY(${lift}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .5s var(--ease)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 520);
      });
    });
  }

  /* ---------- Magnetic buttons/links ---------- */
  function initMagnetic() {
    if (!desktop) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform .1s linear";
        el.style.transform = `translate(${(mx * s).toFixed(1)}px, ${(my * s).toFixed(1)}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform .4s var(--ease)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 420);
      });
    });
  }

  // Auto-wire interaction hooks (no per-page HTML needed)
  document.querySelectorAll(".cat-card").forEach((el) => { el.dataset.tilt = "7"; el.dataset.lift = "-6"; });
  document.querySelectorAll(".card").forEach((el) => { el.dataset.tilt = "4"; });
  document.querySelectorAll(".note").forEach((el) => { el.dataset.tilt = "5"; el.dataset.lift = "-4"; });
  const _aframe = document.querySelector(".anatomy__frame");
  if (_aframe) _aframe.dataset.tilt = "6";
  document.querySelectorAll(".nav__cta, .hero__scroll, .contact__mail, .cta__mail").forEach((el) => { el.dataset.magnetic = "0.35"; });
  initTilt();
  initMagnetic();

  /* ---------- Anatomy: scroll-synced active step ---------- */
  const anatomy = document.querySelector(".anatomy");
  if (anatomy) {
    const notes = [...anatomy.querySelectorAll(".note")];
    const notesWrap = anatomy.querySelector(".anatomy__notes");
    const stepEl = anatomy.querySelector(".anatomy__step b");
    const aio = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        notes.forEach((n) => n.classList.remove("is-active"));
        en.target.classList.add("is-active");
        const idx = notes.indexOf(en.target) + 1;
        if (stepEl) stepEl.textContent = ("0" + idx).slice(-2);
        if (notesWrap) notesWrap.style.setProperty("--rail", (idx / notes.length * 100) + "%");
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    notes.forEach((n) => aio.observe(n));
  }

  /* ---------- Hero orb: drift toward cursor ---------- */
  const vizScene = document.querySelector(".viz__scene");
  if (vizScene && desktop) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 28;
      ty = -(e.clientY / window.innerHeight - 0.5) * 22;
    });
    (function vloop() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      vizScene.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
      raf(vloop);
    })();
  }

  /* ---------- Animated counters (eased) ---------- */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, dur = 1500, start = performance.now();
      (function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(end * easeOut(t));
        if (t < 1) raf(tick);
      })(start);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((c) => cio.observe(c));

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- Year ---------- */
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Background orb parallax ---------- */
  const orbs = document.querySelectorAll(".orb");
  if (orbs.length && !reduce) {
    window.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5);
      const y = (e.clientY / window.innerHeight - 0.5);
      orbs.forEach((o, i) => {
        const d = (i + 1) * 14;
        o.style.marginLeft = x * d + "px";
        o.style.marginTop = y * d + "px";
      });
    });
  }

  /* ---------- Preloader intro (homepage only) ---------- */
  const isHome = !!document.querySelector(".hero__title");
  function runPreloader(done) {
    const pre = document.createElement("div");
    pre.className = "preloader";
    pre.innerHTML =
      '<div class="preloader__inner">' +
        '<div class="preloader__mark">JL</div>' +
        '<div class="preloader__bar"></div>' +
        '<div class="preloader__count">0%</div>' +
      "</div>";
    document.documentElement.classList.add("is-loading");
    document.body.appendChild(pre);
    const bar = pre.querySelector(".preloader__bar");
    const cnt = pre.querySelector(".preloader__count");
    const start = performance.now(), dur = 1300;
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const p = Math.round(t * 100);
      bar.style.setProperty("--p", p + "%");
      cnt.textContent = p + "%";
      if (t < 1) { raf(tick); return; }
      pre.classList.add("is-done");
      document.documentElement.classList.remove("is-loading");
      setTimeout(() => pre.remove(), 1000);
      done && done();
    })(start);
  }

  if (isHome && !reduce) {
    runPreloader(revealHero);
  } else {
    window.addEventListener("load", revealHero);
  }
})();
