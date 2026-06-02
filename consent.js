/*
 * Lightweight, dependency-free cookie-consent banner (opt-in / GDPR-aligned).
 *
 * Behaviour:
 *   - No non-essential tracker runs until the visitor clicks "Accept".
 *   - Equal Accept / Reject choices; the choice is remembered in localStorage.
 *   - "Cookie settings" can be reopened via window.CookieConsent.open().
 *
 * Configure via data-attributes on the <script> tag (all optional):
 *   data-ga="G-XXXXXXX"        Google Analytics 4 — loaded only after consent
 *   data-clarity="xxxxxxxx"    Microsoft Clarity   — loaded only after consent
 *   data-privacy="/privacy.html"   link shown in the banner
 *   data-name="site_consent_v1"    localStorage key (namespace per site)
 *
 * A site with no data-ga / data-clarity simply shows the notice; Accept/Reject
 * just record the choice (nothing to load).
 */
(function () {
  var script = document.currentScript;
  var cfg = {
    ga: script && script.getAttribute("data-ga"),
    clarity: script && script.getAttribute("data-clarity"),
    privacy: (script && script.getAttribute("data-privacy")) || "",
    key: (script && script.getAttribute("data-name")) || "cookie_consent_v1",
  };

  function loadGA(id) {
    if (!id || window.__ccGAloaded) return;
    window.__ccGAloaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  function loadClarity(id) {
    if (!id || window.__ccClarityLoaded) return;
    window.__ccClarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
  }

  function loadTrackers() {
    loadGA(cfg.ga);
    loadClarity(cfg.clarity);
  }

  function injectStyles() {
    if (document.getElementById("cc-styles")) return;
    var css = "" +
      ".cc-banner{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;" +
      "background:#0e1116;color:#f4f5f7;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "box-shadow:0 -6px 24px rgba(0,0,0,.18);padding:1rem 1.1rem;" +
      "transform:translateY(110%);transition:transform .3s ease}" +
      ".cc-banner.cc-show{transform:translateY(0)}" +
      ".cc-inner{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:1rem 1.5rem;flex-wrap:wrap;justify-content:space-between}" +
      ".cc-text{font-size:.92rem;line-height:1.55;margin:0;flex:1 1 320px;color:#cfd4dc}" +
      ".cc-text a{color:#9db4ff;text-decoration:underline}" +
      ".cc-actions{display:flex;gap:.6rem;flex-wrap:wrap}" +
      ".cc-btn{font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;border-radius:8px;" +
      "padding:.6rem 1.15rem;border:1px solid transparent;line-height:1}" +
      ".cc-accept{background:#2a55ff;color:#fff}" +
      ".cc-accept:hover{background:#1b3fd1}" +
      ".cc-reject{background:transparent;color:#f4f5f7;border-color:rgba(255,255,255,.4)}" +
      ".cc-reject:hover{background:rgba(255,255,255,.12)}" +
      ".cc-btn:focus-visible{outline:2px solid #9db4ff;outline-offset:2px}" +
      "@media(max-width:560px){.cc-actions{width:100%}.cc-btn{flex:1 1 auto}}";
    var st = document.createElement("style");
    st.id = "cc-styles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function buildBanner() {
    injectStyles();
    var b = document.createElement("div");
    b.className = "cc-banner";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-live", "polite");
    b.setAttribute("aria-label", "Cookie consent");
    var privacyLink = cfg.privacy
      ? ' See our <a href="' + cfg.privacy + '">privacy policy</a>.'
      : "";
    b.innerHTML =
      '<div class="cc-inner">' +
      '<p class="cc-text">This site uses cookies for analytics to understand how it&rsquo;s used. ' +
      "Nothing runs until you choose." + privacyLink + "</p>" +
      '<div class="cc-actions">' +
      '<button class="cc-btn cc-reject" type="button">Reject</button>' +
      '<button class="cc-btn cc-accept" type="button">Accept</button>' +
      "</div></div>";
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add("cc-show"); });

    b.querySelector(".cc-accept").addEventListener("click", function () {
      try { localStorage.setItem(cfg.key, "granted"); } catch (e) {}
      loadTrackers();
      dismiss(b);
    });
    b.querySelector(".cc-reject").addEventListener("click", function () {
      try { localStorage.setItem(cfg.key, "denied"); } catch (e) {}
      dismiss(b);
    });
    return b;
  }

  function dismiss(b) {
    b.classList.remove("cc-show");
    setTimeout(function () { if (b && b.parentNode) b.parentNode.removeChild(b); }, 320);
  }

  function read() {
    try { return localStorage.getItem(cfg.key); } catch (e) { return null; }
  }

  function start() {
    var choice = read();
    if (choice === "granted") { loadTrackers(); return; }
    if (choice === "denied") { return; }
    buildBanner();
  }

  // Allow reopening the banner (e.g. a "Cookie settings" footer link).
  window.CookieConsent = {
    open: function () {
      if (!document.querySelector(".cc-banner")) buildBanner();
    },
    reset: function () {
      try { localStorage.removeItem(cfg.key); } catch (e) {}
      window.CookieConsent.open();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
