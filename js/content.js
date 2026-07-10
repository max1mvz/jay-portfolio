/* =========================================================
   Jay Lovete — Content renderer (v1)
   Renders the gallery pages from data/*.json so the whole
   site can be edited from /admin (Decap CMS). The page shells
   (hero, nav, footer) stay in HTML; only the card/brand grids
   are data-driven here.
   ========================================================= */
(function () {
  "use strict";

  var desktop = window.matchMedia("(min-width: 901px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function grad(a, b) {
    return "linear-gradient(135deg, " + (a || "#3a3a4a") + ", " + (b || "#8a8a9a") + ")";
  }
  function getJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url + " (" + r.status + ")");
      return r.json();
    });
  }

  /* ---------- Generic copy binding ----------
     Any element with data-cms="file:dot.path" gets its innerHTML set from JSON.
     data-cms-src / data-cms-href set the src / href instead. An href ref may add
     "|mailto" or "|tel" to prepend a scheme. An empty string value hides the
     element (lets you delete e.g. a draft banner from the admin). */
  var FILES = {
    home: "data/home.json", site: "data/site.json", cs: "data/case-studies.json",
    storefronts: "data/storefronts.json", aplus: "data/aplus.json", infographics: "data/infographics.json",
    brands: "data/brands.json"
  };
  function getPath(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function bindCopy() {
    var CMS_ATTRS = ["data-cms", "data-cms-src", "data-cms-href", "data-cms-title", "data-cms-count", "data-cms-attr", "data-cms-show"];
    var nodes = document.querySelectorAll(CMS_ATTRS.map(function (a) { return "[" + a + "]"; }).join(","));
    if (!nodes.length) return Promise.resolve();
    var fkeys = Object.keys(FILES);
    var need = {};
    nodes.forEach(function (n) {
      CMS_ATTRS.forEach(function (a) {
        var v = n.getAttribute(a);
        if (v) fkeys.forEach(function (f) { if (v.indexOf(f + ":") > -1) need[f] = 1; });
      });
    });
    var keys = Object.keys(need);
    return Promise.all(keys.map(function (f) {
      return getJSON(FILES[f]).then(function (d) { return [f, d]; }).catch(function () { return [f, null]; });
    })).then(function (pairs) {
      var data = {};
      pairs.forEach(function (p) { data[p[0]] = p[1]; });
      function val(ref) {
        if (!ref) return undefined;
        ref = ref.split("|")[0];
        var i = ref.indexOf(":"); if (i < 0) return undefined;
        var f = ref.slice(0, i), p = ref.slice(i + 1);
        return data[f] ? getPath(data[f], p) : undefined;
      }
      nodes.forEach(function (n) {
        var t = n.getAttribute("data-cms");
        if (t != null) {
          var v = val(t);
          if (v != null) { if (v === "") n.style.display = "none"; else n.innerHTML = v; }
        }
        var s = n.getAttribute("data-cms-src");
        if (s) { var sv = val(s); if (sv) n.setAttribute("src", sv); }
        var h = n.getAttribute("data-cms-href");
        if (h) {
          var hv = val(h);
          if (hv) {
            var scheme = h.indexOf("|") > -1 ? h.split("|")[1] : "";
            n.setAttribute("href", scheme ? scheme + ":" + hv : hv);
          }
        }
        var c = n.getAttribute("data-cms-count");
        if (c) { var cv = val(c); if (cv != null) { n.setAttribute("data-count", cv); n.textContent = cv; } }
        var sw = n.getAttribute("data-cms-show");
        if (sw) { var swv = val(sw); n.style.display = (swv != null && swv !== "") ? "" : "none"; }
        var at = n.getAttribute("data-cms-attr");
        if (at) { var ci = at.indexOf(":"); var an = at.slice(0, ci); var av = val(at.slice(ci + 1)); if (av != null) n.setAttribute(an, av); }
        var ti = n.getAttribute("data-cms-title");
        if (ti) buildHeroTitle(n, val(ti));
      });
      document.dispatchEvent(new CustomEvent("cms:bound"));
    });
  }
  /* Rebuild the kinetic hero headline from a list of lines (mark italics with *word*). */
  function buildHeroTitle(el, lines) {
    if (!Array.isArray(lines)) return;
    el.innerHTML = lines.map(function (line) {
      var words = String(line).split(/\s+/).filter(Boolean).map(function (w) {
        var em = /^\*.*\*$/.test(w);
        return '<span class="word' + (em ? " italic" : "") + '">' + esc(w.replace(/^\*|\*$/g, "")) + "</span>";
      }).join(" ");
      return '<span class="line">' + words + "</span>";
    }).join("");
    el.querySelectorAll(".word").forEach(function (w, i) {
      w.style.transition = "transform 1.1s cubic-bezier(0.22,1,0.36,1)";
      w.style.transitionDelay = (0.05 + i * 0.08).toFixed(2) + "s";
      requestAnimationFrame(function () { w.style.transform = "translateY(0)"; });
    });
  }
  /* Set a card/tile background image, keeping the gradient if it 404s. */
  function loadCover(artEl, src, hostEl) {
    if (!src) return;
    var probe = new Image();
    probe.onload = function () {
      artEl.style.backgroundImage = "url('" + src + "')";
      artEl.style.backgroundSize = "cover";
      artEl.style.backgroundPosition = "center";
      if (hostEl) hostEl.classList.add("has-img");
    };
    probe.src = src;
  }
  /* Lightweight 3D tilt (parity with main.js, for injected elements). */
  function initTilt(scope) {
    if (!desktop) return;
    scope.querySelectorAll("[data-tilt]").forEach(function (el) {
      var s = parseFloat(el.dataset.tilt) || 5;
      var lift = parseFloat(el.dataset.lift) || 0;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform .1s linear";
        el.style.transform = "perspective(1000px) rotateX(" + (-py * s).toFixed(2) +
          "deg) rotateY(" + (px * s).toFixed(2) + "deg) translateY(" + lift + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform .5s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "";
        setTimeout(function () { el.style.transition = ""; }, 520);
      });
    });
  }

  /* ---------- Card markup (storefronts / A+ / featured infographic) ---------- */
  function cardMarkup(it, type) {
    /* Link to a bespoke page only if it's a real .html file; otherwise use the dynamic
       case template by slug, so newly-added items are clickable no matter what gets
       typed in the "Case study page" field (and with no per-item HTML file). */
    var hasPage = it.page && /\.html?(\?|#|$)/i.test(it.page);
    var dest = hasPage ? it.page : (type && it.slug ? "case.html?type=" + type + "&slug=" + encodeURIComponent(it.slug) : "");
    var linked = !!dest;
    var el = linked ? "a" : "article";
    var cls = "card is-in" + (it.featured ? " card--feature" : "") + (linked ? " card--linked" : "");
    var attrs = ' class="' + cls + '" data-cursor data-tilt="4"';
    if (linked) attrs += ' href="' + esc(dest) + '"';
    if (it.image) attrs += ' data-image="' + esc(it.image) + '"';
    var inner =
      '<span class="card__art" style="background:' + grad(it.grad1, it.grad2) + '"></span>' +
      (it.badge ? '<span class="card__badge">' + esc(it.badge) + "</span>" : "") +
      (it.monogram ? '<span class="card__monogram">' + esc(it.monogram) + "</span>" : "") +
      '<span class="card__tag">' + esc(it.tag) + "</span>" +
      '<span class="card__index">' + esc(it.index) + "</span>" +
      '<span class="card__name">' + esc(it.name) + "</span>" +
      '<span class="card__cat">' + esc(it.category) + "</span>";
    return "<" + el + attrs + ">" + inner + "</" + el + ">";
  }

  function renderCards(container, items, type) {
    container.innerHTML = (items || []).map(function (it) { return cardMarkup(it, type); }).join("");
    container.querySelectorAll(".card[data-image]").forEach(function (card) {
      loadCover(card.querySelector(".card__art"), card.dataset.image, card);
    });
    initTilt(container);
  }

  /* ---------- Infographics: proj tiles + lightbox ---------- */
  function projMarkup(b, i) {
    var no = ("0" + (i + 1)).slice(-2);
    var n = (b.images || []).length;
    var first = b.cover || (b.images && b.images[0]) || "";
    return '<button class="proj is-in" type="button" data-gallery="' + esc(b.key) +
      '" data-tilt="4" data-cursor>' +
      '<span class="proj__art"' + (first ? ' data-image="' + esc(first) + '"' : "") + "></span>" +
      '<span class="proj__no">' + no + "</span>" +
      '<span class="proj__name">' + esc(b.name) + "</span>" +
      '<span class="proj__tag">' + esc(b.tag) + "</span>" +
      '<span class="proj__count"><span>' + n + " visual" + (n === 1 ? "" : "s") + "</span>" +
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6"/></svg>' +
      "</span></button>";
  }

  function initInfographics(data) {
    var feature = document.getElementById("infogFeature");
    if (feature && data.featured) {
      var f = data.featured;
      f.featured = true;
      feature.innerHTML = cardMarkup(f, "infographics");
      feature.querySelectorAll(".card[data-image]").forEach(function (card) {
        loadCover(card.querySelector(".card__art"), card.dataset.image, card);
      });
      initTilt(feature);
    }

    var grid = document.getElementById("projGrid");
    var brands = data.brands || [];
    var byKey = {};
    brands.forEach(function (b) { byKey[b.key] = b; });

    if (grid) {
      grid.innerHTML = brands.map(projMarkup).join("");
      grid.querySelectorAll(".proj__art[data-image]").forEach(function (art) {
        loadCover(art, art.dataset.image, art);
      });
      initTilt(grid);
    }

    /* Lightbox (uses the #lightbox markup already in the page) */
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var lbGrid = document.getElementById("lbGrid"),
      lbTitle = document.getElementById("lbTitle"),
      lbSub = document.getElementById("lbSub"),
      lbClose = document.getElementById("lbClose");

    function openGallery(key) {
      var b = byKey[key];
      if (!b) return;
      var imgs = b.images || [];
      lbTitle.textContent = b.name;
      lbSub.textContent = b.tag + " · " + imgs.length + " visual" + (imgs.length === 1 ? "" : "s");
      lbGrid.innerHTML = "";
      imgs.forEach(function (src) {
        var fig = document.createElement("figure");
        fig.className = "lb-item";
        var im = document.createElement("img");
        im.src = src; im.alt = b.name + " infographic"; im.loading = "lazy";
        im.onerror = function () {
          fig.classList.add("is-empty");
          fig.innerHTML = '<span class="lb-empty">' + esc(src) + "</span>";
        };
        fig.appendChild(im);
        lbGrid.appendChild(fig);
      });
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeGallery() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    if (grid) grid.addEventListener("click", function (e) {
      var tile = e.target.closest(".proj");
      if (tile) openGallery(tile.dataset.gallery);
    });
    if (lbClose) lbClose.addEventListener("click", closeGallery);
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lightbox__scroll")) closeGallery();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeGallery(); });
  }

  /* ---------- Full-screenshot image, managed on a gallery item (Storefronts / A+) ----------
     A case page tags its showcase img with data-store-img and the wrapper with
     data-store-show. The value is "<file>:<slug>" (e.g. "aplus:Optiflow"); a bare
     "<slug>" defaults to the storefronts file. We look the item up in that file's
     items[] and pull its `storefrontImage` field, showing the wrapper only when set. */
  function applyItemImages() {
    var nodes = document.querySelectorAll("[data-store-img],[data-store-show]");
    if (!nodes.length) return;
    function parse(ref) {
      if (!ref) return null;
      var i = ref.indexOf(":");
      return i < 0 ? { file: "storefronts", slug: ref } : { file: ref.slice(0, i), slug: ref.slice(i + 1) };
    }
    var need = {};
    nodes.forEach(function (n) {
      ["data-store-img", "data-store-show"].forEach(function (a) {
        var p = parse(n.getAttribute(a)); if (p && FILES[p.file]) need[p.file] = 1;
      });
    });
    var keys = Object.keys(need);
    Promise.all(keys.map(function (f) {
      return getJSON(FILES[f]).then(function (d) { return [f, d]; }).catch(function () { return [f, null]; });
    })).then(function (pairs) {
      var bySlug = {};
      pairs.forEach(function (pr) {
        bySlug[pr[0]] = {};
        var d = pr[1]; if (d && d.items) d.items.forEach(function (it) { bySlug[pr[0]][it.slug] = it; });
      });
      function look(ref) { var p = parse(ref); return p ? (bySlug[p.file] || {})[p.slug] : null; }
      nodes.forEach(function (n) {
        if (n.hasAttribute("data-store-img")) { var it = look(n.getAttribute("data-store-img")); if (it && it.storefrontImage) n.setAttribute("src", it.storefrontImage); }
        if (n.hasAttribute("data-store-show")) { var it2 = look(n.getAttribute("data-store-show")); n.style.display = (it2 && it2.storefrontImage) ? "" : "none"; }
      });
    }).catch(function (e) { console.error(e); });
  }

  /* ---------- Dynamic case study (case.html?type=<file>&slug=<slug>) ----------
     Renders a full case-study page for ANY gallery item, so newly-added items are
     clickable with editable, placeholder-filled copy and no per-item HTML file. */
  function metaItem(k, v) {
    return '<div class="case-meta__item"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + "</div></div>";
  }
  function renderDynamicCase() {
    var root = document.getElementById("caseRoot");
    if (!root) return;
    var params = new URLSearchParams(window.location.search);
    var type = params.get("type"), slug = params.get("slug");
    var backMap = {
      storefronts: { href: "storefronts.html", label: "Storefronts", scope: "Storefront" },
      aplus: { href: "aplus.html", label: "A+ Content", scope: "A+ Content" },
      infographics: { href: "infographics.html", label: "Infographics", scope: "Infographics" }
    };
    var back = backMap[type] || { href: "home.html", label: "Home", scope: "Project" };
    var backEl = document.getElementById("caseBack"), backLbl = document.getElementById("caseBackLabel");
    if (backEl) backEl.setAttribute("href", back.href);
    if (backLbl) backLbl.textContent = back.label;

    function notFound(msg) {
      root.innerHTML = '<section class="case-hero"><h1 class="case-hero__title reveal is-in">Not found</h1>' +
        '<p class="case-hero__lead reveal is-in">' + esc(msg) + '</p>' +
        '<div class="case-hero__actions reveal is-in"><a class="btn btn--ghost" href="' + back.href + '">← ' + esc(back.label) + '</a></div></section>';
    }
    if (!FILES[type] || !slug) { notFound("This case study link is missing its type or slug."); return; }

    getJSON(FILES[type]).then(function (d) {
      var item = (d.items || []).filter(function (it) { return it.slug === slug; })[0];
      if (!item) { notFound("No “" + slug + "” item exists in " + back.label + " anymore."); return; }
      document.title = item.name + " — Case Study · Jay Lovete";

      var c = item.case || {};
      var meta = c.meta || {};
      var sections = (c.sections && c.sections.length) ? c.sections : [
        { label: "The brief", heading: "The brief.", p1: "<em>Placeholder —</em> describe the goal of this project. Edit it in the admin under " + back.label + " → " + item.name + " → “Case study page”.", p2: "" },
        { label: "The idea", heading: "The approach.", p1: "<em>Placeholder —</em> explain the concept and design direction.", p2: "" },
        { label: "The outcome", heading: "The result.", p1: "<em>Placeholder —</em> add the results once you have them.", p2: "" }
      ];

      var html = '<section class="case-hero">' +
        '<p class="case-hero__eyebrow reveal is-in">' + esc(c.eyebrow || item.tag || back.label) + "</p>" +
        '<h1 class="case-hero__title reveal is-in">' + esc(item.name) + "</h1>" +
        '<p class="case-hero__lead reveal is-in">' + (c.lead || ("A short overview of " + esc(item.name) + ". Edit this in the admin.")) + "</p>";
      var actions = "";
      if (item.liveUrl) actions += '<a class="btn btn--primary" data-cursor target="_blank" rel="noopener" href="' + esc(item.liveUrl) + '">View live ↗</a> ';
      actions += '<a class="btn btn--ghost" data-cursor href="' + back.href + '">All ' + esc(back.label) + "</a>";
      html += '<div class="case-hero__actions reveal is-in">' + actions + "</div></section>";

      html += '<div class="case-meta reveal is-in">' +
        metaItem("Role", meta.role || "Senior Graphic Designer") +
        metaItem("Client", meta.client || item.name) +
        metaItem("Scope", meta.scope || back.scope) +
        metaItem("Year", meta.year || String(new Date().getFullYear())) + "</div>";

      if (item.storefrontImage) {
        html += '<section class="case-shot"><div class="case-shot__label reveal is-in"><span>—</span> The design</div>' +
          '<div class="case-shot__frame reveal is-in"><img src="' + esc(item.storefrontImage) + '" alt="' + esc(item.name) + ' design" /></div></section>';
      }

      sections.forEach(function (s, i) {
        html += '<section class="case-section"><div class="case-section__label reveal is-in"><span>' +
          ("0" + (i + 1)).slice(-2) + "</span> — " + esc(s.label || "") + "</div>" +
          '<div class="case-cols"><h2 class="case-h2 reveal is-in">' + (s.heading || "") + "</h2>" +
          '<div class="case-body">' +
          (s.p1 ? '<p class="reveal is-in">' + s.p1 + "</p>" : "") +
          (s.p2 ? '<p class="reveal is-in">' + s.p2 + "</p>" : "") +
          "</div></div></section>";
      });

      root.innerHTML = html;
      initTilt(root);
    }).catch(function (e) { console.error(e); notFound("Couldn’t load the content for this case study."); });
  }

  /* ---------- Brand grid (home) ----------
     A simple "image + name" card per brand, linking to brand.html?key=<key>. */
  function brandCardMarkup(b, i) {
    var dest = "brand.html?key=" + encodeURIComponent(b.key || "");
    /* Letter shown on the tile = override, else the brand's first letter. */
    var letter = (b.monogram || String(b.name || "?").trim().charAt(0) || "?").toUpperCase();
    var no = ("0" + ((i || 0) + 1)).slice(-2);
    return '<a class="brand-card reveal reveal--scale" href="' + esc(dest) + '" data-cursor data-tilt="5" data-lift="-4"' +
      ' style="transition-delay:' + ((i % 4) * 0.06).toFixed(2) + 's">' +
      '<span class="brand-card__art">' +
      '<span class="brand-card__mono">' + esc(letter) + "</span>" +
      (b.cover ? '<img class="brand-card__img" src="' + esc(b.cover) + '" alt="' + esc(b.name) +
        '" loading="lazy" onerror="this.remove()" />' : "") +
      '<span class="brand-card__no">' + no + "</span>" +
      "</span>" +
      '<span class="brand-card__name">' + esc(b.name) + "</span>" +
      (b.tag ? '<span class="brand-card__tag">' + esc(b.tag) + "</span>" : "") +
      "</a>";
  }
  function renderBrands(container, items) {
    container.innerHTML = (items || []).map(brandCardMarkup).join("");
    initTilt(container);
    document.dispatchEvent(new CustomEvent("content:rendered"));
  }

  /* ---------- Hero: vertical drifting image columns (home) ----------
     Two columns of brand-cover cards drift vertically (opposite directions,
     different speeds) via CSS. Each column's cards are duplicated so the loop
     is seamless. Clean, always-alive, no overlap. */
  function columnCard(src) {
    return '<div class="hcol__card"><img src="' + esc(src) + '" alt="" onerror="this.remove()" /></div>';
  }
  function renderColumns(container, items) {
    /* Pull the actual infographics images from every brand (not cover thumbnails). */
    var imgs = [];
    (items || []).forEach(function (b) {
      (b.sections || []).forEach(function (s) {
        if (s.type === "infographics" && s.images) {
          s.images.forEach(function (src) { if (src) imgs.push(src); });
        }
      });
    });
    if (!imgs.length) return;
    var cols = [[], []];
    imgs.forEach(function (src, i) { cols[i % 2].push(src); });
    container.innerHTML = cols.map(function (group, ci) {
      /* duplicate the set so the vertical loop is seamless */
      var cards = group.map(columnCard).join("");
      return '<div class="hcol' + (ci === 1 ? " hcol--down" : "") + '">' + cards + cards + "</div>";
    }).join("");
    initColumns(container);
  }

  /* Scroll-reactive drift: a gentle constant baseline drift (opposite
     directions per column) that speeds up — and can momentarily reverse —
     with scroll velocity, then eases back. JS drives the transform (overriding
     the CSS fallback animation); the rAF loop only runs while the hero is in
     view and the tab is visible. */
  function initColumns(container) {
    var cols = [].slice.call(container.querySelectorAll(".hcol"));
    if (!cols.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; /* static */

    var st = cols.map(function (c, i) {
      c.style.animation = "none";           /* take over from the CSS drift */
      var dir = (i % 2 === 0) ? -1 : 1;     /* col 0 up, col 1 down */
      var h = (c.scrollHeight / 2) || 1;
      return { el: c, dir: dir, base: 0.22 + i * 0.05, h: h, offset: dir < 0 ? 0 : -h };
    });
    var vel = 0, lastY = window.pageYOffset || 0, raf = null, visible = false;

    function frame() {
      vel *= 0.88;                          /* scroll boost eases out */
      st.forEach(function (s) {
        s.offset += s.dir * s.base + s.dir * vel * 0.4;
        var y = s.offset % s.h; if (y > 0) y -= s.h;
        s.el.style.transform = "translateY(" + y.toFixed(2) + "px)";
      });
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { lastY = window.pageYOffset || 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    window.addEventListener("scroll", function () {
      var y = window.pageYOffset || 0;
      vel += (y - lastY); lastY = y;
      if (vel > 60) vel = 60; else if (vel < -60) vel = -60;
    }, { passive: true });
    window.addEventListener("resize", function () {
      st.forEach(function (s) { s.h = (s.el.scrollHeight / 2) || 1; });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (visible) start();
    });

    var viz = container.closest(".hero__viz") || container;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; if (visible && !document.hidden) start(); else stop(); });
      }, { threshold: 0 }).observe(viz);
    } else { visible = true; start(); }
  }

  /* ---------- Brand page (brand.html?key=<key>) ----------
     One page per brand: each section it has (storefront / A+ / infographics)
     is rendered in order; infographic images open in the shared lightbox. */
  function renderBrandPage() {
    var root = document.getElementById("brandRoot");
    if (!root) return;
    var key = new URLSearchParams(window.location.search).get("key");

    function notFound(msg) {
      root.innerHTML = '<section class="case-hero"><h1 class="case-hero__title reveal is-in">Not found</h1>' +
        '<p class="case-hero__lead reveal is-in">' + esc(msg) + "</p>" +
        '<div class="case-hero__actions reveal is-in"><a class="btn btn--ghost" href="home.html#work">← All brands</a></div></section>';
    }
    if (!key) { notFound("This brand link is missing its key."); return; }

    getJSON(FILES.brands).then(function (d) {
      var b = (d.items || []).filter(function (it) { return it.key === key; })[0];
      if (!b) { notFound("No “" + key + "” brand exists anymore."); return; }
      document.title = b.name + " — Jay Lovete";

      var html = '<section class="case-hero">' +
        '<p class="case-hero__eyebrow reveal is-in">' + esc(b.tag || "Brand") + "</p>" +
        '<h1 class="case-hero__title reveal is-in">' + esc(b.name) + "</h1>" +
        (b.lead ? '<p class="case-hero__lead reveal is-in">' + b.lead + "</p>" : "") +
        '<div class="case-hero__actions reveal is-in"><a class="btn btn--ghost" data-cursor href="home.html#work">All brands</a></div></section>';

      /* Group the sections so we can control order:
         infographics first (as a lead-image + thumbnail viewer), then
         A+ and Storefront sitting side by side. */
      var groups = { info: [], aplus: [], store: [] };
      (b.sections || []).forEach(function (s) {
        if (s.type === "infographics") groups.info.push(s);
        else if (s.type === "aplus") groups.aplus.push(s);
        else groups.store.push(s);
      });

      var n = 0;
      function nextNo() { n += 1; return ("0" + n).slice(-2); }
      function actionsMarkup(s) {
        var a = "";
        if (s.liveUrl) a += '<a class="btn btn--primary" data-cursor target="_blank" rel="noopener" href="' + esc(s.liveUrl) + '">View live ↗</a> ';
        return a;
      }

      /* --- Infographics: big lead image (left) + description and a
             thumbnail strip (right). Thumb click swaps the lead image. --- */
      groups.info.forEach(function (s) {
        var no = nextNo();
        var imgs = s.images || [];
        var actions = actionsMarkup(s);
        html += '<section class="case-section binfo reveal is-in"><div class="binfo__grid">' +
          '<div class="binfo__stage">' +
          (imgs[0] ? '<img class="binfo__lead" src="' + esc(imgs[0]) + '" alt="' + esc(b.name) + ' infographic" />' : "") +
          "</div>" +
          '<div class="binfo__panel">' +
          '<div class="case-section__label"><span>' + no + "</span> — " + esc(s.label || "Infographics") + "</div>" +
          '<h2 class="case-h2">' + (s.heading || esc(s.label || "Infographics")) + "</h2>" +
          (s.desc ? '<p class="binfo__desc">' + esc(s.desc) + "</p>" : "") +
          (actions ? '<div class="case-hero__actions" style="margin-top:1.4rem">' + actions + "</div>" : "") +
          '<div class="binfo__strip">' + imgs.map(function (src, k) {
            return '<button class="brand-thumb binfo__thumb' + (k === 0 ? " is-active" : "") + '" type="button" data-cursor data-k="' + k + '">' +
              '<img src="' + esc(src) + '" alt="' + esc(b.name) + ' visual ' + (k + 1) + '" loading="lazy" /></button>';
          }).join("") + "</div>" +
          "</div></div></section>";
      });

      /* --- A+ and Storefront side by side --- */
      function blockMarkup(s) {
        var no = nextNo();
        var actions = actionsMarkup(s);
        return '<section class="brand-block reveal is-in">' +
          '<div class="case-section__label"><span>' + no + "</span> — " + esc(s.label || "") + "</div>" +
          '<h2 class="case-h2">' + (s.heading || esc(s.label || "")) + "</h2>" +
          (s.desc ? '<p class="brand-block__desc">' + esc(s.desc) + "</p>" : "") +
          (actions ? '<div class="case-hero__actions" style="margin-top:1.3rem">' + actions + "</div>" : "") +
          (s.image ? '<div class="case-shot__frame brand-block__shot"><img src="' + esc(s.image) + '" alt="' + esc(b.name + " " + (s.label || "")) + '" /></div>' : "") +
          "</section>";
      }
      var pair = groups.aplus.concat(groups.store);
      if (pair.length) html += '<div class="brand-pair">' + pair.map(blockMarkup).join("") + "</div>";

      root.innerHTML = html;
      initTilt(root);
      wireBrandInfographics(root);
    }).catch(function (e) { console.error(e); notFound("Couldn’t load this brand’s content."); });
  }

  /* Infographics viewer: clicking a thumbnail swaps the big lead image. */
  function wireBrandInfographics(root) {
    [].slice.call(root.querySelectorAll(".binfo")).forEach(function (sec) {
      var lead = sec.querySelector(".binfo__lead");
      var thumbs = [].slice.call(sec.querySelectorAll(".binfo__thumb"));
      thumbs.forEach(function (t) {
        t.addEventListener("click", function (e) {
          e.preventDefault();
          var im = t.querySelector("img");
          var src = im ? im.getAttribute("src") : "";
          if (lead && src) lead.setAttribute("src", src);
          thumbs.forEach(function (o) { o.classList.remove("is-active"); });
          t.classList.add("is-active");
        });
      });
    });
  }

  /* ---------- Boot: render whatever this page asks for ---------- */
  function fail(container, url) {
    if (container) {
      container.innerHTML = '<p style="color:var(--bone-dim);padding:2rem;font-size:.95rem">' +
        "Couldn’t load <code>" + esc(url) + "</code>. If you opened the file directly, run the local " +
        "server (<code>start-website.bat</code>) so the page can fetch its content.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindCopy();
    applyItemImages();
    renderDynamicCase();
    renderBrandPage();

    var bg = document.querySelector('[data-render="brands"]');
    var cols = document.querySelector('[data-render="columns"]');
    if (bg || cols) getJSON("data/brands.json")
      .then(function (d) {
        if (bg) renderBrands(bg, d.items);
        if (cols) renderColumns(cols, d.items);
      })
      .catch(function (e) { console.error(e); if (bg) fail(bg, "data/brands.json"); });

    var sf = document.querySelector('[data-render="storefronts"]');
    if (sf) getJSON("data/storefronts.json")
      .then(function (d) { renderCards(sf, d.items, "storefronts"); })
      .catch(function (e) { console.error(e); fail(sf, "data/storefronts.json"); });

    var ap = document.querySelector('[data-render="aplus"]');
    if (ap) getJSON("data/aplus.json")
      .then(function (d) { renderCards(ap, d.items, "aplus"); })
      .catch(function (e) { console.error(e); fail(ap, "data/aplus.json"); });

    if (document.getElementById("projGrid") || document.getElementById("infogFeature")) {
      getJSON("data/infographics.json")
        .then(initInfographics)
        .catch(function (e) { console.error(e); fail(document.getElementById("projGrid"), "data/infographics.json"); });
    }
  });
})();
