const categoryBar = document.getElementById("category-bar");
const menuGrid = document.getElementById("menu-grid");
const statusText = document.getElementById("customer-status");
const selectedItemBox = document.getElementById("selected-item-box");
const selectedItemTotal = document.getElementById("selected-item-total");
const nextCustomizeLink = document.getElementById("next-customize-link");

let menuItems = [];
let activeCategory = "";

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
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

function saveSelectedMenuItem(item) {
  const customerOrder = {
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    basePrice: Number(item.price),
  };

  sessionStorage.setItem("customerSelectedMenuItem", JSON.stringify(customerOrder));
  sessionStorage.removeItem("customerCustomizedOrder");
  renderSelectedItem(customerOrder);
}

function renderSelectedItem(item) {
  const cart = loadCart();

  if (!item) {
    if (cart.length === 0) {
      selectedItemBox.innerHTML = "<p>No item selected yet.</p>";
      selectedItemTotal.textContent = "Total: $0.00";
      nextCustomizeLink.classList.add("is-disabled");
      nextCustomizeLink.setAttribute("aria-disabled", "true");
      return;
    }

    renderCartSummary(cart);
    return;
  }

  selectedItemBox.innerHTML = `
    <p><strong>${item.itemName}</strong></p>
    <p>Category: ${item.category}</p>
    <p>Base Price: ${formatMoney(item.basePrice)}</p>
  `;
  const cartTotal = cart.reduce((sum, cartItem) => sum + Number(cartItem.totalPrice || 0), 0);
  const displayTotal = cartTotal > 0 ? cartTotal : Number(item.basePrice);
  selectedItemTotal.textContent = `Total: ${formatMoney(displayTotal)}`;
  nextCustomizeLink.classList.remove("is-disabled");
  nextCustomizeLink.setAttribute("aria-disabled", "false");
}

function renderCartSummary(cart) {
  if (cart.length === 0) {
    selectedItemBox.innerHTML = "<p>No item selected yet.</p>";
    selectedItemTotal.textContent = "Total: $0.00";
    return;
  }

  selectedItemBox.innerHTML = cart
    .map(
      (item, index) => `
        <p><strong>Item ${index + 1}: ${item.itemName}</strong></p>
        <p>Size: ${item.size}</p>
        <p>Ice: ${item.ice}</p>
        <p>Sugar: ${item.sugar}</p>
        <p>Toppings: ${item.toppings.length ? item.toppings.join(", ") : "None"}</p>
        <p>Item Total: ${formatMoney(item.totalPrice)}</p>
      `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  selectedItemTotal.textContent = `Total: ${formatMoney(total)}`;
  nextCustomizeLink.classList.remove("is-disabled");
  nextCustomizeLink.setAttribute("aria-disabled", "false");
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

function renderMenuItems() {
  const visibleItems = menuItems.filter((item) => item.category === activeCategory);
  menuGrid.innerHTML = "";

  visibleItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-item-box";
    card.innerHTML = `
      <h2>${item.name}</h2>
      <p class="price-text">${formatMoney(item.price)}</p>
      <button class="item-button" type="button">Add</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      saveSelectedMenuItem(item);
      statusText.textContent = `${item.name} loaded from database. Opening customization.`;
      window.location.href = "customer-customize.html";
    });

    menuGrid.appendChild(card);
  });
}

async function loadMenuItems() {
  try {
    const response = await fetch("/api/menu-items");
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

    const items = await response.json();
    menuItems = Array.isArray(items) ? items : [];

    if (menuItems.length === 0) {
      statusText.textContent = "No menu items were returned from the database.";
      menuGrid.innerHTML = '<article class="menu-item-box skeleton-box"><h2>No menu items available</h2></article>';
      return;
    }

    renderCategories();
    renderMenuItems();
    statusText.textContent = "Menu items loaded from the database.";
  } catch (error) {
    statusText.textContent = `Could not load menu items from the database. ${error.message}`;
    menuGrid.innerHTML = '<article class="menu-item-box skeleton-box"><h2>Menu unavailable</h2><p class="price-text">Database load failed</p></article>';
  }
}

const savedItem = sessionStorage.getItem("customerSelectedMenuItem");
renderSelectedItem(savedItem ? JSON.parse(savedItem) : null);
loadMenuItems();
