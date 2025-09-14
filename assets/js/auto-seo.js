/**
 * auto-seo.js
 * Auto-generate meta tags, Open Graph, Twitter tags and JSON-LD keywords from page content.
 *
 * Drop into your site's /assets/js/ and add <script src="/assets/js/auto-seo.js" defer></script>
 *
 * Limits: lightweight heuristic (no ML). Good for automating tags, but server-side generation remains best.
 */

(function () {
  if (window.__AUTO_SEO_DONE__) return;
  window.__AUTO_SEO_DONE__ = true;

  // Config
  const SITE_NAME = "Dnyaghav Tools";             // site name to append to titles
  const MAX_KEYWORDS = 7;                         // number of keyword phrases to keep
  const MAX_TITLE_LEN = 60;                       // suggested title char limit
  const MAX_DESC_LEN = 155;                       // suggested description char limit
  const MIN_WORD_LEN = 3;                         // minimal token length to consider
  const IGNORED_SELECTORS = ['nav', 'header', 'footer', '.no-seo']; // exclude common chrome content

  // Simple stopwords list (extend if you like)
  const STOPWORDS = new Set([
    "the","and","for","that","with","this","from","have","will","your","you","are","but","not",
    "our","their","they","page","site","tools","https","http","com","org","net","edu","amp","index",
    "here","there","what","when","where","which","was","were","been","its","use","using","used",
    "one","two","three","four","five","all","any","more","also","can","may","like","about","into","over",
    "who","whom","why","how","so","if","on","in","at","by","of","to","as","is","be","it","a","an"
  ]);

  // Utilities
  function textFromNode() {
    // prefer main/article if present
    const prefer = document.querySelector("main, article, #main, #content");
    const root = prefer || document.body || document.documentElement;
    // remove ignored elements clone to avoid mutating DOM
    const c = root.cloneNode(true);
    IGNORED_SELECTORS.forEach(sel => {
      c.querySelectorAll(sel).forEach(n => n.remove());
    });
    // remove script, style, noscript
    c.querySelectorAll('script,style,noscript,iframe').forEach(n => n.remove());
    // get visible text
    const txt = c.innerText || c.textContent || "";
    return txt.replace(/\s+/g, " ").trim();
  }

  function splitWords(text) {
    // basic tokenization: words and simple n-grams (1..3)
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
    const tokens = cleaned.split(/\s+/).filter(t => t.length >= MIN_WORD_LEN && !STOPWORDS.has(t));
    return tokens;
  }

  function ngrams(tokens, n) {
    const res = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      res.push(tokens.slice(i, i + n).join(" "));
    }
    return res;
  }

  function phraseScores(text) {
    const tokens = splitWords(text);
    const score = new Map();

    // give more weight to 2- and 3-grams and to tokens occurring in headings
    // count unigrams
    tokens.forEach(t => score.set(t, (score.get(t) || 0) + 1));

    // bi- and tri-grams
    [2, 3].forEach(n => {
      ngrams(tokens, n).forEach(ng => score.set(ng, (score.get(ng) || 0) + 2)); // weight 2
    });

    // boost phrases appearing in headings (h1-h3)
    document.querySelectorAll("h1,h2,h3").forEach(h => {
      const htxt = (h.innerText || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
      splitWords(htxt).forEach(t => score.set(t, (score.get(t) || 0) + 3));
      ngrams(splitWords(htxt), 2).forEach(ng => score.set(ng, (score.get(ng) || 0) + 4));
    });

    // convert to array and sort by score then length (prefer longer phrases when possible)
    const arr = Array.from(score.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    });

    // filter out phrases that are substrings of higher phrases (to avoid duplicates)
    const chosen = [];
    for (const [phrase, s] of arr) {
      if (chosen.length >= MAX_KEYWORDS) break;
      // avoid phrases with short words only or numeric-only
      if (/^\d+$/.test(phrase)) continue;
      if (phrase.split(" ").every(w => w.length < MIN_WORD_LEN)) continue;
      // avoid stopword-only phrases
      const parts = phrase.split(" ");
      if (parts.some(p => STOPWORDS.has(p))) {
        // allow a phrase if it has 2+ non-stopwords
        const nonStop = parts.filter(p => !STOPWORDS.has(p));
        if (nonStop.length === 0) continue;
      }
      // avoid substrings already covered
      if (chosen.some(ch => ch.includes(phrase) || phrase.includes(ch))) continue;
      chosen.push(phrase);
    }

    return chosen;
  }

  // create best title from h1 or first heading or first sentence
  function deriveTitle(text) {
    const h1 = document.querySelector("h1");
    if (h1 && h1.innerText.trim()) {
      let t = h1.innerText.trim();
      if (t.length > MAX_TITLE_LEN) t = t.slice(0, MAX_TITLE_LEN - 3).trim() + "...";
      return `${t} | ${SITE_NAME}`;
    }
    // fallback: first sentence from content
    const firstSent = (text.split(/[.?!]\s/)[0] || "").trim();
    if (firstSent) {
      let t = firstSent.slice(0, MAX_TITLE_LEN - 3).trim();
      if (t.length < 10) t = firstSent.slice(0, 45).trim();
      return `${t} | ${SITE_NAME}`;
    }
    return SITE_NAME;
  }

  // derive meta description (first meaningful paragraph or 155 chars)
  function deriveDescription(text) {
    // prefer first paragraph-like chunk (split by double newline)
    const parts = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 30);
    let desc = parts.length ? parts[0] : (text.slice(0, MAX_DESC_LEN));
    desc = desc.replace(/\s+/g, " ").trim();
    if (desc.length > MAX_DESC_LEN) desc = desc.slice(0, MAX_DESC_LEN - 3).trim() + "...";
    return desc;
  }

  // inject meta tags safely (replace if exist)
  function upsertMeta(attrName, attrValue, content) {
    // attrName: "name" or "property"
    // attrValue: attribute value e.g., "description" or "og:title"
    let sel = `meta[${attrName}="${attrValue}"]`;
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLinkRel(rel, href) {
    let sel = `link[rel="${rel}"]`;
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function upsertTitle(t) {
    if (document.title !== t) document.title = t;
    // also ensure <meta property="og:title"> updated later
  }

  function upsertJsonLd(obj) {
    const id = "auto-seo-jsonld";
    let script = document.head.querySelector(`#${id}`);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(obj, null, 2);
  }

  // Main execution
  try {
    const text = textFromNode();
    if (!text || text.length < 30) {
      // insufficient content: abort to avoid noisy tags
      return;
    }

    const keywords = phraseScores(text); // array of phrases
    const title = deriveTitle(text);
    const description = deriveDescription(text);
    const canonical = window.location.href.split('#')[0].split('?')[0];

    // Update Title
    upsertTitle(title);

    // Basic meta
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index, follow");
    // keywords meta still used by some small engines - keep limited & clean
    if (keywords.length) upsertMeta("name", "keywords", keywords.join(", "));

    // Canonical
    upsertLinkRel("canonical", canonical);

    // Open Graph
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    // try to infer an image: look for og:image or a large image on page
    let ogImage = null;
    const existingOg = document.head.querySelector('meta[property="og:image"]');
    if (existingOg) ogImage = existingOg.getAttribute("content");
    if (!ogImage) {
      // choose largest visible image in content (heuristic)
      const imgs = Array.from(document.images || []).filter(i => {
        // visible and reasonably sized
        return i.naturalWidth >= 200 && i.naturalHeight >= 200;
      });
      if (imgs.length) {
        // pick the largest by area
        imgs.sort((a, b) => (b.naturalWidth*b.naturalHeight) - (a.naturalWidth*a.naturalHeight));
        ogImage = imgs[0].src;
      }
    }
    if (ogImage) upsertMeta("property", "og:image", ogImage);

    // Twitter Card
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (ogImage) upsertMeta("name", "twitter:image", ogImage);

    // JSON-LD Article schema (basic)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "url": canonical,
      "publisher": {
        "@type": "Organization",
        "name": SITE_NAME
      }
    };
    if (keywords.length) jsonLd.keywords = keywords.join(", ");
    if (ogImage) jsonLd.image = [ogImage];
    upsertJsonLd(jsonLd);

    // small console feedback (only visible to you)
    if (window.location.protocol.startsWith("http")) {
      console.info("auto-seo: injected tags:", { title, description, keywords });
    }
  } catch (err) {
    console.warn("auto-seo: error", err && err.message);
  }
})();
