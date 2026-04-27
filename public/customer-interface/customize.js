const selectedDrinkInput = document.getElementById("selected-drink");
const sizeSelect = document.getElementById("drink-size");
const iceSelect = document.getElementById("ice-level");
const sugarSelect = document.getElementById("sugar-level");
const toppingsList = document.getElementById("toppings-list");
const specialInstructionsInput = document.getElementById("special-instructions");
const customizeOrderBox = document.getElementById("customize-order-box");
const customizeTotal = document.getElementById("customize-total");
const customizeStatus = document.getElementById("customize-status");
const addToOrderButton = document.getElementById("add-to-order-button");
const orderMoreButton = document.getElementById("order-more-button");
const checkoutButton = document.getElementById("checkout-button");

const SIZE_OPTIONS = [
  { name: "Regular", priceDelta: 0 },
  { name: "Large", priceDelta: 0.75 },
];

let selectedMenuItem = null;
let modifiers = [];

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
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

function fillSelectOptions(selectElement, options, defaultValue) {
  selectElement.innerHTML = "";

  options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option.name;
    element.textContent = selectElement === sizeSelect ? formatSizeLabel(option.name) : option.name;
    if (option.name === defaultValue) element.selected = true;
    selectElement.appendChild(element);
  });
}

function renderToppings(options, selectedNames = []) {
  toppingsList.innerHTML = "";

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "checkbox-option";
    label.innerHTML = `
      <input type="checkbox" value="${option.name}" ${selectedNames.includes(option.name) ? "checked" : ""} />
      <span>${option.name} (${formatMoney(option.priceDelta)})</span>
    `;

    label.querySelector("input").addEventListener("change", updatePreview);
    toppingsList.appendChild(label);
  });
}

function getModifiersByType(type) {
  return modifiers.filter((modifier) => modifier.modifierType === type);
}

function getCheckedToppings() {
  return [...toppingsList.querySelectorAll("input:checked")].map((input) => input.value);
}

function calculateTotal() {
  if (!selectedMenuItem) return 0;

  const size = SIZE_OPTIONS.find((option) => option.name === sizeSelect.value);
  const toppingTotal = getCheckedToppings().reduce((sum, toppingName) => {
    const topping = getModifiersByType("Topping").find((item) => item.name === toppingName);
    return sum + (topping ? topping.priceDelta : 0);
  }, 0);

  return Number(selectedMenuItem.basePrice) + (size ? size.priceDelta : 0) + toppingTotal;
}

function updatePreview() {
  if (!selectedMenuItem) {
    customizeOrderBox.innerHTML = `<p>No item selected yet.</p>`;
    customizeTotal.textContent = `Total: ${formatMoney(0)}`;
    return;
  }

  const toppings = getCheckedToppings();
  const total = calculateTotal();

  customizeOrderBox.innerHTML = `
    <p><strong>${selectedMenuItem.itemName}</strong></p>
    <p>Size: ${formatSizeLabel(sizeSelect.value || "Regular")}</p>
    <p>Ice Level: ${iceSelect.value || "Regular Ice"}</p>
    <p>Sugar Level: ${sugarSelect.value || "100% Sugar"}</p>
    <p>Toppings: ${toppings.length ? toppings.join(", ") : "None"}</p>
    <p>Special Instructions: ${specialInstructionsInput.value.trim() || "None"}</p>
  `;
  customizeTotal.textContent = `Total: ${formatMoney(total)}`;
}

function buildCurrentOrder() {
  if (!selectedMenuItem) return null;

  return {
    ...selectedMenuItem,
    size: sizeSelect.value,
    ice: iceSelect.value,
    sugar: sugarSelect.value,
    toppings: getCheckedToppings(),
    specialInstructions: specialInstructionsInput.value.trim(),
    totalPrice: calculateTotal(),
  };
}

function addCurrentItemToCart() {
  const order = buildCurrentOrder();
  if (!order) {
    customizeStatus.textContent = "No item selected yet.";
    return false;
  }

  const cart = loadCart();
  cart.push(order);
  saveCart(cart);
  sessionStorage.removeItem("customerCustomizedOrder");
  customizeStatus.textContent = `${order.itemName} added to cart.`;
  renderCartPreview();
  return true;
}

function renderCartPreview() {
  const cart = loadCart();

  if (cart.length === 0) {
    updatePreview();
    return;
  }

  customizeOrderBox.innerHTML = cart
    .map(
      (item, index) => `
        <p><strong>Item ${index + 1}: ${item.itemName}</strong></p>
        <p>Size: ${formatSizeLabel(item.size)}</p>
        <p>Ice Level: ${item.ice}</p>
        <p>Sugar Level: ${item.sugar}</p>
        <p>Toppings: ${item.toppings.length ? item.toppings.join(", ") : "None"}</p>
        <p>Special Instructions: ${item.specialInstructions || "None"}</p>
        <p>Item Total: ${formatMoney(item.totalPrice)}</p>
      `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  customizeTotal.textContent = `Total: ${formatMoney(total)}`;
}

async function loadModifiers() {
  const response = await fetch("/api/menu-modifiers");
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  modifiers = await response.json();
}

function loadSelectedItem() {
  const storedItem = sessionStorage.getItem("customerSelectedMenuItem");
  if (!storedItem) return null;

  try {
    return JSON.parse(storedItem);
  } catch (_error) {
    return null;
  }
}

function loadExistingCustomization() {
  const storedOrder = sessionStorage.getItem("customerCustomizedOrder");
  if (!storedOrder) return null;

  try {
    return JSON.parse(storedOrder);
  } catch (_error) {
    return null;
  }
}

async function initializePage() {
  selectedMenuItem = loadSelectedItem();

  if (!selectedMenuItem) {
    customizeStatus.textContent = "No item selected yet.";
    updatePreview();
    return;
  }

  selectedDrinkInput.value = selectedMenuItem.itemName;

  try {
    await loadModifiers();

    fillSelectOptions(sizeSelect, SIZE_OPTIONS, "Regular");
    fillSelectOptions(iceSelect, getModifiersByType("Ice Level"), "Regular Ice");
    fillSelectOptions(sugarSelect, getModifiersByType("Sugar Level"), "100% Sugar");

    const existingOrder = loadExistingCustomization();
    renderToppings(getModifiersByType("Topping"), existingOrder?.toppings || []);

    if (existingOrder) {
      sizeSelect.value = existingOrder.size;
      iceSelect.value = existingOrder.ice;
      sugarSelect.value = existingOrder.sugar;
      specialInstructionsInput.value = existingOrder.specialInstructions || "";
    }

    if (loadCart().length > 0) renderCartPreview();

    customizeStatus.textContent = "Customization options are ready.";
    if (loadCart().length === 0) updatePreview();
  } catch (error) {
    customizeStatus.textContent = "Something went wrong. Please try again.";
  }
}

[sizeSelect, iceSelect, sugarSelect, specialInstructionsInput].forEach((element) => {
  element.addEventListener("change", updatePreview);
  element.addEventListener("input", updatePreview);
});

orderMoreButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

addToOrderButton.addEventListener("click", () => {
  addCurrentItemToCart();
});

checkoutButton.addEventListener("click", () => {
  const cart = loadCart();
  if (cart.length === 0) {
    customizeStatus.textContent = "No customization saved yet.";
    return;
  }

  window.location.href = "checkout.html";
});

initializePage();
