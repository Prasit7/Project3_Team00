// google-translate.js
// Runtime EN/ES translation for kiosk and menu board via server-side /api/translate.

(function () {
  const SUPPORTED_LANGS = new Set(["en", "es"]);
  const ATTRIBUTES_TO_TRANSLATE = ["placeholder", "aria-label", "title"];
  const CACHE = new Map();
  const sourceByTextNode = new WeakMap();
  const lastTranslatedByTextNode = new WeakMap();
  const attrStateByElement = new WeakMap();
  const EXCLUDED_SELECTOR = ".a11y-toolbar, script, style, noscript, iframe, #kiosk-magnifier-lens";

  let currentLang = localStorage.getItem("lang") || "en";
  let mutationObserver = null;
  let mutationDebounce = null;
  let isApplying = false;

  function isSupportedLang(lang) {
    return SUPPORTED_LANGS.has(lang);
  }

  function normalizeLang(lang) {
    const normalized = String(lang || "").trim().toLowerCase();
    return isSupportedLang(normalized) ? normalized : "en";
  }

  function isExcludedElement(element) {
    return !!(element && element.closest && element.closest(EXCLUDED_SELECTOR));
  }

  function shouldTranslateText(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return false;
    if (!/[A-Za-z]/.test(trimmed)) return false;
    if (/^\$?\d+([.,]\d+)?%?$/.test(trimmed)) return false;
    return true;
  }

  function getAttrState(element) {
    let state = attrStateByElement.get(element);
    if (!state) {
      state = { source: {}, lastTranslated: {} };
      attrStateByElement.set(element, state);
    }
    return state;
  }

  function collectTextNodes(root) {
    const list = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || isExcludedElement(parent)) continue;
      if (!shouldTranslateText(node.nodeValue)) continue;
      list.push(node);
    }

    return list;
  }

  function collectAttributeTargets(root) {
    const targets = [];
    const elements = root.querySelectorAll("*");

    elements.forEach((element) => {
      if (isExcludedElement(element)) return;
      ATTRIBUTES_TO_TRANSLATE.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (!shouldTranslateText(value)) return;
        targets.push({ element, attr });
      });
    });

    return targets;
  }

  async function requestTranslations(texts, targetLang) {
    if (!texts.length) return [];

    const uncached = [];
    const keyOrder = [];

    texts.forEach((text) => {
      const key = `${targetLang}::${text}`;
      keyOrder.push(key);
      if (!CACHE.has(key)) uncached.push(text);
    });

    if (uncached.length) {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "en",
          target: targetLang,
          texts: uncached,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok || !Array.isArray(payload?.translations)) {
        throw new Error(payload?.error || "Translation request failed.");
      }

      uncached.forEach((text, index) => {
        const translated = String(payload.translations[index] || text);
        CACHE.set(`${targetLang}::${text}`, translated);
      });
    }

    return keyOrder.map((key) => CACHE.get(key) || key.split("::")[1]);
  }

  async function applyLanguage(targetLang) {
    const lang = normalizeLang(targetLang);
    currentLang = lang;
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("lang", lang);

    if (!document.body) return;

    const textNodes = collectTextNodes(document.body);
    const attrTargets = collectAttributeTargets(document.body);

    if (lang === "en") {
      isApplying = true;
      try {
        textNodes.forEach((node) => {
          const original = sourceByTextNode.get(node);
          if (typeof original === "string") {
            node.nodeValue = original;
            lastTranslatedByTextNode.delete(node);
          }
        });

        attrTargets.forEach(({ element, attr }) => {
          const state = getAttrState(element);
          const original = state.source[attr];
          if (typeof original === "string") {
            element.setAttribute(attr, original);
            delete state.lastTranslated[attr];
          }
        });
      } finally {
        isApplying = false;
      }
      return;
    }

    const sourceTexts = [];
    const textNodeSources = [];
    const attrSources = [];

    textNodes.forEach((node) => {
      const current = String(node.nodeValue || "");
      const existingSource = sourceByTextNode.get(node);
      const lastTranslated = lastTranslatedByTextNode.get(node);

      let source = existingSource;
      if (typeof source !== "string") {
        source = current;
      } else if (current !== lastTranslated && current !== source && shouldTranslateText(current)) {
        source = current;
      }

      sourceByTextNode.set(node, source);
      textNodeSources.push({ node, source });
      sourceTexts.push(source);
    });

    attrTargets.forEach(({ element, attr }) => {
      const state = getAttrState(element);
      const current = String(element.getAttribute(attr) || "");
      const existingSource = state.source[attr];
      const lastTranslated = state.lastTranslated[attr];

      let source = existingSource;
      if (typeof source !== "string") {
        source = current;
      } else if (current !== lastTranslated && current !== source && shouldTranslateText(current)) {
        source = current;
      }

      state.source[attr] = source;
      attrSources.push({ element, attr, source });
      sourceTexts.push(source);
    });

    if (!sourceTexts.length) return;

    const translated = await requestTranslations(sourceTexts, lang);

    isApplying = true;
    try {
      let cursor = 0;

      textNodeSources.forEach(({ node }) => {
        const translatedText = translated[cursor++] || node.nodeValue;
        node.nodeValue = translatedText;
        lastTranslatedByTextNode.set(node, translatedText);
      });

      attrSources.forEach(({ element, attr }) => {
        const translatedText = translated[cursor++] || element.getAttribute(attr) || "";
        element.setAttribute(attr, translatedText);
        const state = getAttrState(element);
        state.lastTranslated[attr] = translatedText;
      });
    } finally {
      isApplying = false;
    }
  }

  function scheduleRefresh() {
    if (isApplying || currentLang === "en") return;
    if (mutationDebounce) {
      clearTimeout(mutationDebounce);
    }

    mutationDebounce = setTimeout(() => {
      applyLanguage(currentLang).catch(() => {});
    }, 180);
  }

  function startObserver() {
    if (mutationObserver || !document.body) return;
    mutationObserver = new MutationObserver(() => {
      scheduleRefresh();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES_TO_TRANSLATE,
    });
  }

  function init() {
    currentLang = normalizeLang(localStorage.getItem("lang") || "en");
    document.documentElement.setAttribute("lang", currentLang);
    startObserver();
    applyLanguage(currentLang).catch(() => {});
  }

  window.GoogleCloudTranslate = {
    init,
    setLanguage: (lang) => applyLanguage(normalizeLang(lang)),
    getLanguage: () => currentLang,
    refresh: () => applyLanguage(currentLang),
  };
})();
