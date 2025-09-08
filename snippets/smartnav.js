(function() {
  // --- Inject Styles ---
  const style = document.createElement("style");
  style.textContent = `
    #smartNav {
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      background: rgba(30, 30, 30, 0.9);
      padding: 10px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
    }
    #smartNav a {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #444;
      text-decoration: none;
      color: #fff;
      font-size: 22px;
      transition: 0.3s;
    }
    #smartNav a:hover {
      background: #ff9800;
      transform: scale(1.1);
    }
    #smartNav a.active {
      background: #2196f3;
    }
  `;
  document.head.appendChild(style);

  // --- Create Container ---
  const nav = document.createElement("div");
  nav.id = "smartNav";
  document.body.appendChild(nav);

  // --- Icon Map ---
  const iconMap = {
    home: "fa-house",
    about: "fa-user",
    service: "fa-briefcase",
    contact: "fa-envelope",
    blog: "fa-blog",
    product: "fa-box",
    default: "fa-circle"
  };

  // --- Ensure FontAwesome is Loaded ---
  if (!document.querySelector('script[src*="fontawesome"]')) {
    const fa = document.createElement("script");
    fa.src = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/js/all.min.js";
    document.head.appendChild(fa);
  }

  // --- Build Navigation ---
  const links = document.querySelectorAll("a[href]");
  const currentURL = window.location.pathname.toLowerCase();

  links.forEach(link => {
    const url = link.getAttribute("href");
    const text = (link.textContent || "").trim().toLowerCase();

    let icon = iconMap.default;
    for (let key in iconMap) {
      if (text.includes(key) || url.includes(key)) {
        icon = iconMap[key];
        break;
      }
    }

    const navLink = document.createElement("a");
    navLink.href = url;
    navLink.innerHTML = `<i class="fa ${icon}"></i>`;

    // highlight active link
    if (currentURL.endsWith(url.toLowerCase()) || currentURL.includes(url.toLowerCase())) {
      navLink.classList.add("active");
    }

    nav.appendChild(navLink);
  });
})();
