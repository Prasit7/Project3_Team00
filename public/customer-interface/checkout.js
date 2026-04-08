const checkoutOrderBox = document.getElementById("checkout-order-box");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutStatus = document.getElementById("checkout-status");
const payButton = document.getElementById("pay-button");
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

function resetOrderSummary() {
  renderOrder([]);
}

function buildOrderPayload(cart) {
  return {
    status: "completed",
    paymentMethod: "customer-kiosk",
    items: cart.map((order) => ({
      id: Number(order.itemId),
      quantity: 1,
      price: Number(order.totalPrice),
      modifiers: [order.size, order.ice, order.sugar, ...(order.toppings || [])].filter(Boolean),
    })),
  };
}

async function submitOrder(cart) {
  const response = await fetch("/api/cashier/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildOrderPayload(cart)),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `Submit failed (${response.status})`);
  }

  return payload;
}

payButton.addEventListener("click", async () => {
  const cart = loadCart();
  if (cart.length === 0) {
    checkoutStatus.textContent = "No order available yet. Go back to customization first.";
    return;
  }

  payButton.disabled = true;
  const originalButtonText = payButton.textContent;
  payButton.textContent = "Processing...";
  checkoutStatus.textContent = "Submitting order to database...";

  try {
    const payload = await submitOrder(cart);
    sessionStorage.removeItem("customerSelectedMenuItem");
    sessionStorage.removeItem("customerCustomizedOrder");
    sessionStorage.removeItem("customerCart");
    customerNameInput.value = "";
    pickupNoteInput.value = "";
    resetOrderSummary();
    checkoutStatus.textContent = `Payment complete. Order #${payload.orderId} saved to the database.`;
  } catch (error) {
    checkoutStatus.textContent = `Payment failed. ${error.message}`;
  } finally {
    payButton.disabled = false;
    payButton.textContent = originalButtonText;
  }
});

renderOrder(loadCart());
