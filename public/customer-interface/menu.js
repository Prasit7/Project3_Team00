const categoryBar = document.getElementById("category-bar");
const menuGrid = document.getElementById("menu-grid");
const statusText = document.getElementById("customer-status");
const selectedItemBox = document.getElementById("selected-item-box");
const selectedItemTotal = document.getElementById("selected-item-total");
const nextCustomizeLink = document.getElementById("next-customize-link");
const assistantForm = document.getElementById("assistant-form");
const assistantInput = document.getElementById("assistant-input");
const assistantMessages = document.getElementById("assistant-messages");

const modalOverlay = document.getElementById("customize-modal-overlay");
const modalCloseButton = document.getElementById("close-customize-modal");
const modalDrinkName = document.getElementById("modal-drink-name");
const modalDrinkCategory = document.getElementById("modal-drink-category");
const modalMedia = document.querySelector(".modal-media");
const modalSizeLevel = document.getElementById("modal-size-level");
const modalIceLevel = document.getElementById("modal-ice-level");
const modalSugarLevel = document.getElementById("modal-sugar-level");
const modalToppingsList = document.getElementById("modal-toppings-list");
const modalSpecialInstructions = document.getElementById("modal-special-instructions");
const modalAddToOrderButton = document.getElementById("modal-add-to-order");
const modalLiveTotal = document.getElementById("modal-live-total");
const ASSISTANT_PENDING_ITEM_KEY = "assistantPendingItem";

const SIZE_OPTIONS = [
  { name: "Regular", labelKey: "sizeRegular", priceDelta: 0 },
  { name: "Large", labelKey: "sizeLarge", priceDelta: 0.75 },
];

let menuItems = [];
let modifiers = [];
let activeCategory = "";
let activeModalItem = null;

