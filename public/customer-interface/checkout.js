const checkoutOrderBox = document.getElementById("checkout-order-box");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutStatus = document.getElementById("checkout-status");
const payButton = document.getElementById("pay-button");
const paymentSuccessOverlay = document.getElementById("payment-success-overlay");
const paymentSuccessMessage = document.getElementById("payment-success-message");
const paymentSuccessCountdown = document.getElementById("payment-success-countdown");
const successNewOrderButton = document.getElementById("success-new-order-btn");

let countdownTimer = null;

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

function formatSizeLabel(sizeValue) {
  if (sizeValue === "Regular") return t("sizeRegular");
  if (sizeValue === "Large") return t("sizeLarge");
  return sizeValue;
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
    ["mango", "mangogreen.jpg"],
    ["passion", "passionfruit.jpg"],
    ["lychee", "lycheeblack.jpg"],
    ["peach", "peachoolong.jpg"],
    ["wintermelon", "wintermelon.jpg"],
    ["jasmine", "jasminegreen.jpg"],
    ["cheesefoam", "cheesefoam.jpg"],
    ["fruitteacombo", "fruittea.jpg"],
    ["oreo", "oreomilk.jpg"],
    ["strawberry", "strawberrymilk.jpg"],
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

function goToNewOrder() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  window.location.href = "index.html";
}

function showPaymentSuccessModal(orderId) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  paymentSuccessMessage.textContent = `${t("paymentComplete")} #${orderId} ${t("savedToDatabase")}`;
  paymentSuccessOverlay.classList.remove("is-hidden");
  document.body.classList.add("modal-open");

  let secondsLeft = 15;
  paymentSuccessCountdown.textContent = `${t("autoNewOrderIn")} ${secondsLeft}${t("secondsShort")}`;

  countdownTimer = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      goToNewOrder();
      return;
    }
    paymentSuccessCountdown.textContent = `${t("autoNewOrderIn")} ${secondsLeft}${t("secondsShort")}`;
  }, 1000);
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
    checkoutOrderBox.innerHTML = `<p>${t("noOrder")}</p>`;
    checkoutTotal.textContent = `${t("total")} ${formatMoney(0)}`;
    checkoutStatus.textContent = t("noOrder");
    return;
  }

  checkoutOrderBox.innerHTML = cart
    .map(
      (order, index) => `
        <article class="checkout-item-row">
          <div class="checkout-item-media" aria-hidden="true">
            ${
              getItemImagePath(order.itemName)
                ? `<img src="${getItemImagePath(order.itemName)}" alt="${order.itemName}" class="menu-item-image" loading="lazy" />`
                : "Image"
            }
          </div>
          <div class="checkout-item-content">
            <p><strong>${t("itemWord")} ${index + 1}: ${order.itemName}</strong></p>
            <p>${t("categoryLabel")}: ${order.category}</p>
            <p>${t("size")}: ${formatSizeLabel(order.size)}</p>
            <p>${t("iceLevel")}: ${order.ice}</p>
            <p>${t("sugarLevel")}: ${order.sugar}</p>
            <p>${t("toppings")}: ${order.toppings.length ? order.toppings.join(", ") : t("none")}</p>
            <p>${t("specialInstructions")}: ${order.specialInstructions || t("none")}</p>
            <p>${t("itemTotal")}: ${formatMoney(order.totalPrice)}</p>
          </div>
        </article>
      `
    )
    .join("");

  const total = cart.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  checkoutTotal.textContent = `${t("total")} ${formatMoney(total)}`;
  checkoutStatus.textContent = t("checkoutStep");
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
    checkoutStatus.textContent = t("noOrder");
    return;
  }

  payButton.disabled = true;
  const originalButtonText = payButton.textContent;
  payButton.textContent = t("processing");
  checkoutStatus.textContent = t("submittingOrder");

  try {
    const payload = await submitOrder(cart);
    sessionStorage.removeItem("customerSelectedMenuItem");
    sessionStorage.removeItem("customerCustomizedOrder");
    sessionStorage.removeItem("customerCart");
    resetOrderSummary();
    checkoutStatus.textContent = `${t("paymentComplete")} #${payload.orderId} ${t("savedToDatabase")}`;
    showPaymentSuccessModal(payload.orderId);
  } catch (error) {
    checkoutStatus.textContent = `${t("paymentFailed")} ${error.message}`;
  } finally {
    payButton.disabled = false;
    payButton.textContent = originalButtonText;
  }
});

successNewOrderButton.addEventListener("click", goToNewOrder);

renderOrder(loadCart());
