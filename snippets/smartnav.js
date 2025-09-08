<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/js/all.min.js"></script>
<script>
(function() {
  // create nav container
  const nav = document.createElement("div");
  nav.id = "smartNav";
  document.body.appendChild(nav);

  // style (injected so no CSS needed)
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
  `;
  document.head.appendChild(style);

  // icon mapping
  const iconMap = {
    home: "fa-house",
    about: "fa-user",
    service: "fa-briefcase",
    contact: "fa-envelope",
    blog: "fa-blog",
    product: "fa-box",
    default: "fa-circle"
  };

  // collect links
  const links = document.querySelectorAll("a[href]");
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
    nav.appendChild(navLink);
  });
})();
</script>
