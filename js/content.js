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
    storefronts: "data/storefronts.json", aplus: "data/aplus.json", infographics: "data/infographics.json"
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
  function cardMarkup(it) {
    var linked = !!it.page;
    var el = linked ? "a" : "article";
    var cls = "card is-in" + (it.featured ? " card--feature" : "") + (linked ? " card--linked" : "");
    var attrs = ' class="' + cls + '" data-cursor data-tilt="4"';
    if (linked) attrs += ' href="' + esc(it.page) + '"';
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

  function renderCards(container, items) {
    container.innerHTML = (items || []).map(cardMarkup).join("");
    container.querySelectorAll(".card[data-image]").forEach(function (card) {
      loadCover(card.querySelector(".card__art"), card.dataset.image, card);
    });
    initTilt(container);
  }

  /* ---------- Infographics: proj tiles + lightbox ---------- */
  function projMarkup(b, i) {
    var no = ("0" + (i + 1)).slice(-2);
    var n = (b.images || []).length;
    var first = (b.images && b.images[0]) || "";
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
      feature.innerHTML = cardMarkup(f);
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

    var sf = document.querySelector('[data-render="storefronts"]');
    if (sf) getJSON("data/storefronts.json")
      .then(function (d) { renderCards(sf, d.items); })
      .catch(function (e) { console.error(e); fail(sf, "data/storefronts.json"); });

    var ap = document.querySelector('[data-render="aplus"]');
    if (ap) getJSON("data/aplus.json")
      .then(function (d) { renderCards(ap, d.items); })
      .catch(function (e) { console.error(e); fail(ap, "data/aplus.json"); });

    if (document.getElementById("projGrid") || document.getElementById("infogFeature")) {
      getJSON("data/infographics.json")
        .then(initInfographics)
        .catch(function (e) { console.error(e); fail(document.getElementById("projGrid"), "data/infographics.json"); });
    }
  });
})();
