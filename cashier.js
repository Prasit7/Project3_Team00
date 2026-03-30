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

const TAX_RATE = 0.0825;

const menuGrid = document.getElementById("menu-grid");
const cartList = document.getElementById("cart-list");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");

let cart = [];

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

function addItemToCart(item) {
  cart.push(item);
  renderCart();
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
    button.addEventListener("click", () => addItemToCart(item));
    menuGrid.appendChild(button);
  });
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
        <span>${item.name}</span>
        <span>${formatMoney(item.price)}</span>
      `;
      cartList.appendChild(row);
    });
  }

  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  subtotalEl.textContent = formatMoney(subtotal);
  taxEl.textContent = formatMoney(tax);
  totalEl.textContent = formatMoney(total);
}

renderMenu();
renderCart();