const ITEM_IMAGE_MAP = {
  classicmilktea: "classicmilktea.jpg",
  brownsugarmilktea: "brownsugar.jpg",
  brownsugarmilk: "brownsugar.jpg",
  brownsugar: "brownsugar.jpg",
  taromilktea: "tarotea.jpg",
  taromilk: "tarotea.jpg",
  tarotea: "tarotea.jpg",
  matchamilktea: "matchamilk.jpg",
  matchamilk: "matchamilk.jpg",
  thaitea: "thaitea.jpg",
  honeydewmilktea: "honeydew.jpg",
  honeydewmilk: "honeydew.jpg",
  mangogreentea: "mangogreen.jpg",
  passionfruittea: "passionfruit.jpg",
  lycheeblacktea: "lycheeblack.jpg",
  peachoolongtea: "peachoolong.jpg",
  wintermelontea: "wintermelon.jpg",
  jasminegreentea: "jasminegreen.jpg",
  cheesefoamtea: "cheesefoam.jpg",
  fruitteacombo: "fruittea.jpg",
  oreomilktea: "oreomilk.jpg",
  oreomilk: "oreomilk.jpg",
  grassjellymilktea: "grassjelly.jpg",
  grassjellymilk: "grassjelly.jpg",
  strawberrymilktea: "strawberrymilk.jpg",
  strawberrymilk: "strawberrymilk.jpg",
  coconutmilktea: "coconutmilk.jpg",
  coconutmilk: "coconutmilk.jpg",
  coffeemilktea: "coffeemilk.jpg",
  coffeemilk: "coffeemilk.jpg",
  almondmilktea: "almondmilk.jpg",
  almondmilk: "almondmilk.jpg",
  rosemilktea: "rosemilk.jpg",
  rosemilk: "rosemilk.jpg",
  lavendermilktea: "lavendermilk.jpg",
  lavendermilk: "lavendermilk.jpg",
  javamilktea: "javamilk.jpg",
  javamilk: "javamilk.jpg",
  christmaskookiemilktea: "christmascookie.jpg",
  christmascookie: "christmascookie.jpg",
  eastermilktea: "eastermilk.jpg",
  eastermilk: "eastermilk.jpg",
  turkeymilktea: "turkeymilk.jpg",
  turkeymilk: "turkeymilk.jpg",
  bunnycarrotmilktea: "bunnycarrot.jpg",
  bunnycarrot: "bunnycarrot.jpg",
  pistachiomilktea: "pistachio.jpg",
  pistachiotea: "pistachio.jpg",
  caramelpuddingmilktea: "caramelpudding.jpg",
  caramelpuddingtea: "caramelpudding.jpg",
  grapefruittea: "grapefruit.jpg",
  grapefruitgreentea: "grapefruit.jpg",
  grapefruitblacktea: "grapefruit.jpg",
  kiwitea: "kiwi.jpg",
  kiwibasilgreentea: "kiwi.jpg",
  kiwigreentea: "kiwi.jpg",
  kiwiblacktea: "kiwi.jpg",
  yuzuoolongtea: "yuzuoolong.jpg",
  yuzuoolong: "yuzuoolong.jpg",
  pomegranatetea: "pomogranate.jpg",
  pomegranatemintoolongtea: "pomogranate.jpg",
  pomegranategreentea: "pomogranate.jpg",
  pomegranateblacktea: "pomogranate.jpg",
  pomogranatetea: "pomogranate.jpg",
  pomogranategreentea: "pomogranate.jpg",
  pomogranateblacktea: "pomogranate.jpg",
  poogranatetea: "pomogranate.jpg",
  dragonfruittea: "dragonfruit.jpg",
  dragonfruitlemongreentea: "dragonfruit.jpg",
  dragonfruitgreentea: "dragonfruit.jpg",
  dragonfruitblacktea: "dragonfruit.jpg",
  cranberrytea: "cranberrty.jpg",
  cranberryapplegreentea: "cranberryapple.jpg",
  cranberrygreentea: "cranberrty.jpg",
  cranberryblacktea: "cranberrty.jpg",
  cranberrtytea: "cranberrty.jpg",
  bloodorangetea: "bloodorange.jpg",
  bloodorangehibiscustea: "bloodorange.jpg",
  bloodorangegreentea: "bloodorange.jpg",
  bloodorangeblacktea: "bloodorange.jpg",
  guavatea: "guava.jpg",
  guavacalamansigreentea: "guava.jpg",
  guavagreentea: "guava.jpg",
  guavablacktea: "guava.jpg",
  blacksesamemilktea: "blacksesame.jpg",
  blacksesametea: "blacksesame.jpg",
  hokkaidomilktea: "hokkaido.jpg",
  hokkaidotea: "hokkaido.jpg",
  okinawamilktea: "okinawa.jpg",
  okinawaroastedmilktea: "okinawa.jpg",
  okinawatea: "okinawa.jpg",
  blueberryjasminetea: "blueberryjasminetea.jpg",
  blueberryjasmineblacktea: "blueberryjasminetea.jpg",
  blueberryjasmine: "blueberryjasminetea.jpg",
  blueberryjasminemilktea: "blueberryjasminetea.jpg",
  pineapplejasminetea: "pineapplejasmine.jpg",
  pineapplejasmine: "pineapplejasmine.jpg",
  pineapplejasminemilktea: "pineapplejasmine.jpg",
};

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function normalizeItemKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getItemImagePath(itemName) {
  const normalized = normalizeItemKey(itemName);
  const exactMatch = ITEM_IMAGE_MAP[normalized];
  if (exactMatch) return `/customer-interface/images/${exactMatch}`;

  const fallbackCandidates = [
    ["brownsugar", "brownsugar.jpg"],
    ["classic", "classicmilktea.jpg"],
    ["taro", "tarotea.jpg"],
    ["matcha", "matchamilk.jpg"],
    ["thai", "thaitea.jpg"],
    ["honeydew", "honeydew.jpg"],
    ["strawberry", "strawberrymilk.jpg"],
    ["mango", "mangogreen.jpg"],
    ["passion", "passionfruit.jpg"],
    ["lychee", "lycheeblack.jpg"],
    ["peach", "peachoolong.jpg"],
    ["wintermelon", "wintermelon.jpg"],
    ["jasminegreen", "jasminegreen.jpg"],
    ["cheesefoam", "cheesefoam.jpg"],
    ["fruitteacombo", "fruittea.jpg"],
    ["oreo", "oreomilk.jpg"],
    ["coconut", "coconutmilk.jpg"],
    ["coffee", "coffeemilk.jpg"],
    ["almond", "almondmilk.jpg"],
    ["rose", "rosemilk.jpg"],
    ["lavender", "lavendermilk.jpg"],
    ["java", "javamilk.jpg"],
    ["christmas", "christmascookie.jpg"],
    ["cookie", "christmascookie.jpg"],
    ["easter", "eastermilk.jpg"],
    ["turkey", "turkeymilk.jpg"],
    ["bunny", "bunnycarrot.jpg"],
    ["carrot", "bunnycarrot.jpg"],
  ];

  const tokenMatch = fallbackCandidates.find(([token]) => normalized.includes(token));
  if (tokenMatch) return `/customer-interface/images/${tokenMatch[1]}`;

  return null;
}

