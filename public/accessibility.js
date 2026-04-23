// accessibility.js
// High contrast toggle, EN/ES language switcher.
// Customer-interface pages also get: text size slider, draggable magnifier, wait time.
// Must be loaded after translations.js on every static page.

// apply saved preferences immediately to avoid a flash on load
(function () {
  if (localStorage.getItem("highContrast") === "true") {
    document.documentElement.setAttribute("data-theme", "high-contrast");
  }
  const lang = localStorage.getItem("lang") || "en";
  document.documentElement.setAttribute("lang", lang);

  // apply saved font size immediately so there is no flash between pages
  const savedSize = parseFloat(localStorage.getItem("kioskFontSize"));
  if (savedSize) {
    document.documentElement.style.fontSize = (savedSize * 16) + "px";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  injectToolbar();
  applyTranslations();

  // customer-only features — only run on customer-interface pages
  if (window.location.pathname.includes("customer-interface")) {
    injectTextSizeSlider();
    injectMagnifier();
    loadWaitTime();
  }
});

// ============================================================
// toolbar — shared across all static pages
// ============================================================

function injectToolbar() {
  const isHighContrast = localStorage.getItem("highContrast") === "true";
  const lang = localStorage.getItem("lang") || "en";

  const toolbar = document.createElement("div");
  toolbar.className = "a11y-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Accessibility options");

  toolbar.innerHTML = `
    <button class="a11y-btn" id="contrast-toggle" type="button"
      aria-pressed="${isHighContrast}"
      aria-label="Toggle high contrast mode">
      ${isHighContrast ? "⬛ High Contrast On" : "🔲 High Contrast"}
    </button>
    <div class="lang-toggle" role="group" aria-label="Language selection">
      <button class="a11y-btn lang-btn ${lang === "en" ? "lang-active" : ""}" id="lang-en"
        type="button" aria-pressed="${lang === "en"}" aria-label="Switch to English">EN</button>
      <span class="lang-divider" aria-hidden="true">|</span>
      <button class="a11y-btn lang-btn ${lang === "es" ? "lang-active" : ""}" id="lang-es"
        type="button" aria-pressed="${lang === "es"}" aria-label="Cambiar a español">ES</button>
    </div>
  `;

  document.body.insertBefore(toolbar, document.body.firstChild);

  document.getElementById("contrast-toggle").addEventListener("click", toggleContrast);
  document.getElementById("lang-en").addEventListener("click", () => setLang("en"));
  document.getElementById("lang-es").addEventListener("click", () => setLang("es"));

  injectToolbarStyles();
}

function toggleContrast() {
  const next = localStorage.getItem("highContrast") !== "true";
  localStorage.setItem("highContrast", next);
  document.documentElement.setAttribute("data-theme", next ? "high-contrast" : "");

  const btn = document.getElementById("contrast-toggle");
  btn.setAttribute("aria-pressed", next);
  btn.textContent = next ? "⬛ High Contrast On" : "🔲 High Contrast";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  document.documentElement.setAttribute("lang", lang);

  document.getElementById("lang-en").setAttribute("aria-pressed", lang === "en");
  document.getElementById("lang-es").setAttribute("aria-pressed", lang === "es");
  document.getElementById("lang-en").classList.toggle("lang-active", lang === "en");
  document.getElementById("lang-es").classList.toggle("lang-active", lang === "es");

  applyTranslations();
}

function injectToolbarStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .a11y-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #1e1410;
      color: #fff;
      font-size: 0.85rem;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .a11y-btn {
      background: transparent;
      color: #fff;
      border: 1px solid #6b5040;
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.85rem;
      font-family: inherit;
    }
    .a11y-btn:hover {
      border-color: #ec6f4f;
      color: #ec6f4f;
    }
    .a11y-btn:focus-visible {
      outline: 2px solid #ec6f4f;
      outline-offset: 2px;
    }
    .lang-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lang-divider { color: #6b5040; }
    .lang-active {
      background: #ec6f4f;
      color: #fff;
      border-color: #ec6f4f;
      font-weight: 700;
    }
    .a11y-text-size {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ccc;
      font-size: 0.82rem;
    }
    .a11y-text-size label {
      white-space: nowrap;
      font-weight: 600;
      cursor: default;
      color: #ccc;
    }
    .a11y-text-size input[type="range"] {
      width: 72px;
      cursor: pointer;
      accent-color: #ec6f4f;
      vertical-align: middle;
    }
    .a11y-size-icon {
      color: #ec6f4f;
      font-weight: 800;
    }
    [data-theme="high-contrast"] .a11y-toolbar {
      background: #000;
      border-bottom: 2px solid #fff;
    }
    [data-theme="high-contrast"] .a11y-btn {
      border-color: #fff;
      color: #fff;
    }
    [data-theme="high-contrast"] .lang-active {
      background: #ff0;
      color: #000;
      border-color: #ff0;
    }
    [data-theme="high-contrast"] .a11y-text-size input[type="range"] {
      accent-color: #ff0;
    }

    /* magnifier lens */
    #kiosk-magnifier-lens {
      position: fixed;
      border-radius: 50%;
      border: 3px solid #ec6f4f;
      box-shadow: 0 8px 28px rgba(0,0,0,0.4);
      overflow: hidden;
      z-index: 9999;
      display: none;
      cursor: grab;
      pointer-events: auto;
    }
    #kiosk-magnifier-lens.active {
      display: block;
    }
    #kiosk-magnifier-lens:active {
      cursor: grabbing;
    }
    /* the live zoom layer inside the lens */
    #kiosk-magnifier-inner {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      transform-origin: 0 0;
    }
    [data-theme="high-contrast"] #kiosk-magnifier-lens {
      border-color: #ff0;
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// text size slider — customer pages only
// persists via localStorage so size carries across all pages
// uses px not rem to avoid circular reference on root element
// ============================================================

function injectTextSizeSlider() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar) return;

  const saved = parseFloat(localStorage.getItem("kioskFontSize")) || 1;

  const wrapper = document.createElement("div");
  wrapper.className = "a11y-text-size";
  wrapper.innerHTML = `
    <label for="text-size-slider">A</label>
    <input
      id="text-size-slider"
      type="range"
      min="0.85"
      max="1.5"
      step="0.05"
      value="${saved}"
      aria-label="Adjust text size — slide right to increase"
    />
    <span class="a11y-size-icon" aria-hidden="true">A</span>
  `;

  toolbar.appendChild(wrapper);

  wrapper.querySelector("input").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    applyFontSize(val);
    localStorage.setItem("kioskFontSize", val);
  });
}

function applyFontSize(scale) {
  // use px not rem — setting rem on root is circular
  document.documentElement.style.fontSize = (scale * 16) + "px";
}

// ============================================================
// magnifier — customer pages only
// draggable circular lens using a live CSS transform of the page
// no external library needed — works by scaling a cloned fixed
// overlay of the actual DOM inside the clipped lens circle
// ============================================================

