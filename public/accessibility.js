// accessibility.js
// Shared accessibility controls for static public pages.
// High contrast and language are available everywhere.
// Text size and screen magnifier are limited to the menu board and customer kiosk.

(function () {
  if (localStorage.getItem("highContrast") === "true") {
    document.documentElement.setAttribute("data-theme", "high-contrast");
  }

  const lang = localStorage.getItem("lang") || "en";
  document.documentElement.setAttribute("lang", lang);

  const savedFontScale = parseFloat(localStorage.getItem("kioskFontSize"));
  if (shouldEnableCustomerFacingA11y() && !Number.isNaN(savedFontScale) && savedFontScale > 0) {
    document.documentElement.style.fontSize = `${savedFontScale * 16}px`;
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  if (isMagnifierPreview()) {
    return;
  }

  injectToolbar();

  if (shouldEnableCustomerFacingA11y()) {
    injectTextSizeSlider();
    injectMagnifier();
  }

  if (window.location.pathname.includes("customer-interface")) {
    loadWaitTime();
  }
});

function shouldEnableCustomerFacingA11y() {
  const path = window.location.pathname;
  return path.includes("customer-interface") || path.endsWith("/menu-board.html") || path === "/menu-board.html";
}

function isMagnifierPreview() {
  return new URLSearchParams(window.location.search).get("magnifierPreview") === "1";
}

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
  if (!btn) return;
  btn.setAttribute("aria-pressed", next);
  btn.textContent = next ? "⬛ High Contrast On" : "🔲 High Contrast";
}

function setLang(lang) {
  const next = lang === "es" ? "es" : "en";
  localStorage.setItem("lang", next);
  document.documentElement.setAttribute("lang", next);

  const enBtn = document.getElementById("lang-en");
  const esBtn = document.getElementById("lang-es");
  if (enBtn && esBtn) {
    enBtn.setAttribute("aria-pressed", String(next === "en"));
    esBtn.setAttribute("aria-pressed", String(next === "es"));
    enBtn.classList.toggle("lang-active", next === "en");
    esBtn.classList.toggle("lang-active", next === "es");
  }

  if (window.GoogleCloudTranslate && typeof window.GoogleCloudTranslate.setLanguage === "function") {
    window.GoogleCloudTranslate.setLanguage(next).catch(() => {});
  }
}

function injectToolbarStyles() {
  if (document.getElementById("a11y-toolbar-styles")) return;

  const style = document.createElement("style");
  style.id = "a11y-toolbar-styles";
  style.textContent = `
    .a11y-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      padding: 6px 12px;
      background: #222;
      color: #fff;
      font-size: 0.85rem;
      position: relative;
      z-index: 30;
    }

    .a11y-btn {
      background: transparent;
      color: #fff;
      border: 1px solid #666;
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.85rem;
    }

    .a11y-btn:focus-visible,
    .a11y-text-size input:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 2px;
    }

    .a11y-text-size {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding-left: 6px;
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

    .a11y-text-size label,
    .a11y-size-icon {
      font-weight: 700;
      line-height: 1;
    }

    .a11y-size-icon {
      font-size: 1.2rem;
    }

    .a11y-text-size input {
      width: 120px;
      accent-color: #fff;
    }

    #kiosk-magnifier-lens {
      position: fixed;
      display: none;
      overflow: hidden;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
      background: #fff;
      pointer-events: none;
      z-index: 9999;
    }

    #kiosk-magnifier-lens.active {
      display: block;
    }

    #kiosk-magnifier-lens iframe {
      position: absolute;
      inset: 0 auto auto 0;
    }

    [data-theme="high-contrast"] .a11y-toolbar {
      background: #000;
      border-bottom: 2px solid #fff;
    }

    [data-theme="high-contrast"] .a11y-btn {
      border-color: #fff;
    }

    [data-theme="high-contrast"] .lang-active {
      background: #fff;
      color: #000;
    }

    [data-theme="high-contrast"] #kiosk-magnifier-lens {
      border-color: #ff0;
    }
  `;

  document.head.appendChild(style);
}

