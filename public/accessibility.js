// accessibility.js
// Shared accessibility controls for static public pages.
// High contrast and language are available everywhere.
// Text size and screen magnifier are limited to the customer kiosk.

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
  return path.includes("customer-interface");
}

function isMagnifierPreview() {
  return new URLSearchParams(window.location.search).get("magnifierPreview") === "1";
}

function getA11yLabels(lang = localStorage.getItem("lang") || "en", isHighContrast = localStorage.getItem("highContrast") === "true") {
  if (lang === "es") {
    return {
      toolbarLabel: "Opciones de accesibilidad",
      contrastOn: "⬛ Alto contraste activado",
      contrastOff: "🔲 Alto contraste",
      contrastAria: "Alternar modo de alto contraste",
      languageGroupAria: "Seleccion de idioma",
      enAria: "Cambiar a ingles",
      esAria: "Cambiar a espanol",
      textSizeAria: "Ajustar tamano de texto",
      magnifierOff: "🔍 Lupa",
      magnifierOn: "🔍 Activada",
      contrastButtonText: isHighContrast ? "⬛ Alto contraste activado" : "🔲 Alto contraste",
    };
  }

  return {
    toolbarLabel: "Accessibility options",
    contrastOn: "⬛ High Contrast On",
    contrastOff: "🔲 High Contrast",
    contrastAria: "Toggle high contrast mode",
    languageGroupAria: "Language selection",
    enAria: "Switch to English",
    esAria: "Cambiar a español",
    textSizeAria: "Adjust text size",
    magnifierOff: "🔍 Magnifier",
    magnifierOn: "🔍 On",
    contrastButtonText: isHighContrast ? "⬛ High Contrast On" : "🔲 High Contrast",
  };
}

function refreshToolbarLanguage() {
  const lang = localStorage.getItem("lang") || "en";
  const isHighContrast = localStorage.getItem("highContrast") === "true";
  const labels = getA11yLabels(lang, isHighContrast);

  const toolbar = document.querySelector(".a11y-toolbar");
  if (toolbar) {
    toolbar.setAttribute("aria-label", labels.toolbarLabel);
  }

  const langToggle = document.querySelector(".lang-toggle");
  if (langToggle) {
    langToggle.setAttribute("aria-label", labels.languageGroupAria);
  }

  const contrastBtn = document.getElementById("contrast-toggle");
  if (contrastBtn) {
    contrastBtn.setAttribute("aria-label", labels.contrastAria);
    contrastBtn.textContent = labels.contrastButtonText;
  }

  const enBtn = document.getElementById("lang-en");
  const esBtn = document.getElementById("lang-es");
  if (enBtn) enBtn.setAttribute("aria-label", labels.enAria);
  if (esBtn) esBtn.setAttribute("aria-label", labels.esAria);

  const textSlider = document.getElementById("text-size-slider");
  if (textSlider) {
    textSlider.setAttribute("aria-label", labels.textSizeAria);
  }

  const magnifierBtn = document.getElementById("magnifier-toggle");
  if (magnifierBtn) {
    const isActive = magnifierBtn.getAttribute("aria-pressed") === "true";
    magnifierBtn.textContent = isActive ? labels.magnifierOn : labels.magnifierOff;
    magnifierBtn.setAttribute(
      "aria-label",
      lang === "es" ? "Alternar lupa de pantalla" : "Toggle screen magnifier"
    );
  }
}

function injectToolbar() {
  const isHighContrast = localStorage.getItem("highContrast") === "true";
  const lang = localStorage.getItem("lang") || "en";
  const labels = getA11yLabels(lang, isHighContrast);
  const toolbar = document.createElement("div");
  toolbar.className = "a11y-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", labels.toolbarLabel);

  toolbar.innerHTML = `
    <button class="a11y-btn" id="contrast-toggle" type="button"
      aria-pressed="${isHighContrast}"
      aria-label="${labels.contrastAria}">
      ${labels.contrastButtonText}
    </button>
    <div class="lang-toggle" role="group" aria-label="${labels.languageGroupAria}">
      <button class="a11y-btn lang-btn ${lang === "en" ? "lang-active" : ""}" id="lang-en"
        type="button" aria-pressed="${lang === "en"}" aria-label="${labels.enAria}">EN</button>
      <span class="lang-divider" aria-hidden="true">|</span>
      <button class="a11y-btn lang-btn ${lang === "es" ? "lang-active" : ""}" id="lang-es"
        type="button" aria-pressed="${lang === "es"}" aria-label="${labels.esAria}">ES</button>
    </div>
  `;

  const primaryMain = document.querySelector("main");
  if (primaryMain) {
    primaryMain.insertBefore(toolbar, primaryMain.firstChild);
  } else {
    document.body.insertBefore(toolbar, document.body.firstChild);
  }

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
  if (btn) {
    btn.setAttribute("aria-pressed", next);
  }
  refreshToolbarLanguage();
}

