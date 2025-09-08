// smartnav.js — Bootstrap 5 bottom navigation (auto from page links)
(function () {
  const MAX_ITEMS = 6; // how many links to show

  function norm(u) {
    try {
      const url = new URL(u, location.href);
      return url.pathname.replace(/index\\.html?$/i, "") || "/";
    } catch {
      return u;
    }
  }

  function build() {
    const current = norm(location.href);

    // collect unique links
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ el: a, href: a.getAttribute("href") }))
      .filter(({ href }) => href && !href.startsWith("#") && !/^mailto:|tel:/i.test(href));

    const seen = new Set();
    const items = [];
    for (const { el, href } of links) {
      const u = new URL(href, location.href);
      const p = norm(u.href);
      if (seen.has(p)) continue;
      seen.add(p);

      const text = (el.textContent || "").trim() || p;
      items.push({ href: u.href, path: p, text });
      if (items.length >= MAX_ITEMS) break;
    }

    // build Bootstrap nav
    const nav = document.createElement("nav");
    nav.className = "navbar navbar-expand bg-dark navbar-dark fixed-bottom";
    nav.innerHTML = `
      <div class="container-fluid justify-content-center">
        <ul class="navbar-nav gap-3" id="smartNavList"></ul>
      </div>
    `;

    const ul = nav.querySelector("#smartNavList");

    for (const item of items) {
      const li = document.createElement("li");
      li.className = "nav-item";

      const a = document.createElement("a");
      a.className = "nav-link";
      if (item.path === current) a.classList.add("active");
      a.href = item.href;
      a.textContent = item.text;

      li.appendChild(a);
      ul.appendChild(li);
    }

    document.body.appendChild(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();