function injectTextSizeSlider() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar || document.querySelector(".a11y-text-size")) return;

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
      aria-label="Adjust text size"
    />
    <span class="a11y-size-icon" aria-hidden="true">A</span>
  `;

  toolbar.appendChild(wrapper);

  wrapper.querySelector("input").addEventListener("input", (event) => {
    const value = parseFloat(event.target.value);
    applyFontSize(value);
    localStorage.setItem("kioskFontSize", value);
  });
}

function applyFontSize(scale) {
  document.documentElement.style.fontSize = `${scale * 16}px`;
}

function injectMagnifier() {
  const toolbar = document.querySelector(".a11y-toolbar");
  if (!toolbar || document.getElementById("magnifier-toggle")) return;

  const LENS_SIZE = 220;
  const ZOOM = 2.5;

  const btn = document.createElement("button");
  btn.className = "a11y-btn";
  btn.id = "magnifier-toggle";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");
  btn.setAttribute("aria-label", "Toggle screen magnifier");
  btn.textContent = "🔍 Magnifier";
  toolbar.appendChild(btn);

  const lens = document.createElement("div");
  lens.id = "kiosk-magnifier-lens";
  lens.setAttribute("aria-hidden", "true");
  lens.style.width = `${LENS_SIZE}px`;
  lens.style.height = `${LENS_SIZE}px`;
  lens.style.left = "140px";
  lens.style.top = "140px";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.border = "none";
  iframe.style.pointerEvents = "none";
  iframe.style.transformOrigin = "0 0";
  iframe.style.background = "transparent";

  lens.appendChild(iframe);
  document.body.appendChild(lens);

  let active = false;
  let lensX = 140;
  let lensY = 140;
  let targetX = lensX + LENS_SIZE / 2;
  let targetY = lensY + LENS_SIZE / 2;
  let iframeLoaded = false;

  function initIframe() {
    if (iframeLoaded) return;

    iframe.style.width = `${window.innerWidth}px`;
    iframe.style.height = `${window.innerHeight}px`;

    const previewUrl = new URL(window.location.href);
    previewUrl.searchParams.set("magnifierPreview", "1");
    iframe.src = previewUrl.toString();

    iframe.onload = () => {
      iframeLoaded = true;
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          const style = iframeDoc.createElement("style");
          style.textContent = `
            .a11y-toolbar,
            #kiosk-magnifier-lens {
              display: none !important;
            }
          `;
          iframeDoc.head.appendChild(style);
          iframe.contentWindow.scrollTo(window.scrollX, window.scrollY);
        }
      } catch (_) {}

      updateOffset();
    };
  }

  function updateOffset() {
    if (!iframeLoaded) return;

    const offX = LENS_SIZE / 2 - targetX * ZOOM;
    const offY = LENS_SIZE / 2 - targetY * ZOOM;

    iframe.style.transform = `scale(${ZOOM})`;
    iframe.style.left = `${offX}px`;
    iframe.style.top = `${offY}px`;

    try {
      iframe.contentWindow.scrollTo(window.scrollX, window.scrollY);
    } catch (_) {}
  }

  function moveLens(x, y, focusX = x + LENS_SIZE / 2, focusY = y + LENS_SIZE / 2) {
    lensX = Math.max(0, Math.min(window.innerWidth - LENS_SIZE, x));
    lensY = Math.max(0, Math.min(window.innerHeight - LENS_SIZE, y));
    targetX = Math.max(0, Math.min(window.innerWidth, focusX));
    targetY = Math.max(0, Math.min(window.innerHeight, focusY));

    lens.style.left = `${lensX}px`;
    lens.style.top = `${lensY}px`;
    updateOffset();
  }

  btn.addEventListener("click", () => {
    active = !active;
    btn.setAttribute("aria-pressed", active);
    btn.textContent = active ? "🔍 On" : "🔍 Magnifier";
    lens.classList.toggle("active", active);

    if (active) {
      initIframe();
      updateOffset();
    }
  });

  document.addEventListener("mousemove", (event) => {
    if (!active) return;
    moveLens(
      event.clientX - LENS_SIZE / 2,
      event.clientY - LENS_SIZE / 2,
      event.clientX,
      event.clientY
    );
  });

  document.addEventListener("touchmove", (event) => {
    if (!active) return;
    const touch = event.touches[0];
    moveLens(
      touch.clientX - LENS_SIZE / 2,
      touch.clientY - LENS_SIZE / 2,
      touch.clientX,
      touch.clientY
    );
    event.preventDefault();
  }, { passive: false });

  window.addEventListener("scroll", () => {
    if (!active) return;
    updateOffset();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (!iframeLoaded) return;
    iframe.style.width = `${window.innerWidth}px`;
    iframe.style.height = `${window.innerHeight}px`;
    if (active) {
      moveLens(lensX, lensY, targetX, targetY);
    }
  });
}

function loadWaitTime() {
  const waitEl = document.getElementById("wait-time-text");
  if (!waitEl) return;

  const AVG_MINUTES_PER_ORDER = 3;
  const BUSINESS_OPEN_HOUR = 9;

  function getRecentOrdersPerHalfHour(data) {
    const rows = Array.isArray(data.rows)
      ? data.rows
        .map((row) => ({
          hour: Number(row.hour),
          orders: Number(row.orders) || 0,
        }))
        .filter((row) => Number.isInteger(row.hour))
        .sort((a, b) => a.hour - b.hour)
      : [];

    const hourNow = new Date().getHours();

    if (rows.length > 0) {
      const businessDate = String(data.businessDate || "").slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const recentRows = businessDate === today
        ? rows.filter((row) => row.hour >= hourNow - 1 && row.hour <= hourNow)
        : rows.slice(-2);
      const fallbackRows = recentRows.length > 0 ? recentRows : rows.slice(-2);
      const recentOrders = fallbackRows.reduce((total, row) => total + row.orders, 0);
      const hoursSampled = Math.max(1, fallbackRows.length);

      return (recentOrders / hoursSampled) / 2;
    }

    const totalOrders = Number(data.totalOrders ?? data.orders_today) || 0;
    const hoursElapsed = Math.max(1, hourNow - BUSINESS_OPEN_HOUR);
    return (totalOrders / hoursElapsed) / 2;
  }

  async function fetchAndUpdate() {
    try {
      const res = await fetch("/api/wait-time");
      if (!res.ok) throw new Error();

      const data = await res.json();
      const waitMinutes = Number.isFinite(Number(data.waitMinutes))
        ? Number(data.waitMinutes)
        : Math.min(25, Math.max(2, Math.round(getRecentOrdersPerHalfHour(data) * AVG_MINUTES_PER_ORDER)));

      waitEl.textContent = `Estimated wait: ~${waitMinutes} min`;
    } catch (_) {
      waitEl.textContent = "Estimated wait unavailable";
    }
  }

  fetchAndUpdate();
  window.setInterval(fetchAndUpdate, 60000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.GoogleCloudTranslate && typeof window.GoogleCloudTranslate.init === "function") {
    window.GoogleCloudTranslate.init();
  }
});