function injectMagnifier() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar) return;

  const LENS_SIZE = 220;
  const ZOOM = 2.5;

  // toggle button
  const btn = document.createElement("button");
  btn.className = "a11y-btn";
  btn.id = "magnifier-toggle";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Toggle screen magnifier");
  btn.textContent = "🔍 Magnifier";
  toolbar.appendChild(btn);

  // the circular lens container
  const lens = document.createElement("div");
  lens.id = "kiosk-magnifier-lens";
  lens.setAttribute("aria-hidden", "true");
  lens.style.width = LENS_SIZE + "px";
  lens.style.height = LENS_SIZE + "px";
  lens.style.top = "140px";
  lens.style.left = "140px";

  // the inner div that holds the scaled page snapshot
  // we use an <iframe> pointing to the same URL to get a live render
  // that is independent of the main page and can be scaled freely
  const iframe = document.createElement("iframe");
  iframe.id = "kiosk-magnifier-inner";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    border: none;
    pointer-events: none;
    transform-origin: 0 0;
    background: transparent;
  `;

  lens.appendChild(iframe);
  document.body.appendChild(lens);

  let active = false;
  let lensX = 140;
  let lensY = 140;
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let iframeReady = false;

  function initIframe() {
    if (iframeReady) return;
    // point iframe at the current page
    iframe.src = window.location.href;
    iframe.style.width = window.innerWidth + "px";
    iframe.style.height = window.innerHeight + "px";
    iframe.style.transform = `scale(${ZOOM})`;
    iframe.onload = () => {
      iframeReady = true;
      // hide the iframe's own toolbar and magnifier to avoid recursion
      try {
        const iDoc = iframe.contentDocument;
        if (iDoc) {
          const style = iDoc.createElement("style");
          style.textContent = ".a11y-toolbar, #kiosk-magnifier-lens { display: none !important; }";
          iDoc.head.appendChild(style);
        }
      } catch (_) {}
      updateIframeOffset();
    };
  }

  function updateIframeOffset() {
    // we want the area under the lens center to appear centered in the lens
    // lens center in page coords:
    const cx = lensX + LENS_SIZE / 2;
    const cy = lensY + LENS_SIZE / 2;

    // after scaling by ZOOM from origin 0,0:
    // a point (px, py) maps to (px*ZOOM, py*ZOOM)
    // we want (cx, cy) on the page to appear at (LENS_SIZE/2, LENS_SIZE/2) in the lens
    // so: offsetX = LENS_SIZE/2 - cx*ZOOM
    //     offsetY = LENS_SIZE/2 - cy*ZOOM
    const offsetX = LENS_SIZE / 2 - cx * ZOOM;
    const offsetY = LENS_SIZE / 2 - cy * ZOOM;

    iframe.style.transform = `scale(${ZOOM})`;
    iframe.style.transformOrigin = "0 0";
    iframe.style.left = (offsetX / ZOOM) + "px";
    iframe.style.top = (offsetY / ZOOM) + "px";

    // sync iframe scroll to match main page scroll
    try {
      iframe.contentWindow.scrollTo(window.scrollX, window.scrollY);
    } catch (_) {}
  }

  btn.addEventListener("click", () => {
    active = !active;
    btn.setAttribute("aria-pressed", active);
    btn.textContent = active ? "🔍 On" : "🔍 Magnifier";
    lens.classList.toggle("active", active);
    if (active) {
      initIframe();
      updateIframeOffset();
    }
  });

  // mouse drag
  lens.addEventListener("mousedown", (e) => {
    dragging = true;
    dragOffsetX = e.clientX - lensX;
    dragOffsetY = e.clientY - lensY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!active || !dragging) return;
    moveLens(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  // touch drag for kiosk touchscreens
  lens.addEventListener("touchstart", (e) => {
    dragging = true;
    const t = e.touches[0];
    dragOffsetX = t.clientX - lensX;
    dragOffsetY = t.clientY - lensY;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchmove", (e) => {
    if (!active || !dragging) return;
    const t = e.touches[0];
    moveLens(t.clientX - dragOffsetX, t.clientY - dragOffsetY);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => { dragging = false; });

  // keep iframe scroll synced when main page scrolls
  window.addEventListener("scroll", () => {
    if (!active) return;
    updateIframeOffset();
  }, { passive: true });

  function moveLens(x, y) {
    lensX = Math.max(0, Math.min(window.innerWidth - LENS_SIZE, x));
    lensY = Math.max(0, Math.min(window.innerHeight - LENS_SIZE, y));
    lens.style.left = lensX + "px";
    lens.style.top = lensY + "px";
    updateIframeOffset();
  }
}

// ============================================================
// estimated wait time — customer pages only
// fetches orders_today from /api/xreport
// wait = (orders per last ~30 min) * avg prep time per order
// refreshes every 60 seconds
// ============================================================

const AVG_MINUTES_PER_ORDER = 3;
const BUSINESS_OPEN_HOUR = 9;

async function loadWaitTime() {
  const waitEl = document.getElementById("wait-time-text");
  if (!waitEl) return;

  async function fetchAndUpdate() {
    try {
      const res = await fetch("/api/xreport");
      if (!res.ok) throw new Error();
      const data = await res.json();

      const ordersToday = parseInt(data.orders_today) || 0;
      const hourNow = new Date().getHours();
      const hoursElapsed = Math.max(1, hourNow - BUSINESS_OPEN_HOUR);
      const ordersPerHour = ordersToday / hoursElapsed;
      const recentOrders = ordersPerHour / 2;
      const waitMinutes = Math.min(25, Math.max(2, Math.round(recentOrders * AVG_MINUTES_PER_ORDER)));

      waitEl.textContent = `⏱ Estimated wait: ~${waitMinutes} min`;
    } catch (_) {
      waitEl.textContent = "";
    }
  }

  await fetchAndUpdate();
  setInterval(fetchAndUpdate, 60000);
}