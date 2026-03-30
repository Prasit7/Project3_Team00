const menuItems = [
  { name: "Classic Milk Tea", price: 5.5 },
  { name: "Taro Milk Tea", price: 5.75 },
  { name: "Thai Tea", price: 5.75 },
  { name: "Brown Sugar Boba", price: 6.0 },
  { name: "Mango Green Tea", price: 5.5 },
  { name: "Strawberry Fruit Tea", price: 5.5 },
  { name: "Matcha Latte", price: 6.25 },
  { name: "Wintermelon Tea", price: 5.25 },
  { name: "Jasmine Green Tea", price: 5.0 },
  { name: "Honey Oolong Tea", price: 5.25 }
];

const toppingOptions = [
  { name: "Tapioca Pearls", price: 0.5 },
  { name: "Popping Boba", price: 0.75 },
  { name: "Aloe Vera", price: 0.5 },
  { name: "Pudding", price: 0.75 }
];

const sizeUpcharge = {
  Regular: 0,
  Large: 0.75
};

const TAX_RATE = 0.0825;

const menuGrid = document.getElementById("menu-grid");
const cartList = document.getElementById("cart-list");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const clearTicketBtn = document.getElementById("clear-ticket");

const modal = document.getElementById("customize-modal");
const modalDrinkName = document.getElementById("modal-drink-name");
const modalBasePrice = document.getElementById("modal-base-price");
const sizeSelect = document.getElementById("size-select");
const iceSelect = document.getElementById("ice-select");
const sugarSelect = document.getElementById("sugar-select");
const toppingsList = document.getElementById("toppings-list");
const previewItemTotal = document.getElementById("preview-item-total");
const addCustomItemBtn = document.getElementById("add-custom-item");
const cancelCustomItemBtn = document.getElementById("cancel-custom-item");

let cart = [];
let currentMenuItem = null;

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function renderMenu() {
  menuGrid.innerHTML = "";

  menuItems.forEach((item) => {
    const button = document.createElement("button");
    button.className = "menu-item-btn";
    button.type = "button";
    button.innerHTML = `
      <span class="item-name">${item.name}</span>
      <span class="item-price">${formatMoney(item.price)}</span>
    `;
    button.addEventListener("click", () => openCustomizeModal(item));
    menuGrid.appendChild(button);
  });
}

function renderToppings() {
  toppingsList.innerHTML = "";

  toppingOptions.forEach((topping, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "topping-option";
    wrapper.innerHTML = `
      <input type="checkbox" value="${index}" />
      <span>${topping.name} (+${formatMoney(topping.price)})</span>
    `;
    const checkbox = wrapper.querySelector("input");
    checkbox.addEventListener("change", updatePreviewPrice);
    toppingsList.appendChild(wrapper);
  });
}

function openCustomizeModal(item) {
  currentMenuItem = item;
  modalDrinkName.textContent = item.name;
  modalBasePrice.textContent = formatMoney(item.price);

  sizeSelect.value = "Regular";
  iceSelect.value = "Regular Ice";
  sugarSelect.value = "100%";

  renderToppings();
  updatePreviewPrice();

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeCustomizeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  currentMenuItem = null;
}

function getSelectedToppings() {
  const selected = [];
  const checkedBoxes = toppingsList.querySelectorAll("input[type='checkbox']:checked");

  checkedBoxes.forEach((box) => {
    const topping = toppingOptions[Number(box.value)];
    if (topping) selected.push(topping);
  });

  return selected;
}

function calculateItemPrice(basePrice) {
  const selectedSize = sizeSelect.value;
  const selectedToppings = getSelectedToppings();

  const toppingTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const sizePrice = sizeUpcharge[selectedSize] || 0;

  return basePrice + sizePrice + toppingTotal;
}

function updatePreviewPrice() {
  if (!currentMenuItem) return;
  const itemTotal = calculateItemPrice(currentMenuItem.price);
  previewItemTotal.textContent = formatMoney(itemTotal);
}

function buildCustomizationText(size, ice, sugar, toppings) {
  const toppingText = toppings.length > 0 ? toppings.map((t) => t.name).join(", ") : "No toppings";
  return `Size: ${size} | Ice: ${ice} | Sugar: ${sugar} | Toppings: ${toppingText}`;
}

function addCustomizedItemToCart() {
  if (!currentMenuItem) return;

  const size = sizeSelect.value;
  const ice = iceSelect.value;
  const sugar = sugarSelect.value;
  const toppings = getSelectedToppings();
  const finalPrice = calculateItemPrice(currentMenuItem.price);

  cart.push({
    name: currentMenuItem.name,
    detail: buildCustomizationText(size, ice, sugar, toppings),
    price: finalPrice
  });

  renderCart();
  closeCustomizeModal();
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  subtotalEl.textContent = formatMoney(subtotal);
  taxEl.textContent = formatMoney(tax);
  totalEl.textContent = formatMoney(total);
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No items yet. Tap a drink to begin.";
    cartList.appendChild(empty);
  } else {
    cart.forEach((item) => {
      const row = document.createElement("li");
      row.className = "cart-row";
      row.innerHTML = `
        <div>
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-detail">${item.detail}</p>
        </div>
        <span>${formatMoney(item.price)}</span>
      `;
      cartList.appendChild(row);
    });
  }

  updateTotals();
}

sizeSelect.addEventListener("change", updatePreviewPrice);
iceSelect.addEventListener("change", updatePreviewPrice);
sugarSelect.addEventListener("change", updatePreviewPrice);
addCustomItemBtn.addEventListener("click", addCustomizedItemToCart);
cancelCustomItemBtn.addEventListener("click", closeCustomizeModal);
clearTicketBtn.addEventListener("click", () => {
  cart = [];
  renderCart();
});

renderMenu();
renderCart();
