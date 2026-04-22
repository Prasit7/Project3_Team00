const categoryBar = document.getElementById("category-bar");
const menuGrid = document.getElementById("menu-grid");
const statusText = document.getElementById("customer-status");
const selectedItemBox = document.getElementById("selected-item-box");
const selectedItemTotal = document.getElementById("selected-item-total");
const nextCustomizeLink = document.getElementById("next-customize-link");

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
    ["jasmine", "jasminegreen.jpg"],
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
  if (sizeValue === "Regular") return t("sizeRegular");
  if (sizeValue === "Large") return t("sizeLarge");
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
    statusText.textContent = `${removedItem.itemName} ${t("removedFromCartStatus")}`;
  }
}

function getModifiersByType(type) {
  return modifiers.filter((modifier) => modifier.modifierType === type);
}

function setNextActionEnabled(enabled) {
  nextCustomizeLink.href = "checkout.html";
  nextCustomizeLink.textContent = t("nextCheckout");

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
    selectedItemBox.innerHTML = `<p>${t("noItemSelected")}</p>`;
    selectedItemTotal.textContent = `${t("total")} ${formatMoney(0)}`;
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
            <p><strong>${t("itemWord")} ${index + 1}: ${item.itemName}</strong></p>
            <p>${t("size")}: ${formatSizeLabel(item.size)}</p>
            <p>${t("iceLevel")}: ${item.ice}</p>
            <p>${t("sugarLevel")}: ${item.sugar}</p>
            <p>${t("toppings")}: ${item.toppings.length ? item.toppings.join(", ") : t("none")}</p>
            <p>${t("itemTotal")}: ${formatMoney(item.totalPrice)}</p>
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
              aria-label="${t("removeFromCart")}: ${item.itemName}"
              title="${t("removeFromCart")}"
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
  selectedItemTotal.textContent = `${t("total")} ${formatMoney(total)}`;
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
  modalDrinkCategory.textContent = `${item.category} · ${t("baseLabel")} ${formatMoney(item.price)}`;
  modalSpecialInstructions.value = "";
  if (itemImagePath) {
    modalMedia.innerHTML = `<img src="${itemImagePath}" alt="${item.name}" class="menu-item-image" loading="lazy" />`;
  } else {
    modalMedia.textContent = "Image Placeholder";
  }

  modalSizeLevel.innerHTML = SIZE_OPTIONS.map(
    (sizeOption) =>
      `<option value="${sizeOption.name}">${t(sizeOption.labelKey)}${sizeOption.priceDelta > 0 ? ` (+${formatMoney(sizeOption.priceDelta)})` : ""}</option>`
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
  modalLiveTotal.textContent = `${t("total")} ${formatMoney(calculateModalTotal())}`;
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

  statusText.textContent = `${order.itemName} ${t("addedToCartStatus")}`;
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
    card.setAttribute("aria-label", `${item.name}, ${formatMoney(item.price)}. ${t("openCustomization")}`);
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
      <p class="menu-item-hint">${t("tapToCustomize")}</p>
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
      statusText.textContent = t("noMenuItems");
      menuGrid.innerHTML = `<article class="menu-item-box skeleton-box"><h2>${t("noMenuItems")}</h2></article>`;
      return;
    }

    await loadModifiers();
    renderCategories();
    renderMenuItems();
    statusText.textContent = t("menuReady");
  } catch (error) {
    statusText.textContent = t("statusError");
    menuGrid.innerHTML =
      `<article class="menu-item-box skeleton-box"><h2>${t("menuUnavailable")}</h2><p class="price-text">${t("databaseLoadFailed")}</p></article>`;
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
