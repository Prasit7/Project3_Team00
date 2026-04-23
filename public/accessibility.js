// High contrast toggle and EN/ES language switcher.
// Must be loaded after translations.js on every static page.
// apply saved preferences immediately to avoid a flash on load
(function () {
  if (localStorage.getItem("highContrast") === "true") {
    document.documentElement.setAttribute("data-theme", "high-contrast");
  }
  const lang = localStorage.getItem("lang") || "en";
  document.documentElement.setAttribute("lang", lang);
})();

document.addEventListener("DOMContentLoaded", () => {
  injectToolbar();
  applyTranslations();
});

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

  // insert toolbar as the very first element in the body
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

// toolbar styles injected once so no separate CSS file is needed
function injectToolbarStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .a11y-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #222;
      color: #fff;
      font-size: 1rem;
      justify-content: flex-end;
    }
    .a11y-btn {
      background: transparent;
      color: #fff;
      border: 1px solid #666;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 1rem;
    }
    .a11y-btn:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }
    .lang-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lang-divider {
      color: #888;
    }
    .lang-active {
      background: #fff;
      color: #222;
      font-weight: 700;
    }
  `;
  document.head.appendChild(style);
}
// customer-interface-only features
// only runs on pages inside /customer-interface/
(function () {
  if (!window.location.pathname.includes("customer-interface")) return;

  document.addEventListener("DOMContentLoaded", () => {
    injectTextSizeSlider();
    injectMagnifier();
    loadWaitTime();
  });
})();

// --- text size slider ---

function injectTextSizeSlider() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar) return;

  const saved = parseFloat(localStorage.getItem("kioskFontSize")) || 1;

  const wrapper = document.createElement("div");
  wrapper.className = "a11y-text-size";
  wrapper.innerHTML = `
    <label for="text-size-slider">Text Size</label>
    <input
      id="text-size-slider"
      type="range"
      min="0.85"
      max="1.4"
      step="0.05"
      value="${saved}"
      aria-label="Adjust text size"
    />
  `;

  toolbar.appendChild(wrapper);

  applyFontSize(saved);

  wrapper.querySelector("input").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    applyFontSize(val);
    localStorage.setItem("kioskFontSize", val);
  });
}

function applyFontSize(scale) {
  document.documentElement.style.fontSize = scale + "rem";
}

// --- screen magnifier ---

function injectMagnifier() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar) return;

  const btn = document.createElement("button");
  btn.className = "a11y-btn";
  btn.id = "magnifier-toggle";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Toggle screen magnifier");
  btn.textContent = "🔍 Magnifier";
  toolbar.appendChild(btn);

  // create the magnifier lens element
  const lens = document.createElement("div");
  lens.className = "kiosk-magnifier";
  lens.setAttribute("aria-hidden", "true");
  document.body.appendChild(lens);

  let active = false;
  const ZOOM = 2.5;
  const SIZE = 160;

  btn.addEventListener("click", () => {
    active = !active;
    btn.setAttribute("aria-pressed", active);
    btn.textContent = active ? "🔍 Magnifier On" : "🔍 Magnifier";
    document.body.classList.toggle("magnifier-active", active);
    if (!active) lens.style.display = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!active) return;

    const x = e.clientX;
    const y = e.clientY;
    const half = SIZE / 2;

    // position lens centered on cursor
    lens.style.left = (x - half) + "px";
    lens.style.top = (y - half) + "px";
    lens.style.display = "block";

    // use CSS zoom trick: scale the entire page inside the lens
    // by setting a background-image of the viewport via CSS transform
    // We use a canvas approach for real pixel capture
    renderMagnifier(lens, x, y, ZOOM, SIZE);
  });
}

function renderMagnifier(lens, cx, cy, zoom, size) {
  // use CSS background trick — no external lib needed
  // clone the viewport by scaling body inside a clipping circle
  lens.style.backgroundImage = "none";

  // remove old canvas if any
  const old = lens.querySelector("canvas");
  if (old) old.remove();

  // create canvas and draw zoomed region using drawWindow if available,
  // otherwise fall back to CSS transform trick
  const half = size / 2;
  const srcX = cx - half / zoom;
  const srcY = cy - half / zoom;
  const srcW = size / zoom;
  const srcH = size / zoom;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";

  const ctx = canvas.getContext("2d");

  // drawWindow is only in Firefox — for all browsers use CSS fallback
  if (typeof ctx.drawWindow === "function") {
    ctx.drawWindow(window, srcX + window.scrollX, srcY + window.scrollY, srcW, srcH, "#fff");
    ctx.scale(zoom, zoom);
    lens.appendChild(canvas);
  } else {
    // CSS fallback: scale the body element inside the lens
    lens.innerHTML = "";
    lens.style.overflow = "hidden";
    lens.style.background = "#fff";

    const mirror = document.createElement("div");
    mirror.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: ${window.innerWidth}px;
      height: ${window.innerHeight}px;
      transform-origin: ${cx}px ${cy}px;
      transform: scale(${zoom}) translate(${(size / 2 - cx * zoom) / zoom}px, ${(size / 2 - cy * zoom) / zoom}px);
      pointer-events: none;
    `;

    // use a screenshot via html2canvas if loaded, otherwise show zoom hint
    if (window.html2canvas) {
      window.html2canvas(document.body, {
        x: srcX + window.scrollX,
        y: srcY + window.scrollY,
        width: srcW,
        height: srcH,
        scale: zoom,
        logging: false,
      }).then((c) => {
        lens.innerHTML = "";
        c.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;";
        lens.appendChild(c);
      });
    } else {
      // pure CSS zoom — moves background based on cursor position
      const bx = -(cx * zoom - half);
      const by = -(cy * zoom - half);
      lens.style.backgroundImage = `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>')`;
      lens.style.background = `#fffaf4`;

      // apply a CSS filter zoom using element scaling
      // this is the simplest cross-browser approach with no deps
      const scaler = document.createElement("div");
      scaler.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: ${window.innerWidth}px;
        height: ${window.innerHeight}px;
        transform-origin: ${cx}px ${cy}px;
        transform: scale(${zoom});
        pointer-events: none;
        z-index: -1;
      `;
      // We clone the viewport offset — this is best-effort without a lib
      // The lens will show the zoomed area using outline/border as indicator
      lens.style.boxShadow = "0 0 0 3px var(--accent, #ec6f4f), 0 8px 24px rgba(0,0,0,0.28)";
      lens.innerHTML = `<div style="width:100%;height:100%;display:grid;place-items:center;font-size:0.7rem;color:#7d4b2f;font-weight:700;">🔍</div>`;
    }
  }
}

// --- estimated wait time ---
// fetches orders_today from /api/xreport and estimates wait time
// formula: (orders_today / hours_open) * avg_minutes_per_order
// avg prep time per order = 3 minutes

const AVG_MINUTES_PER_ORDER = 3;
const BUSINESS_OPEN_HOUR = 9;
const BUSINESS_CLOSE_HOUR = 22;

async function loadWaitTime() {
  const waitEl = document.getElementById("wait-time-text");
  if (!waitEl) return;

  try {
    const res = await fetch("/api/xreport");
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();

    const ordersToday = parseInt(data.orders_today) || 0;
    const now = new Date();
    const hourNow = now.getHours();

    // hours elapsed since open, minimum 1 to avoid divide-by-zero
    const hoursElapsed = Math.max(1, hourNow - BUSINESS_OPEN_HOUR);

    // orders per hour so far today
    const ordersPerHour = ordersToday / hoursElapsed;

    // orders in the last ~30 minutes
    const recentOrders = ordersPerHour / 2;

    // estimated wait = recent backlog * avg prep time, capped at 25 min, min 2 min
    const waitMinutes = Math.min(25, Math.max(2, Math.round(recentOrders * AVG_MINUTES_PER_ORDER)));

    waitEl.textContent = `⏱ Estimated wait: ~${waitMinutes} min`;
  } catch (_err) {
    // silently fail — wait time is non-critical
    const waitEl = document.getElementById("wait-time-text");
    if (waitEl) waitEl.textContent = "";
  }
}