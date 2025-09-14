(function () {
  if (window.__AUTO_SEO_DONE__) return;
  window.__AUTO_SEO_DONE__ = true;

  const SITE_NAME = "Dnyaghav Tools";
  const MAX_KEYWORDS = 12, MAX_TITLE_LEN = 70, MAX_DESC_LEN = 160, MIN_WORD_LEN = 3;
  const IGNORED_SELECTORS = ['nav', 'header', 'footer', '.no-seo'];

  const STOPWORDS = new Set([
    "the","and","for","that","with","this","from","have","will","your","you","are","but","not",
    "our","their","they","page","site","tools","https","http","com","org","net","edu","amp","index",
    "here","there","what","when","where","which","was","were","been","its","use","using","used",
    "one","two","three","four","five","all","any","more","also","can","may","like","about","into","over",
    "who","whom","why","how","so","if","on","in","at","by","of","to","as","is","be","it","a","an"
  ]);

  // Updated list of target keywords for SEO
  const TARGET_KEYWORDS = [
    "dny", "aghav", "dnyaghav", "Aghav", "Mr. Aghav", "@dnyaghav", "Dnyaneshwar", "Dnyaghav Tools",
    "dhamdham", "jintur", "parbhani", "maharashtra"
  ];

  function textFromNode() {
    const prefer = document.querySelector("main, article, #main, #content");
    const root = prefer || document.body || document.documentElement;
    const c = root.cloneNode(true);
    IGNORED_SELECTORS.forEach(sel => c.querySelectorAll(sel).forEach(n => n.remove()));
    c.querySelectorAll('script,style,noscript,iframe').forEach(n => n.remove());
    return (c.innerText || "").replace(/\s+/g, " ").trim();
  }

  function splitWords(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/).filter(t => t.length >= MIN_WORD_LEN && !STOPWORDS.has(t));
  }

  function ngrams(tokens, n) {
    return Array.from({length: tokens.length - n + 1}, (_, i) => tokens.slice(i, i + n).join(" "));
  }

  // Updated function to prioritize target keywords (including new ones)
  function phraseScores(text) {
    const tokens = splitWords(text), score = new Map();
    tokens.forEach(t => score.set(t, (score.get(t) || 0) + 1));
    
    // Add priority for target keywords like dny, aghav, dnyaghav, etc.
    TARGET_KEYWORDS.forEach(keyword => {
      if (tokens.includes(keyword.toLowerCase())) {
        score.set(keyword.toLowerCase(), (score.get(keyword.toLowerCase()) || 0) + 5);
      }
    });

    [2, 3].forEach(n => ngrams(tokens, n).forEach(ng => score.set(ng, (score.get(ng) || 0) + 2)));
    document.querySelectorAll("h1,h2,h3").forEach(h => {
      const t = (h.innerText || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
      splitWords(t).forEach(w => score.set(w, (score.get(w) || 0) + 3));
      ngrams(splitWords(t), 2).forEach(ng => score.set(ng, (score.get(ng) || 0) + 4));
    });

    return Array.from(score.entries()).sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length)
      .map(([p])=>p).filter(p=>!(/^\d+$/.test(p)) && p.split(" ").some(w=>!STOPWORDS.has(w)))
      .slice(0, MAX_KEYWORDS);
  }

  function deriveTitle(text) {
    const h1 = document.querySelector("h1");
    if (h1?.innerText.trim()) {
      let t = h1.innerText.trim();
      if (t.length > MAX_TITLE_LEN) t = t.slice(0, MAX_TITLE_LEN - 3) + "...";
      return `${t} | ${SITE_NAME}`;
    }
    const firstSent = (text.split(/[.?!]\s/)[0] || "").trim();
    return firstSent ? `${firstSent.slice(0, MAX_TITLE_LEN - 3)}... | ${SITE_NAME}` : SITE_NAME;
  }

  function deriveDescription(text) {
    let desc = text.split(/\n{2,}/).find(p => p.trim().length > 30) || text.slice(0, MAX_DESC_LEN);
    desc = desc.replace(/\s+/g, " ").trim();
    return desc.length > MAX_DESC_LEN ? desc.slice(0, MAX_DESC_LEN - 3) + "..." : desc;
  }

  function upsertMeta(attrName, attrValue, content) {
    let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attrName, attrValue); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }
  function upsertLinkRel(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
    el.setAttribute("href", href);
  }
  function upsertTitle(t) { if (document.title !== t) document.title = t; }
  function upsertJsonLd(obj) {
    let script = document.head.querySelector("#auto-seo-jsonld");
    if (!script) { script = document.createElement("script"); script.id = "auto-seo-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(obj, null, 2);
  }

  try {
    const text = textFromNode();
    if (!text || text.length < 30) return;

    const keywords = phraseScores(text);
    const title = deriveTitle(text);
    const description = deriveDescription(text);
    const canonical = window.location.href.split('#')[0].split('?')[0];

    upsertTitle(title);
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index, follow");
    if (keywords.length) upsertMeta("name", "keywords", keywords.join(", "));
    upsertLinkRel("canonical", canonical);

    // Find image → check <img> first
    let ogImage = null;
    const imgs = Array.from(document.images).filter(i => i.naturalWidth >= 200 && i.naturalHeight >= 200);
    if (imgs.length) {
      imgs.sort((a, b) => (b.naturalWidth*b.naturalHeight) - (a.naturalWidth*a.naturalHeight));
      ogImage = imgs[0].src;
    }

    // If no <img>, check background images
    if (!ogImage) {
      const bgUrls = [];
      Array.from(document.querySelectorAll("*")).forEach(el => {
        const bg = window.getComputedStyle(el).getPropertyValue("background-image");
        if (bg && bg !== "none") {
          let url = bg.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
          if (url.startsWith("http")) bgUrls.push(url);
        }
      });
      if (bgUrls.length) ogImage = bgUrls[0];
    }

    // Open Graph
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    if (ogImage) upsertMeta("property", "og:image", ogImage);

    // Twitter Card
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (ogImage) upsertMeta("name", "twitter:image", ogImage);

    // JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "url": canonical,
      "publisher": { "@type": "Organization", "name": SITE_NAME }
    };
   
 if (keywords.length) jsonLd.keywords = keywords.join(", ");
    if (ogImage) jsonLd.image = [ogImage];
    upsertJsonLd(jsonLd);

        console.info("auto-seo completed with keywords:", keywords.join(", "), "and updated metadata.");
  } catch (e) {
    console.error("Error in auto SEO script:", e);
  }
})();