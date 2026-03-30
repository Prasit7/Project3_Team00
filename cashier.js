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
const discountAmountEl = document.getElementById("discount-amount");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const clearTicketBtn = document.getElementById("clear-ticket");
const discountInput = document.getElementById("discount-input");
const applyDiscountBtn = document.getElementById("apply-discount");
const clearDiscountBtn = document.getElementById("clear-discount");
const itemSearch = document.getElementById("item-search");
const clockEl = document.getElementById("clock");
const ticketIdEl = document.getElementById("ticket-id");
const statusBannerEl = document.getElementById("status-banner");
const holdOrderBtn = document.getElementById("hold-order");
const payCashBtn = document.getElementById("pay-cash");
const payCardBtn = document.getElementById("pay-card");
const payMobileBtn = document.getElementById("pay-mobile");

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
let currentEditIndex = null;
let discountPercent = 0;
let ticketNumber = 1001;
let heldOrderCount = 0;

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function showStatus(message) {
  statusBannerEl.textContent = message;
}

function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function updateTicketDisplay() {
  ticketIdEl.textContent = `Ticket #${ticketNumber}`;
}

function renderMenu(filterText = "") {
  menuGrid.innerHTML = "";
  const normalized = filterText.trim().toLowerCase();
  const filtered = menuItems.filter((item) => item.name.toLowerCase().includes(normalized));

  filtered.forEach((item) => {
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

function renderToppings(selectedNames = []) {
  toppingsList.innerHTML = "";

  toppingOptions.forEach((topping, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "topping-option";
    wrapper.innerHTML = `
      <input type="checkbox" value="${index}" />
      <span>${topping.name} (+${formatMoney(topping.price)})</span>
    `;
    const checkbox = wrapper.querySelector("input");
    if (selectedNames.includes(topping.name)) checkbox.checked = true;
    checkbox.addEventListener("change", updatePreviewPrice);
    toppingsList.appendChild(wrapper);
  });
}

function openCustomizeModal(item, existing = null, editIndex = null) {
  currentMenuItem = item;
  currentEditIndex = editIndex;
  modalDrinkName.textContent = item.name;
  modalBasePrice.textContent = formatMoney(item.price);

  if (existing) {
    sizeSelect.value = existing.customization.size;
    iceSelect.value = existing.customization.ice;
    sugarSelect.value = existing.customization.sugar;
    renderToppings(existing.customization.toppings);
    addCustomItemBtn.textContent = "Update Item";
  } else {
    sizeSelect.value = "Regular";
    iceSelect.value = "Regular Ice";
    sugarSelect.value = "100%";
    renderToppings();
    addCustomItemBtn.textContent = "Add to Ticket";
  }

  updatePreviewPrice();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeCustomizeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  currentMenuItem = null;
  currentEditIndex = null;
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

function addOrUpdateCustomizedItem() {
  if (!currentMenuItem) return;

  const size = sizeSelect.value;
  const ice = iceSelect.value;
  const sugar = sugarSelect.value;
  const toppings = getSelectedToppings();
  const finalPrice = calculateItemPrice(currentMenuItem.price);

  const cartItem = {
    name: currentMenuItem.name,
    detail: buildCustomizationText(size, ice, sugar, toppings),
    customization: {
      size,
      ice,
      sugar,
      toppings: toppings.map((t) => t.name)
    },
    price: finalPrice
  };

  if (currentEditIndex === null) {
    cart.push(cartItem);
    showStatus(`${cartItem.name} added to ticket.`);
  } else {
    cart[currentEditIndex] = cartItem;
    showStatus(`${cartItem.name} updated.`);
  }

  renderCart();
  closeCustomizeModal();
}

function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  return { subtotal, discountAmount, tax, total };
}

function updateTotals() {
  const { subtotal, discountAmount, tax, total } = calculateTotals();
  subtotalEl.textContent = formatMoney(subtotal);
  discountAmountEl.textContent = `-${formatMoney(discountAmount)}`;
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
    cart.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-row-main">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-detail">${item.detail}</p>
          <div class="cart-row-actions">
            <button class="edit-item" type="button" data-index="${index}">Edit</button>
            <button class="delete-item" type="button" data-index="${index}">Delete</button>
          </div>
        </div>
        <span class="cart-row-price">${formatMoney(item.price)}</span>
      `;
      cartList.appendChild(row);
    });
  }

  updateTotals();
}

function applyDiscount() {
  const raw = Number(discountInput.value);
  if (Number.isNaN(raw)) return;
  const clamped = Math.max(0, Math.min(100, raw));
  discountPercent = clamped;
  discountInput.value = clamped.toFixed(2).replace(/\.00$/, "");
  updateTotals();
  showStatus(`Applied ${discountPercent}% discount.`);
}

function clearDiscount() {
  discountPercent = 0;
  discountInput.value = "";
  updateTotals();
}

function clearCurrentTicket() {
  cart = [];
  clearDiscount();
  renderCart();
}

function advanceTicket() {
  ticketNumber += 1;
  updateTicketDisplay();
}

function holdCurrentOrder() {
  if (cart.length === 0) {
    showStatus("Cannot hold an empty ticket.");
    return;
  }

  heldOrderCount += 1;
  const heldTotal = calculateTotals().total;
  clearCurrentTicket();
  showStatus(`Held order #${heldOrderCount} (${formatMoney(heldTotal)}).`);
  advanceTicket();
}

function processPayment(methodName) {
  if (cart.length === 0) {
    showStatus("Cannot process payment. Ticket is empty.");
    return;
  }

  const finalTotal = calculateTotals().total;
  showStatus(`${methodName} payment accepted for ${formatMoney(finalTotal)}.`);
  clearCurrentTicket();
  advanceTicket();
}

cartList.addEventListener("click", (event) => {
  const target = event.target;

  if (target.classList.contains("delete-item")) {
    const index = Number(target.dataset.index);
    const removedName = cart[index]?.name || "Item";
    cart.splice(index, 1);
    renderCart();
    showStatus(`${removedName} removed from ticket.`);
    return;
  }

  if (target.classList.contains("edit-item")) {
    const index = Number(target.dataset.index);
    const item = cart[index];
    const menuItem = menuItems.find((m) => m.name === item.name);
    if (menuItem) openCustomizeModal(menuItem, item, index);
  }
});

sizeSelect.addEventListener("change", updatePreviewPrice);
iceSelect.addEventListener("change", updatePreviewPrice);
sugarSelect.addEventListener("change", updatePreviewPrice);
addCustomItemBtn.addEventListener("click", addOrUpdateCustomizedItem);
cancelCustomItemBtn.addEventListener("click", closeCustomizeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeCustomizeModal();
});

clearTicketBtn.addEventListener("click", () => {
  clearCurrentTicket();
  showStatus("Current ticket cleared.");
});

holdOrderBtn.addEventListener("click", holdCurrentOrder);
payCashBtn.addEventListener("click", () => processPayment("Cash"));
payCardBtn.addEventListener("click", () => processPayment("Card"));
payMobileBtn.addEventListener("click", () => processPayment("Mobile"));

applyDiscountBtn.addEventListener("click", applyDiscount);
clearDiscountBtn.addEventListener("click", () => {
  clearDiscount();
  showStatus("Discount cleared.");
});

itemSearch.addEventListener("input", (event) => renderMenu(event.target.value));

renderMenu();
renderCart();
updateTicketDisplay();
updateClock();
setInterval(updateClock, 60000);
