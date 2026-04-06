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

function loadOrder() {
  const storedOrder = sessionStorage.getItem("customerCustomizedOrder");
  if (!storedOrder) return null;

  try {
    return JSON.parse(storedOrder);
  } catch (_error) {
    return null;
  }
}

function renderOrder(order) {
  if (!order) {
    checkoutOrderBox.innerHTML = "<p>No order available yet.</p>";
    checkoutTotal.textContent = "Total: $0.00";
    checkoutStatus.textContent = "No saved customized order found. Go back to customization first.";
    return;
  }

  checkoutOrderBox.innerHTML = `
    <p><strong>${order.itemName}</strong></p>
    <p>Category: ${order.category}</p>
    <p>Size: ${order.size}</p>
    <p>Ice: ${order.ice}</p>
    <p>Sugar: ${order.sugar}</p>
    <p>Toppings: ${order.toppings.length ? order.toppings.join(", ") : "None"}</p>
    <p>Instructions: ${order.specialInstructions || "None"}</p>
  `;
  checkoutTotal.textContent = `Total: ${formatMoney(order.totalPrice)}`;
  checkoutStatus.textContent = "Order summary loaded from the saved customer order.";
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
  checkoutStatus.textContent = "Order finished. You can start a new order now.";
});

renderOrder(loadOrder());