function setLang(lang) {
  const previous = localStorage.getItem("lang") || "en";
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
  refreshToolbarLanguage();
  window.dispatchEvent(new CustomEvent("app:languagechange", { detail: { lang: next } }));

  const isCustomerPage = window.location.pathname.includes("customer-interface");
  if (previous !== next && isCustomerPage) {
    // Force a clean re-render from source content so language toggles never leave stale text behind.
    window.location.reload();
    return;
  }

  const translator = window.GoogleCloudTranslate;
  if (!translator) return;

  (async () => {
    try {
      if (typeof translator.init === "function") {
        translator.init();
      }

      if (typeof translator.setLanguage === "function") {
        await translator.setLanguage(next);
      }

      // Retry refresh to catch late-rendered text nodes and ensure visible switch.
      if (typeof translator.refresh === "function") {
        window.setTimeout(() => translator.refresh().catch(() => {}), 140);
        window.setTimeout(() => translator.refresh().catch(() => {}), 360);
      }
    } catch (_) {}
  })();
}

function injectToolbarStyles() {
  if (document.getElementById("a11y-toolbar-styles")) return;

  const style = document.createElement("style");
  style.id = "a11y-toolbar-styles";
  style.textContent = `
    .a11y-toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      gap: 10px;
      width: fit-content;
      max-width: 100%;
      margin: 0 auto 14px;
      padding: 10px 12px;
      border: 1px solid #cfdced;
      border-radius: 14px;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(244, 250, 255, 0.94)),
        radial-gradient(circle at top right, rgba(231, 111, 79, 0.14), transparent 40%);
      color: #22334f;
      box-shadow: 0 10px 20px rgba(29, 52, 84, 0.14);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      font-size: 0.9rem;
      position: relative;
      z-index: 30;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .a11y-btn {
      min-height: 36px;
      padding: 6px 12px;
      border-radius: 10px;
      border: 1px solid #bdd2ec;
      background: #ffffff;
      color: #1d3558;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;
    }

    .a11y-btn:hover {
      background: #edf5ff;
      border-color: #8eb2e0;
      transform: translateY(-1px);
    }

    .a11y-btn[aria-pressed="true"] {
      border-color: #1f8c86;
      background: #def7f5;
      color: #0f5f5a;
    }

    .a11y-btn:focus-visible,
    .a11y-text-size input:focus-visible {
      outline: 3px solid rgba(15, 159, 149, 0.55);
      outline-offset: 2px;
    }

    .a11y-text-size {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding-left: 8px;
      border-left: 1px solid #d8e5f4;
    }

    .lang-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .lang-divider {
      color: #8ca0bf;
    }

    .lang-active {
      background: #def7f5;
      color: #0f5f5a;
      border-color: #1f8c86;
      font-weight: 700;
    }

    .a11y-text-size label,
    .a11y-size-icon {
      font-weight: 700;
      line-height: 1;
      color: #244263;
    }

    .a11y-size-icon {
      font-size: 1.2rem;
    }

    .a11y-text-size input {
      width: 128px;
      accent-color: #1f8c86;
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
      border: 2px solid #fff;
      color: #fff;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    [data-theme="high-contrast"] .a11y-btn {
      background: #000;
      color: #fff;
      border-color: #fff;
    }

    [data-theme="high-contrast"] .a11y-btn:hover {
      background: #111;
      transform: none;
    }

    [data-theme="high-contrast"] .lang-active {
      background: #fff;
      color: #000;
    }

    [data-theme="high-contrast"] .a11y-text-size {
      border-left-color: #fff;
    }

    [data-theme="high-contrast"] .a11y-text-size label,
    [data-theme="high-contrast"] .a11y-size-icon {
      color: #fff;
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
      aria-label="${(localStorage.getItem("lang") || "en") === "es" ? "Ajustar tamano de texto" : "Adjust text size"}"
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
  btn.setAttribute(
    "aria-label",
    (localStorage.getItem("lang") || "en") === "es" ? "Alternar lupa de pantalla" : "Toggle screen magnifier"
  );
  btn.textContent = (localStorage.getItem("lang") || "en") === "es" ? "🔍 Lupa" : "🔍 Magnifier";
  toolbar.appendChild(btn);

  const lens = document.createElement("div");
  lens.id = "kiosk-magnifier-lens";
  lens.setAttribute("aria-hidden", "true");
  lens.style.width = `${LENS_SIZE}px`;
  lens.style.height = `${LENS_SIZE}px`;
  lens.style.left = "140px";
  lens.style.top = "140px";
  lens.style.transform = "translate(-50%, -50%)";

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
  let targetX = 140;
  let targetY = 140;
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
            .a11y-toolbar * {
              visibility: hidden !important;
              pointer-events: none !important;
            }

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
    targetX = focusX;
    targetY = focusY;

    lens.style.left = `${focusX}px`;
    lens.style.top = `${focusY}px`;
    updateOffset();
  }

  btn.addEventListener("click", () => {
    active = !active;
    btn.setAttribute("aria-pressed", active);
    lens.classList.toggle("active", active);
    refreshToolbarLanguage();

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
      moveLens(targetX - LENS_SIZE / 2, targetY - LENS_SIZE / 2, targetX, targetY);
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
  refreshToolbarLanguage();
});
