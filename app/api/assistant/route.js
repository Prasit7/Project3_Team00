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

function parseModificationRequest(message, modifiers) {
  const text = String(message || "").toLowerCase();
  const normalizedText = normalizeLookup(text);
  const updates = {};
  const applied = [];
  const removeToppings = [];

  if (/\blarge\b/.test(text)) {
    updates.size = "Large";
    applied.push("size Large");
  } else if (/\bregular\b|\bsmall\b/.test(text)) {
    updates.size = "Regular";
    applied.push("size Regular");
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

  if (/\bno sugar\b|\b0% sugar\b/.test(text)) {
    const noSugar = findModifierByTokens(modifiers, "Sugar Level", ["0%"]);
    if (noSugar) {
      updates.sugar = noSugar.name;
      applied.push(`sugar ${noSugar.name}`);
    }
  } else if (/\bless sugar\b|\blow sugar\b|\bhalf sugar\b|\b50% sugar\b/.test(text)) {
    const lessSugar = findModifierByTokens(modifiers, "Sugar Level", ["50%", "half", "less", "light"]);
    if (lessSugar) {
      updates.sugar = lessSugar.name;
      applied.push(`sugar ${lessSugar.name}`);
    }
  } else if (/\bregular sugar\b|\bnormal sugar\b|\bfull sugar\b|\b100% sugar\b/.test(text)) {
    const regularSugar = findModifierByTokens(modifiers, "Sugar Level", ["100%", "regular", "normal", "full"]);
    if (regularSugar) {
      updates.sugar = regularSugar.name;
      applied.push(`sugar ${regularSugar.name}`);
    }
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

  return { updates, applied, removeToppings };
}

function hasAddIntent(message) {
  const text = String(message || "").toLowerCase();
  return /\b(add|order|get|want|i'll take|ill take|put)\b/.test(text);
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

function normalizeCart(rawCart) {
  if (!Array.isArray(rawCart)) return [];

  return rawCart.slice(0, 8).map((item) => ({
    itemName: cleanText(item.itemName, 80),
    size: cleanText(item.size, 40),
    ice: cleanText(item.ice, 40),
    sugar: cleanText(item.sugar, 40),
    toppings: Array.isArray(item.toppings) ? item.toppings.map((entry) => cleanText(entry, 40)).slice(0, 6) : [],
    totalPrice: Number(item.totalPrice || 0),
  }));
}

async function loadMenuContext() {
  const [itemsResult, modifiersResult] = await Promise.all([
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
  ]);

  const items = itemsResult.rows.map((row) => ({
    id: row.menu_item_id,
    name: row.name,
    category: row.category,
    price: Number(row.base_price),
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
    const cart = normalizeCart(body.cart);

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
    }

    const { items, modifiers } = await loadMenuContext();
    const pendingItem = normalizePendingItem(body.pendingItem, items);

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
        reply: `Got it. Keeping ${pendingItem.name} with default settings. Your cart is updated.`,
        action: { type: "CLEAR_PENDING_ITEM" },
      });
    }

    if (pendingItem && isStartModificationMessage(message)) {
      return NextResponse.json({
        ok: true,
        reply: `Sure. For ${pendingItem.name}, tell me your preferred size, ice level, sugar level, and toppings.`,
      });
    }

    if (pendingItem) {
      const parsed = parseModificationRequest(message, modifiers);
      if (parsed.applied.length > 0) {
        return NextResponse.json({
          ok: true,
          reply: `Updated ${pendingItem.name}: ${parsed.applied.join(", ")}. Do you want any other modifications?`,
          action: {
            type: "UPDATE_PENDING_ITEM",
            updates: parsed.updates,
          },
        });
      }

      if (/\b(remove|take off|without|no)\b/.test(String(message || "").toLowerCase())) {
        const normalizedMessage = normalizeLookup(message);
        const normalizedItemName = normalizeLookup(pendingItem.name);
        if (normalizedItemName && normalizedMessage.includes(normalizedItemName.slice(0, Math.min(normalizedItemName.length, 12)))) {
          return NextResponse.json({
            ok: true,
            reply: `I cannot remove the main flavor from ${pendingItem.name}. You can choose a different drink if you want another flavor.`,
          });
        }
      }
    }

    const requestedItem = hasAddIntent(message) ? findRequestedMenuItem(message, items) : null;
    if (requestedItem) {
      return NextResponse.json({
        ok: true,
        reply: createAssistantActionReplyForAdd(requestedItem),
        action: {
          type: "ADD_DEFAULT_ITEM",
          itemId: requestedItem.id,
          itemName: requestedItem.name,
        },
      });
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
                "11) If requested details are missing from provided context, respond exactly: I do not have that information.",
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
