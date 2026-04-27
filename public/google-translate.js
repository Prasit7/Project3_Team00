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
  const FALLBACK_ES_MAP = new Map([
    ["Choose Your Items", "Elige tus bebidas"],
    ["Customize Your Drink", "Personaliza tu bebida"],
    ["Checkout", "Pago"],
    ["Step 1 of 3: Select drinks from the menu.", "Paso 1 de 3: Selecciona bebidas del menu."],
    ["Step 2 of 3: Choose size, ice, sugar, and toppings.", "Paso 2 de 3: Elige tamano, hielo, azucar y toppings."],
    ["Step 3 of 3: Review the order and complete checkout.", "Paso 3 de 3: Revisa tu pedido y completa el pago."],
    ["Estimated wait:", "Tiempo estimado:"],
    ["Cart", "Carrito"],
    ["Personal Assistant", "Asistente personal"],
    ["Ask", "Preguntar"],
    ["Next: Checkout", "Siguiente: Pago"],
    ["Back to Menu", "Volver al menu"],
    ["Back to Customization", "Volver a personalizacion"],
    ["Add to Order", "Agregar al pedido"],
    ["Order More", "Pedir mas"],
    ["Cancel Order", "Cancelar pedido"],
    ["Pay", "Pagar"],
    ["Order Summary", "Resumen del pedido"],
    ["No item selected yet.", "Aun no hay bebida seleccionada."],
    ["No customization saved yet.", "Aun no hay personalizacion guardada."],
    ["No order available yet.", "Aun no hay pedido disponible."],
    ["Loading menu from database...", "Cargando menu desde la base de datos..."],
    ["Loading selected item and customization options...", "Cargando bebida seleccionada y opciones de personalizacion..."],
    ["Loading order summary...", "Cargando resumen del pedido..."],
    ["Tap to customize", "Toca para personalizar"],
    ["Open customization", "Abrir personalizacion"],
    ["Selected Drink", "Bebida seleccionada"],
    ["Size", "Tamano"],
    ["Temperature", "Temperatura"],
    ["Ice Level", "Nivel de hielo"],
    ["Sugar Level", "Nivel de azucar"],
    ["Toppings", "Toppings"],
    ["Special Instructions", "Instrucciones especiales"],
    ["Optional note", "Nota opcional"],
    ["Drink Customization", "Personalizacion de bebida"],
    ["Quantity", "Cantidad"],
    ["Total:", "Total:"],
    ["Menu categories", "Categorias del menu"],
    ["Menu items", "Bebidas del menu"],
    ["Order is confirmed.", "El pedido esta confirmado."],
    ["Payment Successful", "Pago exitoso"],
    ["Start New Order", "Iniciar nuevo pedido"],
    ["Loading current weather...", "Cargando clima actual..."],
    ["Ask the kiosk assistant", "Preguntar al asistente del kiosco"],
    ["Ask about drinks, toppings, or your order...", "Pregunta sobre bebidas, toppings o tu pedido..."],
    ["Hi! I can help with menu choices, toppings, customization, and ordering.", "Hola. Puedo ayudarte con opciones del menu, toppings, personalizacion y pedidos."],
    ["Thinking...", "Pensando..."],
    ["Network issue. Please try again.", "Problema de red. Intentalo de nuevo."],
    ["How can I help with your order?", "Como puedo ayudarte con tu pedido?"],
    ["I can help with menu and ordering, but I am temporarily unavailable. Please try again.", "Puedo ayudarte con menu y pedidos, pero temporalmente no estoy disponible. Intentalo de nuevo."],
    ["Removed", "Se elimino"],
    ["from your cart.", "de tu carrito."],
    ["Do you want any modifications?", "Quieres alguna modificacion?"],
    ["Payment complete. Order", "Pago completado. Pedido"],
    ["is confirmed.", "confirmado."],
    ["Starting a new order in", "Iniciando un nuevo pedido en"],
  ]);

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

  function fallbackTranslateText(text, targetLang) {
    if (targetLang !== "es") return text;
    let result = String(text || "");

    for (const [english, spanish] of FALLBACK_ES_MAP.entries()) {
      result = result.replaceAll(english, spanish);
    }

    const phraseReplacements = [
      [/\bItem\s+(\d+)\s*:/gi, "Articulo $1:"],
      [/\bCategory\s*:/gi, "Categoria:"],
      [/\bSize\s*:/gi, "Tamano:"],
      [/\bQuantity\s*:/gi, "Cantidad:"],
      [/\bTemperature\s*:/gi, "Temperatura:"],
      [/\bIce Level\s*:/gi, "Nivel de hielo:"],
      [/\bSugar Level\s*:/gi, "Nivel de azucar:"],
      [/\bToppings\s*:/gi, "Toppings:"],
      [/\bSpecial Instructions\s*:/gi, "Instrucciones especiales:"],
      [/\bItem Total\s*:/gi, "Total del articulo:"],
      [/\bTotal\s*:/gi, "Total:"],
      [/\bnone\b/gi, "ninguno"],
      [/\bNo\b/gi, "No"],
      [/\bLoading\b/gi, "Cargando"],
      [/\bweather\b/gi, "clima"],
      [/\bThunderstorm\b/gi, "Tormenta electrica"],
      [/\bDrizzle\b/gi, "Llovizna"],
      [/\bRain\b/gi, "Lluvia"],
      [/\bSnow\b/gi, "Nieve"],
      [/\bMist\b/gi, "Neblina"],
      [/\bSmoke\b/gi, "Humo"],
      [/\bHaze\b/gi, "Calima"],
      [/\bDust\b/gi, "Polvo"],
      [/\bFog\b/gi, "Niebla"],
      [/\bSand\b/gi, "Arena"],
      [/\bAsh\b/gi, "Ceniza"],
      [/\bSquall\b/gi, "Turbonada"],
      [/\bTornado\b/gi, "Tornado"],
      [/\bClear sky\b/gi, "Cielo despejado"],
      [/\bClear\b/gi, "Despejado"],
      [/\bClouds\b/gi, "Nublado"],
      [/\bfew clouds\b/gi, "pocas nubes"],
      [/\bscattered clouds\b/gi, "nubes dispersas"],
      [/\bbroken clouds\b/gi, "nubes fragmentadas"],
      [/\bovercast clouds\b/gi, "nublado"],
      [/\bMilk Tea\b/gi, "Te con leche"],
      [/\bFruit Tea\b/gi, "Te de fruta"],
      [/\bGreen Tea\b/gi, "Te verde"],
      [/\bBlack Tea\b/gi, "Te negro"],
      [/\bOolong Tea\b/gi, "Te oolong"],
      [/\bJasmine Tea\b/gi, "Te de jazmin"],
      [/\bSmoothie\b/gi, "Batido"],
    ];

    phraseReplacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return result;
  }

  async function requestTranslations(texts, targetLang) {
    if (!texts.length) return [];
    try {
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
          return texts.map((text) => fallbackTranslateText(text, targetLang));
        }

        uncached.forEach((text, index) => {
          const translated = String(payload.translations[index] || text);
          CACHE.set(`${targetLang}::${text}`, translated);
        });
      }

      return keyOrder.map((key) => CACHE.get(key) || key.split("::")[1]);
    } catch {
      return texts.map((text) => fallbackTranslateText(text, targetLang));
    }
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
