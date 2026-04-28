import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 500;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function cleanText(value, maxLength = 120) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toPlainAssistantText(value, maxLength = 2000) {
  return cleanText(value, maxLength).replace(/\*\*/g, "").replace(/`/g, "");
}

function normalizeLookup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const TASTE_NOTES = {
  passionfruit: "Passion fruit is usually sweet and tangy, with a tropical citrus-like flavor.",
  mango: "Mango is typically sweet, tropical, and juicy with a smooth fruity taste.",
  lychee: "Lychee is usually sweet, floral, and lightly citrusy.",
  peach: "Peach is usually sweet, fragrant, and mellow-fruity.",
  wintermelon: "Wintermelon tea is usually mild and refreshing with a subtle sweetness.",
  jasmine: "Jasmine tea is usually light, floral, and aromatic.",
  taro: "Taro milk tea is usually creamy, nutty, and slightly sweet.",
  matcha: "Matcha is usually earthy with a gentle bitter-sweet tea flavor.",
  strawberry: "Strawberry flavor is usually sweet, fruity, and slightly tart.",
  honeydew: "Honeydew flavor is usually sweet, mellow, and melon-like.",
  rose: "Rose flavor is usually floral and fragrant with gentle sweetness.",
  lavender: "Lavender flavor is usually floral and aromatic with a light herbal note.",
  coffee: "Coffee flavor is usually roasted and slightly bitter with rich aroma.",
  coconut: "Coconut flavor is usually creamy, sweet, and tropical.",
  almond: "Almond flavor is usually nutty and mildly sweet.",
  brownsugar: "Brown sugar flavor is usually caramel-like, rich, and sweet.",
  oreo: "Oreo flavor is usually chocolate-cookie sweet and creamy.",
};

function isNoModificationMessage(message) {
  const text = String(message || "").toLowerCase().trim();
  return /^(normal|no|none|no modification|no modifications|default|regular|keep it normal)$/.test(text);
}

function isStartModificationMessage(message) {
  const text = String(message || "").toLowerCase().trim();
  return /^(yes|yeah|yep|sure|customize|modification|modifications|change it|change)$/i.test(text);
}

function extractTasteTarget(message) {
  const text = String(message || "").toLowerCase().trim();
  let match = text.match(/what does (.+?) taste like\??$/i);
  if (match) return cleanText(match[1], 80);
  match = text.match(/how does (.+?) taste\??$/i);
  if (match) return cleanText(match[1], 80);
  return null;
}

function findBestByPhrase(phrase, list, getName) {
  const normalizedPhrase = normalizeLookup(phrase);
  if (!normalizedPhrase) return null;

  const candidates = list
    .map((entry) => {
      const name = getName(entry);
      return { entry, key: normalizeLookup(name), name };
    })
    .filter((entry) => entry.key && (entry.key.includes(normalizedPhrase) || normalizedPhrase.includes(entry.key)))
    .sort((a, b) => b.key.length - a.key.length);

  return candidates[0]?.entry || null;
}

function buildTasteReply(phrase, matchedItem, matchedModifier) {
  const key = normalizeLookup(phrase);
  const noteKey = Object.keys(TASTE_NOTES).find((token) => key.includes(token));

  if (noteKey) {
    return TASTE_NOTES[noteKey];
  }

  if (matchedItem) {
    const category = String(matchedItem.category || "").toLowerCase();
    if (category.includes("fruit")) {
      return `${matchedItem.name} is usually fruity, refreshing, and lightly sweet.`;
    }
    if (category.includes("milk")) {
      return `${matchedItem.name} is usually creamy and sweet with a tea-forward flavor.`;
    }
    return `${matchedItem.name} usually has a tea-based flavor profile with balanced sweetness.`;
  }

  if (matchedModifier) {
    return `${matchedModifier.name} usually adds extra flavor or texture to the drink.`;
  }

  return "I do not have that information.";
}

function findModifierByTokens(modifiers, type, tokenList) {
  const options = modifiers.filter((entry) => entry.type === type);
  return options.find((entry) => {
    const name = String(entry.name || "").toLowerCase();
    return tokenList.some((token) => name.includes(token));
  });
}

function getSugarOptions(modifiers) {
  return modifiers
    .filter((entry) => entry.type === "Sugar Level")
    .map((entry) => {
      const name = String(entry.name || "");
      const match = name.match(/(\d{1,3})\s*%/);
      return {
        entry,
        name,
        normalizedName: name.toLowerCase(),
        percent: match ? Number.parseInt(match[1], 10) : null,
      };
    });
}

function findSugarOptionByPercent(modifiers, targetPercent) {
  const options = getSugarOptions(modifiers);
  if (!Number.isFinite(targetPercent)) return null;
  return options.find((option) => option.percent === Number(targetPercent))?.entry || null;
}

function parseModificationRequest(message, modifiers) {
  const text = String(message || "").toLowerCase();
  const normalizedText = normalizeLookup(text);
  const updates = {};
  const applied = [];
  const removeToppings = [];
  const invalidFields = [];
  const mentionsSize = /\b(size|small|regular|large|medium|extra large|16\s*oz|20\s*oz)\b/.test(text);
  const mentionsIce = /\bice\b/.test(text);
  const mentionsSugarWord = /\bsugar\b|\bsweet\b|\bsweeter\b|\bextra sweet\b/.test(text);
  const mentionsAmbiguousMoreSugar = /\b(more sugar|extra sugar|sweeter|very sweet|extra sweet)\b/.test(text);
  const asksToppingOptions = /\b(what|which)\b[\s\S]*\b(toppings|boba)\b|\bwhat toppings are there\b|\bavailable toppings\b/.test(
    text
  );
  const mentionsTemperature = /\b(hot|cold|temperature)\b/.test(text);
  const isPercentOnlyMessage = /^\s*\d{1,3}\s*%?\s*$/.test(text.trim());
  const explicitSugarPercentMatch = text.match(/\b(\d{1,3})\s*%?\s*(?:sugar)?\b/);
  const explicitSugarPercent =
    explicitSugarPercentMatch && (mentionsSugarWord || isPercentOnlyMessage || /%/.test(explicitSugarPercentMatch[0]))
      ? Number.parseInt(explicitSugarPercentMatch[1], 10)
      : null;
  const mentionsSugar = mentionsSugarWord || Number.isFinite(explicitSugarPercent);

  if (/\blarge\b|\b20\s*oz\b/.test(text)) {
    updates.size = "Large";
    applied.push("size Large");
  } else if (/\bregular\b|\bsmall\b|\b16\s*oz\b/.test(text)) {
    updates.size = "Regular";
    applied.push("size Regular");
  }

  if (/\bhot\b/.test(text)) {
    updates.temperature = "Hot";
    applied.push("temperature Hot");
  } else if (/\bcold\b/.test(text)) {
    updates.temperature = "Cold";
    applied.push("temperature Cold");
  }

  if (/\bno ice\b/.test(text)) {
    const noIce = findModifierByTokens(modifiers, "Ice Level", ["no ice", "0 ice"]);
    if (noIce) {
      updates.ice = noIce.name;
      applied.push(`ice ${noIce.name}`);
    }
  } else if (/\bless ice\b|\blight ice\b/.test(text)) {
    const lessIce = findModifierByTokens(modifiers, "Ice Level", ["less ice", "light ice", "50", "low"]);
    if (lessIce) {
      updates.ice = lessIce.name;
      applied.push(`ice ${lessIce.name}`);
    }
  } else if (/\bregular ice\b|\bnormal ice\b/.test(text)) {
    const regularIce = findModifierByTokens(modifiers, "Ice Level", ["regular ice", "normal ice", "100"]);
    if (regularIce) {
      updates.ice = regularIce.name;
      applied.push(`ice ${regularIce.name}`);
    }
  }

  // Hot drinks should always be no-ice for kiosk consistency.
  if (updates.temperature === "Hot") {
    const noIce = findModifierByTokens(modifiers, "Ice Level", ["no ice", "0 ice"]);
    if (noIce) {
      updates.ice = noIce.name;
      if (!applied.some((entry) => entry.startsWith("ice "))) {
        applied.push(`ice ${noIce.name}`);
      }
    }
  }

  if (Number.isFinite(explicitSugarPercent) && explicitSugarPercent >= 0 && explicitSugarPercent <= 100) {
    const byPercent = findSugarOptionByPercent(modifiers, explicitSugarPercent);
    if (byPercent) {
      updates.sugar = byPercent.name;
      applied.push(`sugar ${byPercent.name}`);
    }
  } else if (/\bno sugar\b|\b0% sugar\b/.test(text)) {
    const noSugar = findModifierByTokens(modifiers, "Sugar Level", ["0%"]);
    if (noSugar) {
      updates.sugar = noSugar.name;
      applied.push(`sugar ${noSugar.name}`);
    }
  } else if (/\b25% sugar\b|\bquarter sugar\b/.test(text)) {
    const lightSugar = findModifierByTokens(modifiers, "Sugar Level", ["25%"]);
    if (lightSugar) {
      updates.sugar = lightSugar.name;
      applied.push(`sugar ${lightSugar.name}`);
    }
  } else if (/\bless sugar\b|\blow sugar\b|\bhalf sugar\b|\b50% sugar\b/.test(text)) {
    const lessSugar = findModifierByTokens(modifiers, "Sugar Level", ["50%", "half", "less", "light"]);
    if (lessSugar) {
      updates.sugar = lessSugar.name;
      applied.push(`sugar ${lessSugar.name}`);
    }
  } else if (/\b75% sugar\b|\bthree quarter sugar\b|\bthree quarters sugar\b/.test(text)) {
    const highSugar = findModifierByTokens(modifiers, "Sugar Level", ["75%"]);
    if (highSugar) {
      updates.sugar = highSugar.name;
      applied.push(`sugar ${highSugar.name}`);
    }
  } else if (/\bregular sugar\b|\bnormal sugar\b|\bfull sugar\b|\b100% sugar\b/.test(text)) {
    const regularSugar = findModifierByTokens(modifiers, "Sugar Level", ["100%", "regular", "normal", "full"]);
    if (regularSugar) {
      updates.sugar = regularSugar.name;
      applied.push(`sugar ${regularSugar.name}`);
    }
  }

  if (mentionsSize && !("size" in updates)) {
    invalidFields.push("size");
  }
  if (mentionsTemperature && !("temperature" in updates)) {
    invalidFields.push("temperature");
  }
  if (mentionsIce && !("ice" in updates)) {
    invalidFields.push("ice");
  }
  if (mentionsSugar && !("sugar" in updates)) {
    invalidFields.push("sugar");
  }
  if (mentionsAmbiguousMoreSugar && !("sugar" in updates) && !invalidFields.includes("sugar")) {
    invalidFields.push("sugar");
  }

  const toppingOptions = modifiers.filter((entry) => entry.type === "Topping");
  const selectedToppings = toppingOptions
    .filter((entry) => {
      const key = normalizeLookup(entry.name);
      return key && normalizedText.includes(key);
    })
    .map((entry) => entry.name);

  if (selectedToppings.length > 0) {
    updates.toppings = selectedToppings;
    applied.push(`toppings ${selectedToppings.join(", ")}`);
  } else if (/\brandom topping\b|\bany topping\b|\bsurprise me\b/.test(text) && toppingOptions.length > 0) {
    const randomTopping = toppingOptions[Math.floor(Math.random() * toppingOptions.length)];
    updates.toppings = [randomTopping.name];
    applied.push(`toppings ${randomTopping.name}`);
  }

  if (/\b(remove|take off|without|no)\b/.test(text)) {
    const toppingsToRemove = toppingOptions
      .filter((entry) => {
        const key = normalizeLookup(entry.name);
        return key && normalizedText.includes(key);
      })
      .map((entry) => entry.name);

    if (toppingsToRemove.length > 0) {
      removeToppings.push(...toppingsToRemove);
      updates.removeToppings = toppingsToRemove;
      applied.push(`removed toppings ${toppingsToRemove.join(", ")}`);
    }
  }

  return { updates, applied, removeToppings, invalidFields, asksToppingOptions };
}

function hasModificationCue(message) {
  const text = String(message || "").toLowerCase();
  return /\b(size|oz|ice|sugar|sweet|topping|toppings|boba|pearls|jelly|pudding|aloe|hot|cold|regular|large|small)\b/.test(
    text
  );
}

function listModifierOptions(modifiers, type) {
  return modifiers
    .filter((entry) => entry.type === type)
    .map((entry) => cleanText(entry.name, 40))
    .filter(Boolean);
}

function buildInvalidModificationFollowUp(invalidFields, modifiers, isSpanish) {
  const parts = [];
  if (invalidFields.includes("temperature")) {
    parts.push(
      pickLangText(
        isSpanish,
        "Temperature options: Cold, Hot.",
        "Opciones de temperatura: Cold, Hot."
      )
    );
  }
  if (invalidFields.includes("size")) {
    parts.push(
      pickLangText(
        isSpanish,
        "Size options: Regular, Large.",
        "Opciones de tamano: Regular, Large."
      )
    );
  }
  if (invalidFields.includes("ice")) {
    const options = listModifierOptions(modifiers, "Ice Level");
    if (options.length > 0) {
      parts.push(
        pickLangText(
          isSpanish,
          `Ice options: ${options.join(", ")}.`,
          `Opciones de hielo: ${options.join(", ")}.`
        )
      );
    }
  }
  if (invalidFields.includes("sugar")) {
    const options = listModifierOptions(modifiers, "Sugar Level");
    if (options.length > 0) {
      parts.push(
        pickLangText(
          isSpanish,
          `Sugar options: ${options.join(", ")}.`,
          `Opciones de azucar: ${options.join(", ")}.`
        )
      );
    }
  }

  if (parts.length === 0) return "";
  return pickLangText(
    isSpanish,
    `I could not apply one of your requested modifications. Please choose from available options. ${parts.join(" ")}`,
    `No pude aplicar una de tus modificaciones solicitadas. Elige entre las opciones disponibles. ${parts.join(" ")}`
  );
}

function buildToppingOptionsFollowUp(modifiers, isSpanish) {
  const toppingOptions = listModifierOptions(modifiers, "Topping");
  if (toppingOptions.length === 0) return "";
  return pickLangText(
    isSpanish,
    `Available toppings: ${toppingOptions.join(", ")}.`,
    `Toppings disponibles: ${toppingOptions.join(", ")}.`
  );
}

function hasAddIntent(message) {
  const text = String(message || "").toLowerCase();
  return /\b(add|order|get|want|i'll take|ill take|put)\b/.test(text);
}

function hasRecommendationIntent(message) {
  const text = String(message || "").toLowerCase();
  return (
    /\b(recommend|suggest|best|good|what should i (get|order)|what do you recommend)\b/.test(text) ||
    /\b(i want|i'd like|im craving|i am craving|looking for|something)\b[\s\S]*\b(salty|savory|sweet|creamy|fruity|refreshing)\b[\s\S]*\b(drink|drinks|tea|teas)?\b/.test(
      text
    )
  );
}

function hasAddThatIntent(message) {
  const text = String(message || "").toLowerCase();
  return hasAddIntent(text) && /\b(that|it|this|one)\b/.test(text);
}

function hasRandomAddIntent(message) {
  const text = String(message || "").toLowerCase();
  return hasAddIntent(text) && /\b(random|surprise|anything|whatever|any drink)\b/.test(text);
}

function hasRemoveCartIntent(message) {
  const text = String(message || "").toLowerCase();
  return /\b(remove|delete|cancel|take out|take off)\b/.test(text);
}

function hasDisallowedManagementIntent(message) {
  const text = String(message || "").toLowerCase();
  const hasAdminVerb = /\b(remove|delete|edit|update|change|set|disable|enable|add)\b/.test(text);
  const hasAdminTarget = /\b(menu|database|db|inventory|modifier|price|item availability|available)\b/.test(text);
  return hasAdminVerb && hasAdminTarget;
}

function hasCartCue(message) {
  const text = String(message || "").toLowerCase();
  return /\b(from cart|from my cart|cart|order|item|drink)\b/.test(text);
}

function hasIngredientUsageIntent(message) {
  const text = String(message || "").toLowerCase();
  return (
    /\b(which|what)\b[\s\S]*\b(drink|drinks|menu item|menu items|tea|teas)\b[\s\S]*\b(use|uses|have|has|contain|contains|with)\b/.test(text) ||
    /\b(drinks?|items?|teas?)\s+(with|containing)\b/.test(text) ||
    /\b(use|have|contain)\b[\s\S]*\b(leaves|syrup|powder|milk|ingredient|ingredients)\b/.test(text)
  );
}

function hasCustomizationOptionsIntent(message) {
  const text = String(message || "").toLowerCase();
  return /\b(what can i modify|what can be modified|what can i customize|customization options|modification options|what are the options|options to customize)\b/.test(
    text
  );
}

function extractIngredientTarget(message) {
  const text = cleanText(message, MAX_MESSAGE_LENGTH);
  const patterns = [
    /\b(?:which|what)\s+(?:drinks?|items?|menu items?|teas?)\s+(?:use|have|contain|with)\s+(.+?)(?:\?|$)/i,
    /\b(?:drinks?|items?|teas?)\s+(?:with|containing)\s+(.+?)(?:\?|$)/i,
    /\b(?:use|have|contain)\s+(.+?)\s+(?:in|inside)\s+(?:drinks?|items?|teas?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return cleanText(match[1], 100).replace(/^(the|a|an|any)\s+/i, "");
    }
  }

  return null;
}

function hasExplicitCartReference(message) {
  const text = String(message || "").toLowerCase();
  return hasCartCue(text) || /\b(item\s*\d+|last|latest|most recent|first|in my cart)\b/.test(text);
}

function formatCustomizationOptionsReply({ itemName, modifiers, isSpanish }) {
  const iceOptions = listModifierOptions(modifiers, "Ice Level");
  const sugarOptions = listModifierOptions(modifiers, "Sugar Level");
  const toppingOptions = listModifierOptions(modifiers, "Topping");
  const drinkLabel = itemName || pickLangText(isSpanish, "this drink", "esta bebida");

  return pickLangText(
    isSpanish,
    `For ${drinkLabel}, you can modify: Size (Regular - 16oz, Large - 20oz), Ice Level (${iceOptions.join(
      ", "
    )}), Sugar Level (${sugarOptions.join(", ")}), and Toppings (${toppingOptions.join(
      ", "
    )}). Would you like any changes?`,
    `Para ${drinkLabel}, puedes modificar: Tamano (Regular - 16oz, Large - 20oz), Nivel de hielo (${iceOptions.join(
      ", "
    )}), Nivel de azucar (${sugarOptions.join(", ")}), y Toppings (${toppingOptions.join(
      ", "
    )}). Quieres hacer algun cambio?`
  );
}

function findRequestedMenuItem(message, items) {
  const normalizedMessage = normalizeLookup(message);
  if (!normalizedMessage) return null;

  const candidates = items
    .map((item) => ({
      item,
      key: normalizeLookup(item.name),
    }))
    .filter((entry) => entry.key && normalizedMessage.includes(entry.key))
    .sort((a, b) => b.key.length - a.key.length);

  return candidates.length > 0 ? candidates[0].item : null;
}

const GENERIC_DRINK_TOKENS = new Set(["tea", "teas", "drink", "drinks", "milk", "fruit", "smoothie", "boba"]);

function tokenizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractDrinkQueryText(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/\b(i|me|my|please|can|could|would|like|want|to|a|an|the|and|just)\b/g, " ")
    .replace(/\b(add|order|get|put|give|take)\b/g, " ")
    .replace(/\b(that|it|this|one)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreItemMatchFromTokens(queryTokens, itemName) {
  const itemTokens = tokenizeWords(itemName);
  const itemSet = new Set(itemTokens);
  let strongMatches = 0;
  let genericMatches = 0;

  for (const token of queryTokens) {
    if (!itemSet.has(token)) continue;
    if (GENERIC_DRINK_TOKENS.has(token)) genericMatches += 1;
    else strongMatches += 1;
  }

  return {
    strongMatches,
    genericMatches,
    totalScore: strongMatches * 3 + genericMatches,
  };
}

function resolveRequestedMenuItem(message, items) {
  const exact = findRequestedMenuItem(message, items);
  if (exact) {
    return { exactItem: exact, suggestion: null };
  }

  const queryTokens = tokenizeWords(extractDrinkQueryText(message));
  if (queryTokens.length === 0) {
    return { exactItem: null, suggestion: null };
  }

  const ranked = items
    .map((item) => ({ item, ...scoreItemMatchFromTokens(queryTokens, item.name) }))
    .filter((entry) => entry.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore || b.strongMatches - a.strongMatches || a.item.name.localeCompare(b.item.name));

  if (ranked.length === 0) return { exactItem: null, suggestion: null };

  const best = ranked[0];
  const second = ranked[1];
  const confidentlyExact = best.strongMatches > 0 && (!second || best.totalScore >= second.totalScore + 3);

  if (confidentlyExact) {
    return { exactItem: best.item, suggestion: null };
  }

  return { exactItem: null, suggestion: best.item };
}

function pickRecommendation(message, items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const text = String(message || "").toLowerCase();

  const categoryHints = [
    { token: "smoothie", includes: "smoothie" },
    { token: "milk", includes: "milk" },
    { token: "fruit", includes: "fruit" },
    { token: "special", includes: "special" },
  ];

  for (const hint of categoryHints) {
    if (text.includes(hint.token)) {
      const candidate = items.find((item) => String(item.category || "").toLowerCase().includes(hint.includes));
      if (candidate) return candidate;
    }
  }

  const flavorToken = Object.keys(TASTE_NOTES).find((token) => text.includes(token));
  if (flavorToken) {
    const byFlavor = items.find((item) => normalizeLookup(item.name).includes(flavorToken));
    if (byFlavor) return byFlavor;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function pickPreferenceRecommendations(message, items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const text = String(message || "").toLowerCase();

  const scored = items
    .map((item) => {
      const name = normalizeLookup(item.name);
      const category = normalizeLookup(item.category);
      let score = 0;

      if (/\b(salty|savory)\b/.test(text)) {
        if (name.includes("cheesefoam")) score += 6;
        if (category.includes("special")) score += 2;
        if (name.includes("blacksesame")) score += 1;
      }

      if (/\b(sweet|creamy)\b/.test(text)) {
        if (category.includes("milk")) score += 3;
        if (name.includes("brownsugar") || name.includes("oreo")) score += 2;
      }

      if (/\b(fruity|refreshing)\b/.test(text)) {
        if (category.includes("fruit")) score += 3;
        if (name.includes("tea")) score += 1;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

  return scored.slice(0, 3).map((entry) => entry.item);
}

function findRequestedCartItem(message, cart, pendingItem) {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  const text = String(message || "").toLowerCase();
  const normalizedMessage = normalizeLookup(text);

  const numbered = text.match(/\bitem\s*(\d+)\b/);
  if (numbered) {
    const position = Number.parseInt(numbered[1], 10) - 1;
    if (position >= 0 && position < cart.length) {
      return cart[position];
    }
  }

  if (/\b(last|latest|most recent)\b/.test(text)) {
    return cart[cart.length - 1];
  }
  if (/\b(first)\b/.test(text)) {
    return cart[0];
  }

  const byName = cart
    .map((entry) => ({
      entry,
      key: normalizeLookup(entry.itemName),
    }))
    .filter((entry) => entry.key && normalizedMessage.includes(entry.key))
    .sort((a, b) => b.key.length - a.key.length);
  if (byName.length > 0) {
    return byName[0].entry;
  }

  if (/\b(it|that|this)\b/.test(text) && pendingItem) {
    const pendingName = normalizeLookup(pendingItem.name);
    const match = [...cart]
      .reverse()
      .find((entry) => normalizeLookup(entry.itemName) === pendingName);
    if (match) return match;
  }

  if (/\b(it|that|this|current)\b/.test(text) && cart.length === 1) {
    return cart[0];
  }

  return null;
}

function normalizePendingItem(rawPendingItem, items) {
  if (!rawPendingItem || typeof rawPendingItem !== "object") return null;

  const byId = items.find((item) => Number(item.id) === Number(rawPendingItem.itemId));
  if (byId) return byId;

  const pendingName = normalizeLookup(rawPendingItem.itemName);
  if (!pendingName) return null;
  return items.find((item) => normalizeLookup(item.name) === pendingName) || null;
}

function createAssistantActionReplyForAdd(item) {
  const itemPrice = Number(item.price || 0).toFixed(2);
  return `Added ${item.name} to your cart with default settings (Regular size, Regular Ice, 100% Sugar, no toppings). Current item price is $${itemPrice}. Do you want any modifications?`;
}

function pickLangText(isSpanish, englishText, spanishText) {
  return isSpanish ? spanishText : englishText;
}

function normalizeCart(rawCart) {
  if (!Array.isArray(rawCart)) return [];

  return rawCart.slice(0, 20).map((item, index) => ({
    cartIndex: Number.isInteger(item.cartIndex) ? item.cartIndex : index,
    itemId: Number(item.itemId || 0),
    itemName: cleanText(item.itemName, 80),
    size: cleanText(item.size, 40),
    ice: cleanText(item.ice, 40),
    sugar: cleanText(item.sugar, 40),
    toppings: Array.isArray(item.toppings) ? item.toppings.map((entry) => cleanText(entry, 40)).slice(0, 6) : [],
    totalPrice: Number(item.totalPrice || 0),
  }));
}

async function loadMenuContext() {
  const [itemsResult, modifiersResult, ingredientResult] = await Promise.all([
    getPool().query(`
      SELECT menu_item_id, name, category, base_price
      FROM "Menu_Item"
      WHERE is_available = TRUE
      ORDER BY category, name
    `),
    getPool().query(`
      SELECT modifier_id, name, price_delta, modifier_type
      FROM "Menu_Item_Modifications"
      WHERE is_available = TRUE
      ORDER BY modifier_type, name
    `),
    getPool().query(`
      SELECT mi.menu_item_id, ii.name AS ingredient_name
      FROM "Menu_Item" mi
      LEFT JOIN "Menu_Inventory" miv
        ON miv.menu_item_id = mi.menu_item_id
      LEFT JOIN "Inventory_Item" ii
        ON ii.inventory_item_id = miv.inventory_item_id
      WHERE mi.is_available = TRUE
      ORDER BY mi.menu_item_id, ii.name
    `),
  ]);

  const ingredientsByMenuId = new Map();
  for (const row of ingredientResult.rows) {
    const menuId = Number(row.menu_item_id);
    const ingredientName = cleanText(row.ingredient_name, 80);
    if (!ingredientName) continue;
    const existing = ingredientsByMenuId.get(menuId) || [];
    if (!existing.includes(ingredientName)) existing.push(ingredientName);
    ingredientsByMenuId.set(menuId, existing);
  }

  const items = itemsResult.rows.map((row) => ({
    id: row.menu_item_id,
    name: row.name,
    category: row.category,
    price: Number(row.base_price),
    ingredients: ingredientsByMenuId.get(Number(row.menu_item_id)) || [],
  }));

  const modifiers = modifiersResult.rows.map((row) => ({
    id: row.modifier_id,
    name: row.name,
    type: row.modifier_type,
    priceDelta: Number(row.price_delta),
  }));

  return { items, modifiers };
}

function buildContextText(menuItems, modifiers, cart, pendingItem) {
  const itemsText = menuItems
    .map((item) => `- ${item.name} | category: ${item.category} | base_price: $${item.price.toFixed(2)}`)
    .join("\n");

  const modifiersText = modifiers
    .map((modifier) => `- ${modifier.name} | type: ${modifier.type} | price_delta: $${modifier.priceDelta.toFixed(2)}`)
    .join("\n");

  const cartText =
    cart.length === 0
      ? "Customer cart is currently empty."
      : cart
          .map(
            (entry, index) =>
              `${index + 1}. ${entry.itemName} | size: ${entry.size || "N/A"} | ice: ${entry.ice || "N/A"} | sugar: ${
                entry.sugar || "N/A"
              } | toppings: ${entry.toppings.length ? entry.toppings.join(", ") : "none"} | item_total: $${Number(
                entry.totalPrice || 0
              ).toFixed(2)}`
          )
          .join("\n");

  const pendingText = pendingItem
    ? `${pendingItem.name} | category: ${pendingItem.category} | base_price: $${Number(pendingItem.price).toFixed(2)}`
    : "none";

  return `MENU ITEMS:
${itemsText || "- none"}

AVAILABLE MODIFIERS:
${modifiersText || "- none"}

CURRENT CART:
${cartText}

PENDING DRINK FOR MODIFICATION FOLLOW-UP:
${pendingText}`;
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY on server." }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const message = cleanText(body.message, MAX_MESSAGE_LENGTH);
    const requestedLanguage = String(body.language || "en").toLowerCase() === "es" ? "es" : "en";
    const isSpanish = requestedLanguage === "es";
    const cart = normalizeCart(body.cart);

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
    }

    const { items, modifiers } = await loadMenuContext();
    const pendingItem = normalizePendingItem(body.pendingItem, items);
    const parsedModification = parseModificationRequest(message, modifiers);

    if (hasDisallowedManagementIntent(message)) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          "I can help with cart, menu info, and drink customizations only. I cannot change menu records or system settings.",
          "Puedo ayudarte con carrito, menu y personalizacion de bebidas. No puedo cambiar registros del menu ni configuraciones del sistema."
        ),
      });
    }

    if (hasIngredientUsageIntent(message)) {
      const ingredientCatalog = Array.from(
        new Set(
          items
            .flatMap((item) => (Array.isArray(item.ingredients) ? item.ingredients : []))
            .filter(Boolean)
        )
      ).map((name) => ({ name }));

      const requestedIngredient = extractIngredientTarget(message);
      const matchedIngredient =
        (requestedIngredient && findBestByPhrase(requestedIngredient, ingredientCatalog, (entry) => entry.name)) ||
        findBestByPhrase(message, ingredientCatalog, (entry) => entry.name);

      if (!matchedIngredient) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            "I could not match that ingredient to our current recipe list. Please try a specific ingredient name.",
            "No pude relacionar ese ingrediente con nuestra lista actual de recetas. Intenta con un nombre de ingrediente mas especifico."
          ),
        });
      }

      const ingredientKey = normalizeLookup(matchedIngredient.name);
      const matchingDrinks = items
        .filter((item) => (item.ingredients || []).some((name) => normalizeLookup(name) === ingredientKey))
        .map((item) => item.name);

      if (matchingDrinks.length === 0) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `None of our currently available drinks use ${matchedIngredient.name}.`,
            `Ninguna bebida disponible actualmente usa ${matchedIngredient.name}.`
          ),
        });
      }

      const listed = matchingDrinks.slice(0, 8).join(", ");
      const suffix =
        matchingDrinks.length > 8
          ? pickLangText(isSpanish, `, and ${matchingDrinks.length - 8} more.`, `, y ${matchingDrinks.length - 8} mas.`)
          : ".";
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          `Drinks using ${matchedIngredient.name}: ${listed}${suffix}`,
          `Bebidas que usan ${matchedIngredient.name}: ${listed}${suffix}`
        ),
      });
    }

    if (hasCustomizationOptionsIntent(message)) {
      const referencedItem = findRequestedMenuItem(message, items) || pendingItem;
      return NextResponse.json({
        ok: true,
        reply: formatCustomizationOptionsReply({
          itemName: referencedItem?.name || "",
          modifiers,
          isSpanish,
        }),
      });
    }

    const removeByReferenceCue = /\b(item\s*\d+|last|latest|most recent|first)\b/i.test(message);
    const explicitCartReference = hasExplicitCartReference(message) || removeByReferenceCue;
    const invalidModificationPrompt =
      parsedModification.invalidFields?.length > 0
        ? buildInvalidModificationFollowUp(parsedModification.invalidFields, modifiers, isSpanish)
        : "";
    const toppingOptionsPrompt = parsedModification.asksToppingOptions
      ? buildToppingOptionsFollowUp(modifiers, isSpanish)
      : "";
    const pendingModificationMode =
      Boolean(pendingItem) &&
      !explicitCartReference &&
      (parsedModification.applied.length > 0 || parsedModification.invalidFields?.length > 0 || hasModificationCue(message));

    if (pendingItem && parsedModification.removeToppings?.length > 0 && !explicitCartReference) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          `Updated ${pendingItem.name}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""} Do you want any other modifications?`,
          `Se actualizo ${pendingItem.name}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""} Quieres alguna otra modificacion?`
        ),
        action: {
          type: "UPDATE_PENDING_ITEM",
          updates: parsedModification.updates,
        },
      });
    }

    if (!pendingItem && parsedModification.removeToppings?.length > 0 && !explicitCartReference) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          "Tell me which cart item to update, like 'remove boba from item 2'.",
          "Dime que articulo del carrito quieres actualizar, por ejemplo: 'quitar boba del articulo 2'."
        ),
      });
    }

    if (
      parsedModification.applied.length > 0 &&
      (!pendingItem || explicitCartReference)
    ) {
      const cartItemToUpdate = findRequestedCartItem(message, cart, pendingItem) || (!pendingItem && cart.length === 1 ? cart[0] : null);
      if (cartItemToUpdate) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `Updated ${cartItemToUpdate.itemName}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""}`,
            `Se actualizo ${cartItemToUpdate.itemName}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""}`
          ),
          action: {
            type: "UPDATE_CART_ITEM",
            cartIndex: cartItemToUpdate.cartIndex,
            itemId: cartItemToUpdate.itemId,
            itemName: cartItemToUpdate.itemName,
            updates: parsedModification.updates,
          },
        });
      }

      if (!pendingItem && cart.length > 1) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            "Tell me which cart item to modify by name or item number.",
            "Dime que articulo del carrito quieres modificar por nombre o numero."
          ),
        });
      }
    }

    if (parsedModification.applied.length === 0 && parsedModification.invalidFields?.length > 0) {
      if (!pendingItem && cart.length > 1) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `Tell me which cart item you want to modify by name or item number. ${invalidModificationPrompt}`,
            `Dime que articulo del carrito quieres modificar por nombre o numero. ${invalidModificationPrompt}`
          ),
        });
      }

      return NextResponse.json({
        ok: true,
        reply: `${invalidModificationPrompt}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""}`.trim(),
      });
    }

    if (parsedModification.applied.length === 0 && parsedModification.asksToppingOptions) {
      return NextResponse.json({
        ok: true,
        reply: toppingOptionsPrompt,
      });
    }

    if (hasRemoveCartIntent(message) && (explicitCartReference || !pendingItem)) {
      const cartItem = findRequestedCartItem(message, cart, pendingItem);
      if (cartItem) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `Removed ${cartItem.itemName} from your cart.`,
            `Se elimino ${cartItem.itemName} de tu carrito.`
          ),
          action: {
            type: "REMOVE_CART_ITEM",
            cartIndex: cartItem.cartIndex,
            itemId: cartItem.itemId,
            itemName: cartItem.itemName,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          "I could not find that drink in your cart. Tell me the drink name or item number to remove.",
          "No pude encontrar esa bebida en tu carrito. Dime el nombre de la bebida o el numero de articulo para eliminar."
        ),
      });
    }

    const tasteTarget = extractTasteTarget(message);
    if (tasteTarget) {
      const matchedItem = findBestByPhrase(tasteTarget, items, (entry) => entry.name);
      const matchedModifier = findBestByPhrase(tasteTarget, modifiers, (entry) => entry.name);
      return NextResponse.json({
        ok: true,
        reply: buildTasteReply(tasteTarget, matchedItem, matchedModifier),
      });
    }

    if (pendingItem && isNoModificationMessage(message)) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          `Got it. Keeping ${pendingItem.name} with default settings. Your cart is updated.`,
          `Entendido. Mantendremos ${pendingItem.name} con configuracion predeterminada. Tu carrito se actualizo.`
        ),
        action: { type: "CLEAR_PENDING_ITEM" },
      });
    }

    if (pendingItem && isStartModificationMessage(message)) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          `Sure. For ${pendingItem.name}, tell me your preferred size, temperature, ice level, sugar level, and toppings. If you choose hot, I will set no ice automatically.`,
          `Claro. Para ${pendingItem.name}, dime tu tamano, temperatura, nivel de hielo, nivel de azucar y toppings preferidos. Si eliges caliente, pondre sin hielo automaticamente.`
        ),
      });
    }

    if (hasRandomAddIntent(message) && items.length > 0) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          createAssistantActionReplyForAdd(randomItem),
          `Se agrego ${randomItem.name} a tu carrito con configuracion predeterminada (tamano Regular, hielo regular, 100% azucar, sin toppings). El precio actual es $${Number(randomItem.price || 0).toFixed(2)}. Quieres alguna modificacion?`
        ),
        action: {
          type: "ADD_DEFAULT_ITEM",
          itemId: randomItem.id,
          itemName: randomItem.name,
        },
      });
    }

    const explicitAddIntent = hasAddIntent(message) && !pendingModificationMode;
    const addResolution = explicitAddIntent ? resolveRequestedMenuItem(message, items) : { exactItem: null, suggestion: null };

    if (addResolution.exactItem) {
      const requestedItem = addResolution.exactItem;
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          createAssistantActionReplyForAdd(requestedItem),
          `Se agrego ${requestedItem.name} a tu carrito con configuracion predeterminada (tamano Regular, hielo regular, 100% azucar, sin toppings). Quieres alguna modificacion?`
        ),
        action: {
          type: "ADD_DEFAULT_ITEM",
          itemId: requestedItem.id,
          itemName: requestedItem.name,
        },
      });
    }

    if (explicitAddIntent && addResolution.suggestion) {
      const suggestedItem = addResolution.suggestion;
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          `I could not find that exact drink. Did you mean ${suggestedItem.name}?`,
          `No encontre esa bebida exacta. Quisiste decir ${suggestedItem.name}?`
        ),
        action: {
          type: "SET_PENDING_ITEM",
          itemId: suggestedItem.id,
          itemName: suggestedItem.name,
        },
      });
    }

    if (pendingItem && hasAddThatIntent(message)) {
      return NextResponse.json({
        ok: true,
        reply: pickLangText(
          isSpanish,
          createAssistantActionReplyForAdd(pendingItem),
          `Se agrego ${pendingItem.name} a tu carrito con configuracion predeterminada (tamano Regular, hielo regular, 100% azucar, sin toppings). Quieres alguna modificacion?`
        ),
        action: {
          type: "ADD_DEFAULT_ITEM",
          itemId: pendingItem.id,
          itemName: pendingItem.name,
        },
      });
    }

    if (pendingItem) {
      if (parsedModification.applied.length > 0) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `Updated ${pendingItem.name}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""} Do you want any other modifications?`,
            `Se actualizo ${pendingItem.name}: ${parsedModification.applied.join(", ")}.${invalidModificationPrompt ? ` ${invalidModificationPrompt}` : ""}${toppingOptionsPrompt ? ` ${toppingOptionsPrompt}` : ""} Quieres alguna otra modificacion?`
          ),
          action: {
            type: "UPDATE_PENDING_ITEM",
            updates: parsedModification.updates,
          },
        });
      }

      if (/\b(remove|take off|without|no)\b/.test(String(message || "").toLowerCase())) {
        const normalizedMessage = normalizeLookup(message);
        const normalizedItemName = normalizeLookup(pendingItem.name);
        if (normalizedItemName && normalizedMessage.includes(normalizedItemName.slice(0, Math.min(normalizedItemName.length, 12)))) {
          return NextResponse.json({
            ok: true,
            reply: pickLangText(
              isSpanish,
              `I cannot remove the main flavor from ${pendingItem.name}. You can choose a different drink if you want another flavor.`,
              `No puedo eliminar el sabor principal de ${pendingItem.name}. Puedes elegir otra bebida si quieres otro sabor.`
            ),
          });
        }
      }
    }

    if (hasRecommendationIntent(message)) {
      const preferenceSuggestions = pickPreferenceRecommendations(message, items);
      if (preferenceSuggestions.length > 0) {
        const [first, ...rest] = preferenceSuggestions;
        const names = [first.name, ...rest.map((entry) => entry.name)].join(", ");
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `For that flavor profile, try: ${names}. Want me to add ${first.name}?`,
            `Para ese perfil de sabor, prueba: ${names}. Quieres que agregue ${first.name}?`
          ),
          action: {
            type: "SET_PENDING_ITEM",
            itemId: first.id,
            itemName: first.name,
          },
        });
      }

      const recommendation = pickRecommendation(message, items);
      if (recommendation) {
        return NextResponse.json({
          ok: true,
          reply: pickLangText(
            isSpanish,
            `I recommend ${recommendation.name}. It is a great choice. Want me to add it to your cart?`,
            `Te recomiendo ${recommendation.name}. Es una gran opcion. Quieres que la agregue a tu carrito?`
          ),
          action: {
            type: "SET_PENDING_ITEM",
            itemId: recommendation.id,
            itemName: recommendation.name,
          },
        });
      }
    }

    const contextText = buildContextText(items, modifiers, cart, pendingItem);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      max_output_tokens: 220,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are the bubble tea kiosk assistant for ordering help.\n" +
                "Rules:\n" +
                "1) Only use the provided MENU ITEMS and AVAILABLE MODIFIERS.\n" +
                "2) Never invent drinks, toppings, prices, ingredients, or policies.\n" +
                "3) If info is missing, say you do not have that information.\n" +
                "4) Keep responses concise and helpful for ordering.\n" +
                "5) Stay in scope: menu info, drink recommendations, customization, and order guidance.\n" +
                "6) Ask if the customer wants modifications when discussing a specific drink (size, ice, sugar, toppings).\n" +
                "7) Never claim an item was added to cart unless it is already reflected in CURRENT CART context.\n" +
                "8) Output plain text only. Do not use markdown formatting like **bold**, bullets, or code ticks.\n" +
                "9) If there is a pending drink in context and the user says short replies like 'normal', treat it as keeping default modifications.\n" +
                "10) If a user asks anything outside menu information, drink recommendations, toppings, customization, or ordering help, respond exactly: I do not have information on that. I can help with menu and ordering questions.\n" +
                "11) If requested details are missing from provided context, respond exactly: I do not have that information.\n" +
                `12) Reply language must be ${isSpanish ? "Spanish" : "English"}.`,
            },
          ],
        },
        {
          role: "system",
          content: [{ type: "input_text", text: contextText }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      ],
    });

    const reply =
      toPlainAssistantText(response.output_text || "", 2000) ||
      "I can help with menu and ordering. What would you like to choose?";

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 502;
    const detail = error?.error?.message || error?.message || "Unknown assistant error";
    const code = error?.error?.code || error?.code || "ASSISTANT_ERROR";

    console.error("Assistant route error:", {
      status,
      code,
      detail,
    });

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          ok: false,
          error: "Assistant is temporarily unavailable. Please try again.",
          detail,
          code,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Assistant is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}
