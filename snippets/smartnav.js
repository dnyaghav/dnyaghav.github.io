// smartnav.js — Drop-in floating auto navigation for any site
// No HTML/CSS edits needed. Just include this script. Works best with <script defer src=".../smartnav.js"></script>
// Features: auto-detect top links, floating draggable nav, active highlighting, icons (Font Awesome auto-loaded),
// collapse on mobile, dedupe links, skip anchors/mailto/tel, rebuild on DOM changes.

(function () {
  const STATE_KEY = "__smartNavState_v1";
  const MAX_ITEMS = 9; // keep it tidy

  // ===== Utilities =====
  const once = (fn) => { let done = false; return (...a) => (done ? undefined : (done = true, fn(...a))); };
  const ready = (cb) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", cb, { once: true }) : cb());
  const normPath = (u) => {
    try {
      const url = new URL(u, location.href);
      let p = url.pathname.replace(/index\.html?$/i, "");
      if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
      return p || "/";
    } catch (e) { return u; }
  };
  const sameOrigin = (u) => {
    try { return new URL(u, location.href).origin === location.origin; } catch { return false; }
  };
  const isBadHref = (href) => {
    return !href || href === "#" || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href);
  };
  const labelFor = (a, urlObj) => {
    const txt = (a.getAttribute("aria-label") || a.title || a.textContent || "").trim();
    if (txt) return txt.replace(/\s+/g, " ");
    const segs = urlObj.pathname.split("/").filter(Boolean);
    return (segs[segs.length - 1] || urlObj.hostname || "Link").replace(/[-_]/g, " ");
  };

  // ===== Font Awesome (CSS) auto-loader =====
  const ensureFA = once(() => {
    const already = document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"], link[href*="all.min.css"]');
    if (already) return;
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
    fa.crossOrigin = "anonymous";
    fa.referrerPolicy = "no-referrer";
    document.head.appendChild(fa);
  });

  // ===== Icon picker =====
  const iconFor = (label, urlStr) => {
    const s = `${label} ${urlStr}`.toLowerCase();
    const pick = (cls) => `<i class="fa-solid ${cls}"></i>`;
    if (/\b(home|^\/$|index)\b/.test(s)) return pick("fa-house");
    if (/\b(about|profile|team)\b/.test(s)) return pick("fa-user");
    if (/\b(contact|support|email|mail)\b/.test(s)) return pick("fa-envelope");
    if (/\b(service|features|what-we-do)\b/.test(s)) return pick("fa-briefcase");
    if (/\b(blog|articles|news|updates)\b/.test(s)) return pick("fa-blog");
    if (/\b(doc|docs|documentation|guide|handbook|wiki)\b/.test(s)) return pick("fa-book");
    if (/\b(product|pricing|plans|packages)\b/.test(s)) return pick("fa-tags");
    if (/\b(shop|store|cart|checkout)\b/.test(s)) return pick("fa-cart-shopping");
    if (/\b(portfolio|work|projects|gallery)\b/.test(s)) return pick("fa-images");
    if (/\b(faq|questions?)\b/.test(s)) return pick("fa-circle-question");
    if (/\b(login|sign\s?in)\b/.test(s)) return pick("fa-right-to-bracket");
    if (/\b(sign\s?up|register)\b/.test(s)) return pick("fa-user-plus");
    if (/\b(dashboard|admin)\b/.test(s)) return pick("fa-gauge-high");
    if (/\b(careers?|jobs?)\b/.test(s)) return pick("fa-briefcase");
    if (/\b(privacy)\b/.test(s)) return pick("fa-user-shield");
    if (/\b(terms|legal)\b/.test(s)) return pick("fa-scale-balanced");
    if (/\b(events?|calendar)\b/.test(s)) return pick("fa-calendar-days");
    if (/\b(contact|phone|call)\b/.test(s)) return pick("fa-phone");
    return pick("fa-link");
  };

  // ===== Styles =====
  const injectStyles = once(() => {
    const css = document.createElement("style");
    css.id = "smartNavStyles";
    css.textContent = `
      #smartNav{position:fixed;top:50%;right:16px;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;padding:10px;background:rgba(24,24,27,.88);backdrop-filter:saturate(140%) blur(6px);border:1px solid rgba(255,255,255,.08);border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.35);z-index:2147483647}
      #smartNav.collapsed{padding:6px}
      #smartNav .sn-btn{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;text-decoration:none;color:#fff;background:#3b3b3f;outline:none;border:none;cursor:pointer;transition:transform .2s ease, background .2s ease;position:relative}
      #smartNav .sn-btn:hover{transform:scale(1.06);background:#6b6b70}
      #smartNav .sn-btn.active{background:#2563eb}
      #smartNav .sn-btn i{font-size:19px;line-height:1}
      #smartNav .sn-btn::after{content:attr(data-label);position:absolute;right:54px;white-space:nowrap;background:rgba(0,0,0,.85);color:#fff;font:500 12px/1.1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;padding:6px 8px;border-radius:8px;opacity:0;pointer-events:none;transform:translateX(8px);transition:all .18s ease;border:1px solid rgba(255,255,255,.08)}
      #smartNav .sn-btn:hover::after{opacity:1;transform:translateX(0)}
      #smartNav .sn-toggle{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#fff;cursor:pointer}
      #smartNav.collapsed .sn-btn[data-role="item"]{display:none}
      @media (max-width: 640px){#smartNav{right:10px}#smartNav .sn-btn{width:40px;height:40px}}
      `;
    document.head.appendChild(css);
  });

  // ===== Build / Rebuild =====
  const buildNav = () => {
    let nav = document.getElementById("smartNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "smartNav";
      nav.setAttribute("role", "navigation");
      nav.setAttribute("aria-label", "Smart Navigation");
      document.body.appendChild(nav);
      makeDraggable(nav);
    }
    nav.innerHTML = ""; // reset

    // Toggle button
    const toggle = document.createElement("button");
    toggle.className = "sn-btn sn-toggle";
    toggle.setAttribute("aria-label", "Toggle navigation");
    toggle.innerHTML = "<i class=\"fa-solid fa-grip-vertical\"></i>";
    toggle.addEventListener("click", () => {
      nav.classList.toggle("collapsed");
      persistState();
    });
    nav.appendChild(toggle);

    // collect candidate links
    const all = Array.from(document.querySelectorAll("a[href]"));
    const current = normPath(location.href);

    const scored = [];
    for (const a of all) {
      const href = a.getAttribute("href");
      if (isBadHref(href)) continue;
      const u = new URL(href, location.href);
      // Prefer same-origin site structure; allow external but with lower score
      const baseScore = sameOrigin(u.href) ? 5 : 1;
      // Skip same-page hash links
      if (u.hash && normPath(u.href) === current) continue;

      // Heuristics based on DOM context
      let score = baseScore;
      const elClasses = `${a.className} ${a.parentElement ? a.parentElement.className : ""}`.toLowerCase();
      if (a.closest("nav")) score += 6;
      if (a.closest("header")) score += 3;
      if (a.closest("footer")) score += 1; // footer links are okay but weaker
      if (/(nav|menu|tabs|pill|breadcrumb)/.test(elClasses)) score += 2;
      if (/(btn|button|cta)/.test(elClasses)) score -= 2; // CTAs likely not nav

      // Penalize deep or very long text links
      const depth = u.pathname.split("/").filter(Boolean).length; if (depth <= 2) score += 2; else if (depth >= 4) score -= 2;
      const textLen = (a.textContent || "").trim().length; if (textLen > 30) score -= 2;

      scored.push({ a, u, score });
    }

    // sort and dedupe by normalized path (and host for externals)
    scored.sort((x, y) => y.score - x.score);
    const seen = new Set();
    const picked = [];
    for (const item of scored) {
      const key = (sameOrigin(item.u.href) ? normPath(item.u.href) : `ext:${item.u.host}${normPath(item.u.href)}`);
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(item);
      if (picked.length >= MAX_ITEMS) break;
    }

    // build items
    const currentNorm = normPath(location.href);
    for (const { a, u } of picked) {
      const label = labelFor(a, u);
      const btn = document.createElement("a");
      btn.className = "sn-btn";
      btn.setAttribute("data-role", "item");
      btn.href = u.href;
      btn.setAttribute("data-label", label);
      btn.setAttribute("aria-label", label);
      btn.innerHTML = iconFor(label, u.href);
      if (normPath(u.href) === currentNorm) btn.classList.add("active");
      nav.appendChild(btn);
    }

    // restore state
    const saved = loadState();
    if (saved && saved.collapsed) nav.classList.add("collapsed");
  };

  // ===== Drag to reposition (vertical) and persist =====
  function makeDraggable(el) {
    let dragging = false; let startY = 0; let startTop = 0;
    const onDown = (ev) => {
      dragging = true;
      startY = (ev.touches ? ev.touches[0].clientY : ev.clientY);
      const rect = el.getBoundingClientRect();
      startTop = rect.top + window.scrollY;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("mouseup", onUp, { once: true });
      document.addEventListener("touchend", onUp, { once: true });
    };
    const onMove = (ev) => {
      if (!dragging) return;
      const y = (ev.touches ? ev.touches[0].clientY : ev.clientY);
      const newTop = Math.max(10, Math.min(window.innerHeight - 10, startTop + (y - startY)));
      el.style.top = `${newTop}px`;
      el.style.transform = "translateY(0)"; // switch to absolute top
      persistState();
      ev.preventDefault();
    };
    const onUp = () => {
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
    };
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
  }

  function persistState() {
    const nav = document.getElementById("smartNav");
    if (!nav) return;
    const st = loadState() || {};
    st.collapsed = nav.classList.contains("collapsed");
    // Persist top if transform removed
    const rect = nav.getBoundingClientRect();
    const usingTranslate = getComputedStyle(nav).transform !== "none" && nav.style.transform.includes("translateY(-50%)");
    if (!usingTranslate) st.top = rect.top + window.scrollY;
    localStorage.setItem(STATE_KEY, JSON.stringify(st));
  }
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch { return null; }
  }
  function restorePosition() {
    const st = loadState();
    const nav = document.getElementById("smartNav");
    if (!st || !nav) return;
    if (typeof st.top === "number") {
      nav.style.top = `${st.top}px`;
      nav.style.transform = "translateY(0)";
    }
    if (st.collapsed) nav.classList.add("collapsed");
  }

  // ===== Observe DOM changes to keep up with SPAs or late content =====
  let rebuildTimer = null;
  const scheduleRebuild = () => { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(buildNav, 300); };
  const startObserver = () => {
    const mo = new MutationObserver(scheduleRebuild);
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: false });
  };

  // ===== Init =====
  ready(() => {
    ensureFA();
    injectStyles();
    buildNav();
    restorePosition();
    startObserver();

    // Rebuild on history navigation for SPAs
    ["pushState", "replaceState"].forEach((m) => {
      const orig = history[m];
      history[m] = function () { const r = orig.apply(this, arguments); setTimeout(buildNav, 50); return r; };
    });
    window.addEventListener("popstate", () => setTimeout(buildNav, 50));
  });
})();
