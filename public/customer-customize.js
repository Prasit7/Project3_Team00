const selectedDrinkInput = document.getElementById("selected-drink");
const sizeSelect = document.getElementById("drink-size");
const iceSelect = document.getElementById("ice-level");
const sugarSelect = document.getElementById("sugar-level");
const toppingsList = document.getElementById("toppings-list");
const specialInstructionsInput = document.getElementById("special-instructions");
const customizeOrderBox = document.getElementById("customize-order-box");
const customizeTotal = document.getElementById("customize-total");
const customizeStatus = document.getElementById("customize-status");
const nextCheckoutLink = document.getElementById("next-checkout-link");
const clearCustomizationButton = document.getElementById("clear-customization");
const saveButtons = [...document.querySelectorAll(".customization-actions .item-button")];

const SIZE_OPTIONS = [
  { name: "Regular", priceDelta: 0 },
  { name: "Large", priceDelta: 0.75 },
];

let selectedMenuItem = null;
let modifiers = [];

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function fillSelectOptions(selectElement, options, defaultValue) {
  selectElement.innerHTML = "";

  options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option.name;
    element.textContent = option.name;
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
    customizeOrderBox.innerHTML = "<p>Select an item on the menu page first.</p>";
    customizeTotal.textContent = "Total: $0.00";
    return;
  }

  const toppings = getCheckedToppings();
  const total = calculateTotal();

  customizeOrderBox.innerHTML = `
    <p><strong>${selectedMenuItem.itemName}</strong></p>
    <p>Size: ${sizeSelect.value || "Regular"}</p>
    <p>Ice: ${iceSelect.value || "Regular Ice"}</p>
    <p>Sugar: ${sugarSelect.value || "100% Sugar"}</p>
    <p>Toppings: ${toppings.length ? toppings.join(", ") : "None"}</p>
    <p>Instructions: ${specialInstructionsInput.value.trim() || "None"}</p>
  `;
  customizeTotal.textContent = `Total: ${formatMoney(total)}`;
}

function saveCustomization() {
  if (!selectedMenuItem) return;

  const order = {
    ...selectedMenuItem,
    size: sizeSelect.value,
    ice: iceSelect.value,
    sugar: sugarSelect.value,
    toppings: getCheckedToppings(),
    specialInstructions: specialInstructionsInput.value.trim(),
    totalPrice: calculateTotal(),
  };

  sessionStorage.setItem("customerCustomizedOrder", JSON.stringify(order));
  nextCheckoutLink.classList.remove("is-disabled");
  nextCheckoutLink.setAttribute("aria-disabled", "false");
  customizeStatus.textContent = "Customization saved from database-backed options.";
  updatePreview();
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
    customizeStatus.textContent = "No selected drink found. Go back to the menu page first.";
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
      nextCheckoutLink.classList.remove("is-disabled");
      nextCheckoutLink.setAttribute("aria-disabled", "false");
    }

    customizeStatus.textContent = "Customization options loaded from the database.";
    updatePreview();
  } catch (error) {
    customizeStatus.textContent = `Could not load customization options from the database. ${error.message}`;
  }
}

[sizeSelect, iceSelect, sugarSelect, specialInstructionsInput].forEach((element) => {
  element.addEventListener("change", updatePreview);
  element.addEventListener("input", updatePreview);
});

saveButtons.forEach((button) => button.addEventListener("click", saveCustomization));

clearCustomizationButton.addEventListener("click", () => {
  sessionStorage.removeItem("customerCustomizedOrder");
  nextCheckoutLink.classList.add("is-disabled");
  nextCheckoutLink.setAttribute("aria-disabled", "true");
  specialInstructionsInput.value = "";
  customizeStatus.textContent = "Customization cleared.";
  updatePreview();
});

initializePage();
