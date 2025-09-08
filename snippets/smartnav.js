// smartnav.js — Bootstrap 5 breadcrumb navigation from URL
(function () {
  function buildBreadcrumb() {
    const path = window.location.pathname
      .replace(/\/index\.html?$/, "") // remove index.html
      .replace(/^\/+|\/+$/g, ""); // trim slashes

    if (!path) return; // hide on homepage

    const parts = path.split("/");
    const breadcrumb = document.createElement("nav");
    breadcrumb.setAttribute("aria-label", "breadcrumb");
    breadcrumb.className = "fixed-bottom bg-light border-top";

    const ol = document.createElement("ol");
    ol.className = "breadcrumb m-2";

    // Home link
    const liHome = document.createElement("li");
    liHome.className = "breadcrumb-item";
    liHome.innerHTML = `<a href="/">Home</a>`;
    ol.appendChild(liHome);

    // Other parts
    let cumulative = "";
    parts.forEach((part, i) => {
      cumulative += "/" + part;
      const li = document.createElement("li");
      li.className = "breadcrumb-item";

      const label = part.charAt(0).toUpperCase() + part.slice(1);

      if (i === parts.length - 1) {
        li.classList.add("active");
        li.setAttribute("aria-current", "page");
        li.textContent = label;
      } else {
        li.innerHTML = `<a href="${cumulative}/">${label}</a>`;
      }
      ol.appendChild(li);
    });

    breadcrumb.appendChild(ol);
    document.body.appendChild(breadcrumb);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildBreadcrumb, { once: true });
  } else {
    buildBreadcrumb();
  }
})();