function formatSizeLabel(sizeValue) {
  if (sizeValue === "Regular") return "Regular - 16oz";
  if (sizeValue === "Large") return "Large - 20oz";
  return sizeValue;
}

function loadCart() {
  const storedCart = sessionStorage.getItem("customerCart");
  if (!storedCart) return [];

  try {
    return JSON.parse(storedCart);
  } catch (_error) {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem("customerCart", JSON.stringify(cart));
}

function removeCartItemAt(indexToRemove) {
  const cart = loadCart();
  if (indexToRemove < 0 || indexToRemove >= cart.length) return;
  const [removedItem] = cart.splice(indexToRemove, 1);
  saveCart(cart);
  renderCartSummary();
  if (removedItem) {
    statusText.textContent = `${removedItem.itemName} removed from cart.`;
  }
}

function getModifiersByType(type) {
  return modifiers.filter((modifier) => modifier.modifierType === type);
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function appendAssistantMessage(kind, text) {
  if (!assistantMessages) return;
  const messageNode = document.createElement("p");
  messageNode.className = `assistant-msg ${kind === "user" ? "assistant-msg--user" : "assistant-msg--bot"}`;
  messageNode.innerHTML = escapeHtml(text);
  assistantMessages.appendChild(messageNode);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function buildAssistantCartContext() {
  return loadCart().map((item, index) => ({
    cartIndex: index,
    itemId: item.itemId,
    itemName: item.itemName,
    size: item.size,
    ice: item.ice,
    sugar: item.sugar,
    toppings: item.toppings,
    totalPrice: item.totalPrice,
  }));
}

function getAssistantPendingItem() {
  const raw = sessionStorage.getItem(ASSISTANT_PENDING_ITEM_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function setAssistantPendingItem(item) {
  if (!item || typeof item !== "object") return;
  sessionStorage.setItem(ASSISTANT_PENDING_ITEM_KEY, JSON.stringify(item));
}

function clearAssistantPendingItem() {
  sessionStorage.removeItem(ASSISTANT_PENDING_ITEM_KEY);
}

function removeCartItemFromAssistant(action) {
  const cart = loadCart();
  if (!Array.isArray(cart) || cart.length === 0) return false;

  let targetIndex = Number.isInteger(action.cartIndex) ? action.cartIndex : -1;
  if (targetIndex < 0 || targetIndex >= cart.length) {
    targetIndex = [...cart]
      .map((entry, index) => ({ entry, index }))
      .reverse()
      .find((wrapped) => {
        if (Number(action.itemId) > 0 && Number(wrapped.entry.itemId) === Number(action.itemId)) return true;
        return normalizeItemKey(wrapped.entry.itemName) === normalizeItemKey(action.itemName);
      })?.index;
  }

  if (targetIndex === undefined || targetIndex < 0 || targetIndex >= cart.length) return false;
  const [removed] = cart.splice(targetIndex, 1);
  saveCart(cart);
  renderCartSummary();
  if (removed) {
    statusText.textContent = `${removed.itemName} removed from cart.`;
  }

  const pending = getAssistantPendingItem();
  if (pending) {
    const removedName = normalizeItemKey(removed?.itemName);
    const pendingName = normalizeItemKey(pending.itemName);
    if (removedName && pendingName && removedName === pendingName) {
      clearAssistantPendingItem();
    }
  }

  return true;
}

function addDefaultItemFromAssistant(itemId, itemName) {
  const normalizedName = normalizeItemKey(itemName);
  const item =
    menuItems.find((entry) => Number(entry.id) === Number(itemId)) ||
    menuItems.find((entry) => normalizeItemKey(entry.name) === normalizedName);
  if (!item) return -1;

  const iceOptions = getModifiersByType("Ice Level");
  const sugarOptions = getModifiersByType("Sugar Level");
  const regularIce = iceOptions.find((option) => option.name === "Regular Ice");
  const regularSugar = sugarOptions.find((option) => option.name === "100% Sugar");

  const order = {
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    basePrice: Number(item.price || 0),
    size: "Regular",
    ice: regularIce ? regularIce.name : iceOptions[0]?.name || "Regular Ice",
    sugar: regularSugar ? regularSugar.name : sugarOptions[0]?.name || "100% Sugar",
    toppings: [],
    specialInstructions: "",
    totalPrice: Number(item.price || 0),
  };

  const cart = loadCart();
  cart.push(order);
  saveCart(cart);
  renderCartSummary();
  statusText.textContent = `${order.itemName} added to cart.`;
  return cart.length - 1;
}

function recalculateCartItemTotal(item) {
  const sizeDelta = item.size === "Large" ? 0.75 : 0;
  const toppingTotal = (Array.isArray(item.toppings) ? item.toppings : []).reduce((sum, toppingName) => {
    const topping = getModifiersByType("Topping").find((option) => option.name === toppingName);
    return sum + (topping ? Number(topping.priceDelta || 0) : 0);
  }, 0);
  return Number(item.basePrice || 0) + sizeDelta + toppingTotal;
}

function updatePendingCartItemFromAssistant(updates) {
  const pending = getAssistantPendingItem();
  if (!pending || !updates || typeof updates !== "object") return false;

  const cart = loadCart();
  let targetIndex = Number.isInteger(pending.cartIndex) ? pending.cartIndex : -1;

  if (targetIndex < 0 || targetIndex >= cart.length) {
    targetIndex = [...cart]
      .map((entry, index) => ({ entry, index }))
      .reverse()
      .find((wrapped) => Number(wrapped.entry.itemId) === Number(pending.itemId))?.index;
  }

  if (targetIndex === undefined || targetIndex < 0 || targetIndex >= cart.length) return false;

  const current = cart[targetIndex];
  const updated = {
    ...current,
    size: typeof updates.size === "string" ? updates.size : current.size,
    ice: typeof updates.ice === "string" ? updates.ice : current.ice,
    sugar: typeof updates.sugar === "string" ? updates.sugar : current.sugar,
    toppings: Array.isArray(updates.toppings) ? updates.toppings : current.toppings,
  };

  if (Array.isArray(updates.removeToppings) && updates.removeToppings.length > 0) {
    const removeSet = new Set(updates.removeToppings.map((name) => normalizeItemKey(name)));
    updated.toppings = (Array.isArray(updated.toppings) ? updated.toppings : []).filter(
      (name) => !removeSet.has(normalizeItemKey(name))
    );
  }

  updated.totalPrice = recalculateCartItemTotal(updated);

  cart[targetIndex] = updated;
  saveCart(cart);
  renderCartSummary();
  statusText.textContent = `${updated.itemName} updated`;
  setAssistantPendingItem({
    ...pending,
    cartIndex: targetIndex,
  });
  return true;
}

function handleAssistantAction(action) {
  if (!action || typeof action !== "object") return;

  if (action.type === "ADD_DEFAULT_ITEM") {
    const cartIndex = addDefaultItemFromAssistant(action.itemId, action.itemName);
    if (cartIndex < 0) {
      appendAssistantMessage("bot", "I could not add that item automatically. Please select it from the menu.");
      return;
    }
    setAssistantPendingItem({
      itemId: action.itemId,
      itemName: action.itemName,
      cartIndex,
    });
    return;
  }

  if (action.type === "CLEAR_PENDING_ITEM") {
    clearAssistantPendingItem();
    return;
  }

  if (action.type === "UPDATE_PENDING_ITEM") {
    const updated = updatePendingCartItemFromAssistant(action.updates);
    if (!updated) {
      appendAssistantMessage("bot", "I could not apply those modifications automatically. Please use the customize panel.");
    }
    return;
  }

  if (action.type === "REMOVE_CART_ITEM") {
    const removed = removeCartItemFromAssistant(action);
    if (!removed) {
      appendAssistantMessage("bot", "I could not find that item in the cart to remove.");
    }
  }
}

async function handleAssistantSubmit(event) {
  event.preventDefault();
  if (!assistantInput) return;

  const text = assistantInput.value.trim();
  if (!text) return;

  appendAssistantMessage("user", text);
  assistantInput.value = "";
  appendAssistantMessage("bot", "Thinking...");

  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        cart: buildAssistantCartContext(),
        pendingItem: getAssistantPendingItem(),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (assistantMessages?.lastElementChild) {
      assistantMessages.lastElementChild.remove();
    }

    if (!response.ok || !payload.ok) {
      const detail = payload?.detail ? ` (${payload.detail})` : "";
      appendAssistantMessage(
        "bot",
        `I can help with menu and ordering, but I am temporarily unavailable. Please try again.${detail}`
      );
      return;
    }

    appendAssistantMessage("bot", payload.reply || "How can I help with your order?");
    handleAssistantAction(payload.action);
  } catch (_error) {
    if (assistantMessages?.lastElementChild) {
      assistantMessages.lastElementChild.remove();
    }
    appendAssistantMessage("bot", "Network issue. Please try again.");
  }
}

function setNextActionEnabled(enabled) {
  nextCustomizeLink.href = "checkout.html";
  nextCustomizeLink.textContent = "Next: Checkout";

  if (enabled) {
    nextCustomizeLink.classList.remove("is-disabled");
    nextCustomizeLink.setAttribute("aria-disabled", "false");
    return;
  }

  nextCustomizeLink.classList.add("is-disabled");
  nextCustomizeLink.setAttribute("aria-disabled", "true");
}

function renderCartSummary() {
  const cart = loadCart();

  if (cart.length === 0) {
    selectedItemBox.innerHTML = `<p>No item selected yet.</p>`;
    selectedItemTotal.textContent = `Total: ${formatMoney(0)}`;
    setNextActionEnabled(false);
    return;
  }

  selectedItemBox.innerHTML = cart
    .map(
      (item, index) => {
        const itemImagePath = getItemImagePath(item.itemName);
        return `
        <article class="cart-item-row">
          <div class="cart-item-content">
            <p><strong>Item ${index + 1}: ${item.itemName}</strong></p>
            <p>Size: ${formatSizeLabel(item.size)}</p>
            <p>Ice Level: ${item.ice}</p>
            <p>Sugar Level: ${item.sugar}</p>
            <p>Toppings: ${item.toppings.length ? item.toppings.join(", ") : "None"}</p>
            <p>Item Total: ${formatMoney(item.totalPrice)}</p>
          </div>
          <div class="cart-item-side">
            <div class="cart-item-thumb" aria-hidden="true">
              ${
                itemImagePath
                  ? `<img src="${itemImagePath}" alt="${item.itemName}" class="menu-item-image" loading="lazy" />`
                  : "Image"
              }
            </div>
            <button
              type="button"
              class="cart-item-remove"
              data-remove-index="${index}"
              aria-label="Remove from cart: ${item.itemName}"
              title="Remove from cart"
            >
              ×
            </button>
          </div>
        </article>
      `;
      }
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  selectedItemTotal.textContent = `Total: ${formatMoney(total)}`;
  setNextActionEnabled(true);
}

function renderCategories() {
  const categories = [...new Set(menuItems.map((item) => item.category))];
  categoryBar.innerHTML = "";

  categories.forEach((category, index) => {
    const button = document.createElement("button");
    button.className = "category-button";
    if (index === 0) {
      button.classList.add("active");
      activeCategory = category;
    }
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => {
      activeCategory = category;
      [...categoryBar.querySelectorAll(".category-button")].forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderMenuItems();
    });
    categoryBar.appendChild(button);
  });
}

function openCustomizeModal(item) {
  activeModalItem = item;
  const itemImagePath = getItemImagePath(item.name);

  modalDrinkName.textContent = item.name;
  modalDrinkCategory.textContent = `${item.category} · Base ${formatMoney(item.price)}`;
  modalSpecialInstructions.value = "";
  if (itemImagePath) {
    modalMedia.innerHTML = `<img src="${itemImagePath}" alt="${item.name}" class="menu-item-image" loading="lazy" />`;
  } else {
    modalMedia.textContent = "Image Placeholder";
  }

  modalSizeLevel.innerHTML = SIZE_OPTIONS.map(
    (sizeOption) =>
      `<option value="${sizeOption.name}">${formatSizeLabel(sizeOption.name)}${sizeOption.priceDelta > 0 ? ` (+${formatMoney(sizeOption.priceDelta)})` : ""}</option>`
  ).join("");
  modalSizeLevel.value = SIZE_OPTIONS[0].name;

  const iceOptions = getModifiersByType("Ice Level");
  const sugarOptions = getModifiersByType("Sugar Level");
  const toppingOptions = getModifiersByType("Topping");

  modalIceLevel.innerHTML = iceOptions
    .map((option) => `<option value="${option.name}">${option.name}</option>`)
    .join("");
  modalSugarLevel.innerHTML = sugarOptions
    .map((option) => `<option value="${option.name}">${option.name}</option>`)
    .join("");

  if (modalIceLevel.options.length > 0) {
    const regularIce = [...modalIceLevel.options].find((option) => option.value === "Regular Ice");
    modalIceLevel.value = regularIce ? regularIce.value : modalIceLevel.options[0].value;
  }

  if (modalSugarLevel.options.length > 0) {
    const regularSugar = [...modalSugarLevel.options].find((option) => option.value === "100% Sugar");
    modalSugarLevel.value = regularSugar ? regularSugar.value : modalSugarLevel.options[0].value;
  }

  modalToppingsList.innerHTML = toppingOptions
    .map(
      (option) => `
        <label class="checkbox-option">
          <input type="checkbox" value="${option.name}" />
          <span>${option.name} (${formatMoney(option.priceDelta)})</span>
        </label>
      `
    )
    .join("");

  updateModalTotal();

  modalOverlay.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeCustomizeModal() {
  modalOverlay.classList.add("is-hidden");
  document.body.classList.remove("modal-open");
  activeModalItem = null;
}

function getCheckedToppings() {
  return [...modalToppingsList.querySelectorAll("input:checked")].map((input) => input.value);
}

function calculateModalTotal() {
  if (!activeModalItem) return 0;

  const sizeOption = SIZE_OPTIONS.find((option) => option.name === (modalSizeLevel.value || "Regular"));

  const toppingTotal = getCheckedToppings().reduce((sum, toppingName) => {
    const topping = getModifiersByType("Topping").find((option) => option.name === toppingName);
    return sum + (topping ? Number(topping.priceDelta || 0) : 0);
  }, 0);

  return Number(activeModalItem.price || 0) + (sizeOption ? sizeOption.priceDelta : 0) + toppingTotal;
}

function updateModalTotal() {
  modalLiveTotal.textContent = `Total: ${formatMoney(calculateModalTotal())}`;
}

function addModalOrderToCart() {
  if (!activeModalItem) return;

  const order = {
    itemId: activeModalItem.id,
    itemName: activeModalItem.name,
    category: activeModalItem.category,
    basePrice: Number(activeModalItem.price || 0),
    size: modalSizeLevel.value || "Regular",
    ice: modalIceLevel.value || "Regular Ice",
    sugar: modalSugarLevel.value || "100% Sugar",
    toppings: getCheckedToppings(),
    specialInstructions: modalSpecialInstructions.value.trim(),
    totalPrice: calculateModalTotal(),
  };

  const cart = loadCart();
  cart.push(order);
  saveCart(cart);

  sessionStorage.setItem(
    "customerSelectedMenuItem",
    JSON.stringify({
      itemId: order.itemId,
      itemName: order.itemName,
      category: order.category,
      basePrice: order.basePrice,
    })
  );

  statusText.textContent = `${order.itemName} added to cart.`;
  renderCartSummary();
  closeCustomizeModal();
}

function renderMenuItems() {
  const visibleItems = menuItems.filter((item) => item.category === activeCategory);
  menuGrid.innerHTML = "";

  visibleItems.forEach((item) => {
    const itemImagePath = getItemImagePath(item.name);
    const card = document.createElement("article");
    card.className = "menu-item-box";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${item.name}, ${formatMoney(item.price)}. Open customization`);
    card.innerHTML = `
      <div class="menu-item-media" aria-hidden="true">
        ${
          itemImagePath
            ? `<img src="${itemImagePath}" alt="${item.name}" class="menu-item-image" loading="lazy" />`
            : "Image Placeholder"
        }
      </div>
      <div class="menu-item-details">
        <h2>${item.name}</h2>
        <p class="price-text">${formatMoney(item.price)}</p>
      </div>
      <p class="menu-item-hint">Tap to customize</p>
    `;

    const openCardModal = () => openCustomizeModal(item);
    card.addEventListener("click", openCardModal);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCardModal();
      }
    });

    menuGrid.appendChild(card);
  });
}

async function loadModifiers() {
  try {
    const response = await fetch("/api/menu-modifiers");
    if (!response.ok) throw new Error("Modifier lookup failed");
    const payload = await response.json();
    modifiers = Array.isArray(payload) ? payload : [];
  } catch (_error) {
    modifiers = [];
  }
}

async function loadMenuItems() {
  try {
    const response = await fetch("/api/menu-items");
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

    const items = await response.json();
    menuItems = Array.isArray(items) ? items : [];

    if (menuItems.length === 0) {
      statusText.textContent = "No menu items available right now.";
      menuGrid.innerHTML = `<article class="menu-item-box skeleton-box"><h2>No menu items available right now.</h2></article>`;
      return;
    }

    await loadModifiers();
    renderCategories();
    renderMenuItems();
    statusText.textContent = "Menu is ready.";
  } catch (error) {
    statusText.textContent = "Something went wrong. Please try again.";
    menuGrid.innerHTML =
      `<article class="menu-item-box skeleton-box"><h2>Menu unavailable</h2><p class="price-text">Please try again soon.</p></article>`;
  }
}

modalSizeLevel.addEventListener("change", updateModalTotal);
modalIceLevel.addEventListener("change", updateModalTotal);
modalSugarLevel.addEventListener("change", updateModalTotal);
modalToppingsList.addEventListener("change", updateModalTotal);
modalSpecialInstructions.addEventListener("input", updateModalTotal);
modalAddToOrderButton.addEventListener("click", addModalOrderToCart);
selectedItemBox.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-index]");
  if (!removeButton) return;
  const index = Number.parseInt(removeButton.getAttribute("data-remove-index"), 10);
  if (!Number.isNaN(index)) {
    removeCartItemAt(index);
  }
});

modalCloseButton.addEventListener("click", closeCustomizeModal);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeCustomizeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalOverlay.classList.contains("is-hidden")) {
    closeCustomizeModal();
  }
});
if (assistantForm) {
  assistantForm.addEventListener("submit", handleAssistantSubmit);
}

renderCartSummary();
loadMenuItems();

if (typeof loadWeatherWidget === "function") {
  loadWeatherWidget({
    statusId: "kiosk-weather-heading",
    tempId: "kiosk-weather-temp",
    iconWrapId: "kiosk-weather-icon-wrap",
    iconId: "kiosk-weather-icon",
    units: "imperial",
    fallbackCity: "College Station",
  });
}
