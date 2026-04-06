const checkoutOrderBox = document.getElementById("checkout-order-box");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutStatus = document.getElementById("checkout-status");
const finishOrderButton = document.getElementById("finish-order-button");
const finishedBox = document.getElementById("finished-box");
const customerNameInput = document.getElementById("customer-name");
const pickupNoteInput = document.getElementById("pickup-note");

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

function renderOrder(cart) {
  if (cart.length === 0) {
    checkoutOrderBox.innerHTML = "<p>No order available yet.</p>";
    checkoutTotal.textContent = "Total: $0.00";
    checkoutStatus.textContent = "No saved order found. Go back to customization first.";
    return;
  }

  checkoutOrderBox.innerHTML = cart
    .map(
      (order, index) => `
        <p><strong>Item ${index + 1}: ${order.itemName}</strong></p>
        <p>Category: ${order.category}</p>
        <p>Size: ${order.size}</p>
        <p>Ice: ${order.ice}</p>
        <p>Sugar: ${order.sugar}</p>
        <p>Toppings: ${order.toppings.length ? order.toppings.join(", ") : "None"}</p>
        <p>Instructions: ${order.specialInstructions || "None"}</p>
        <p>Item Total: ${formatMoney(order.totalPrice)}</p>
      `
    )
    .join("");

  const total = cart.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  checkoutTotal.textContent = `Total: ${formatMoney(total)}`;
  checkoutStatus.textContent = "Order summary loaded from the saved cart.";
}

finishOrderButton.addEventListener("click", () => {
  const name = customerNameInput.value.trim() || "Guest";
  const pickupNote = pickupNoteInput.value.trim();

  finishedBox.innerHTML = `
    <p>Finished.</p>
    <p>Order prepared for: ${name}</p>
    <p>Pickup note: ${pickupNote || "None"}</p>
  `;

  sessionStorage.removeItem("customerSelectedMenuItem");
  sessionStorage.removeItem("customerCustomizedOrder");
  sessionStorage.removeItem("customerCart");
  checkoutStatus.textContent = "Order finished. You can start a new order now.";
});

renderOrder(loadCart());
