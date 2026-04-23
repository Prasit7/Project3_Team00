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
      padding: 6px 12px;
      background: #222;
      color: #fff;
      font-size: 0.85rem;
      justify-content: flex-end;
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