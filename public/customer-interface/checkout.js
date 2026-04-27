const checkoutOrderBox = document.getElementById("checkout-order-box");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutStatus = document.getElementById("checkout-status");
const payButton = document.getElementById("pay-button");
const cancelOrderButton = document.getElementById("cancel-order-button");
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
  grassjellymilktea: "grassjelly.jpg",
  grassjellymilk: "grassjelly.jpg",
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
  pistachiomilktea: "pistachio.jpg",
  pistachiotea: "pistachio.jpg",
  caramelpuddingmilktea: "caramelpudding.jpg",
  caramelpuddingtea: "caramelpudding.jpg",
  grapefruittea: "grapefruit.jpg",
  grapefruitgreentea: "grapefruit.jpg",
  grapefruitblacktea: "grapefruit.jpg",
  kiwitea: "kiwi.jpg",
  kiwibasilgreentea: "kiwi.jpg",
  kiwigreentea: "kiwi.jpg",
  kiwiblacktea: "kiwi.jpg",
  yuzuoolongtea: "yuzuoolong.jpg",
  yuzuoolong: "yuzuoolong.jpg",
  pomegranatetea: "pomogranate.jpg",
  pomegranatemintoolongtea: "pomogranate.jpg",
  pomegranategreentea: "pomogranate.jpg",
  pomegranateblacktea: "pomogranate.jpg",
  pomogranatetea: "pomogranate.jpg",
  pomogranategreentea: "pomogranate.jpg",
  pomogranateblacktea: "pomogranate.jpg",
  poogranatetea: "pomogranate.jpg",
  dragonfruittea: "dragonfruit.jpg",
  dragonfruitlemongreentea: "dragonfruit.jpg",
  dragonfruitgreentea: "dragonfruit.jpg",
  dragonfruitblacktea: "dragonfruit.jpg",
  cranberrytea: "cranberrty.jpg",
  cranberryapplegreentea: "cranberryapple.jpg",
  cranberrygreentea: "cranberrty.jpg",
  cranberryblacktea: "cranberrty.jpg",
  cranberrtytea: "cranberrty.jpg",
  bloodorangetea: "bloodorange.jpg",
  bloodorangehibiscustea: "bloodorange.jpg",
  bloodorangegreentea: "bloodorange.jpg",
  bloodorangeblacktea: "bloodorange.jpg",
  guavatea: "guava.jpg",
  guavacalamansigreentea: "guava.jpg",
  guavagreentea: "guava.jpg",
  guavablacktea: "guava.jpg",
  blacksesamemilktea: "blacksesame.jpg",
  blacksesametea: "blacksesame.jpg",
  hokkaidomilktea: "hokkaido.jpg",
  hokkaidotea: "hokkaido.jpg",
  okinawamilktea: "okinawa.jpg",
  okinawaroastedmilktea: "okinawa.jpg",
  okinawatea: "okinawa.jpg",
  blueberryjasminetea: "blueberryjasminetea.jpg",
  blueberryjasmineblacktea: "blueberryjasminetea.jpg",
  blueberryjasmine: "blueberryjasminetea.jpg",
  blueberryjasminemilktea: "blueberryjasminetea.jpg",
  pineapplejasminetea: "pineapplejasmine.jpg",
  pineapplejasmine: "pineapplejasmine.jpg",
  pineapplejasminemilktea: "pineapplejasmine.jpg",
  mangopineapplesmoothie: "pineapplejasmine.jpg",
  blueberryacaismoothie: "blueberryjasminetea.jpg",
  strawberrybananasmoothie: "strawberrymilk.jpg",
};

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function getUiLang() {
  return (localStorage.getItem("lang") || document.documentElement.getAttribute("lang") || "en").toLowerCase();
}

function isSpanishUi() {
  return getUiLang() === "es";
}

function translateUi(enText, esText) {
  return isSpanishUi() ? esText : enText;
}

function translateDrinkName(name) {
  if (!isSpanishUi()) return String(name || "");
  return String(name || "")
    .replace(/Milk Tea/gi, "Te con leche")
    .replace(/Fruit Tea/gi, "Te de fruta")
    .replace(/Green Tea/gi, "Te verde")
    .replace(/Black Tea/gi, "Te negro")
    .replace(/Oolong Tea/gi, "Te oolong")
    .replace(/Jasmine Tea/gi, "Te de jazmin")
    .replace(/Smoothie/gi, "Batido");
}

function translateCategoryName(category) {
  if (!isSpanishUi()) return String(category || "");
  return String(category || "")
    .replace(/Milk Tea/gi, "Te con leche")
    .replace(/Fruit Tea/gi, "Te de fruta")
    .replace(/Smoothie/gi, "Batido")
    .replace(/Special/gi, "Especial");
}

function translateModifierValue(value) {
  if (!isSpanishUi()) return String(value || "");
  return String(value || "")
    .replace(/\bCold\b/gi, "Frio")
    .replace(/\bHot\b/gi, "Caliente")
    .replace(/\bNo Ice\b/gi, "Sin hielo")
    .replace(/\bLess Ice\b/gi, "Menos hielo")
    .replace(/\bRegular Ice\b/gi, "Hielo regular")
    .replace(/\bExtra Ice\b/gi, "Hielo extra")
    .replace(/\bNo Sugar\b/gi, "Sin azucar")
    .replace(/\bLight Sugar\b/gi, "Azucar ligera")
    .replace(/\bHalf Sugar\b/gi, "Media azucar")
    .replace(/\bLess Sugar\b/gi, "Menos azucar")
    .replace(/\bNormal Sugar\b/gi, "Azucar normal")
    .replace(/\bExtra Sugar\b/gi, "Azucar extra")
    .replace(/\bLarge\b/gi, "Grande");
}

function formatSizeLabel(sizeValue) {
  if (sizeValue === "Regular") return "Regular - 16oz";
  if (sizeValue === "Large") return "Large - 20oz";
  return sizeValue;
}

function isSmoothieCategory(category) {
  return String(category || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .includes("smoothie");
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
    ["jasminegreen", "jasminegreen.jpg"],
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

function cancelCurrentOrder() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  sessionStorage.removeItem("customerSelectedMenuItem");
  sessionStorage.removeItem("customerCustomizedOrder");
  sessionStorage.removeItem("customerCart");
  window.location.href = "index.html";
}

function showPaymentSuccessModal(orderId) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  paymentSuccessMessage.textContent = `Payment complete. Order #${orderId} is confirmed.`;
  paymentSuccessOverlay.classList.remove("is-hidden");
  document.body.classList.add("modal-open");

  let secondsLeft = 15;
  paymentSuccessCountdown.textContent = `Starting a new order in ${secondsLeft}s`;

  countdownTimer = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      goToNewOrder();
      return;
    }
    paymentSuccessCountdown.textContent = `Starting a new order in ${secondsLeft}s`;
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
    checkoutOrderBox.innerHTML = `<p>${translateUi("No order available yet.", "Aun no hay pedido disponible.")}</p>`;
    checkoutTotal.textContent = `${translateUi("Total", "Total")}: ${formatMoney(0)}`;
    checkoutStatus.textContent = translateUi("No order available yet.", "Aun no hay pedido disponible.");
    return;
  }

  checkoutOrderBox.innerHTML = cart
    .map(
      (order, index) => {
        const temperatureLine = isSmoothieCategory(order.category)
          ? ""
          : `<p>${translateUi("Temperature", "Temperatura")}: ${translateModifierValue(order.temperature || "Cold")}</p>`;
        return `
        <article class="checkout-item-row">
          <div class="checkout-item-media" aria-hidden="true">
            ${
              getItemImagePath(order.itemName)
                ? `<img src="${getItemImagePath(order.itemName)}" alt="${order.itemName}" class="menu-item-image" loading="lazy" />`
                : "Image"
            }
          </div>
          <div class="checkout-item-content">
            <p><strong>${translateUi("Item", "Articulo")} ${index + 1}: ${translateDrinkName(order.itemName)}</strong></p>
            <p>${translateUi("Category", "Categoria")}: ${translateCategoryName(order.category)}</p>
            <p>${translateUi("Size", "Tamano")}: ${translateModifierValue(formatSizeLabel(order.size))}</p>
            <p>${translateUi("Quantity", "Cantidad")}: ${Number(order.quantity || 1)}</p>
            ${temperatureLine}
            <p>${translateUi("Ice Level", "Nivel de hielo")}: ${translateModifierValue(order.ice)}</p>
            <p>${translateUi("Sugar Level", "Nivel de azucar")}: ${translateModifierValue(order.sugar)}</p>
            <p>${translateUi("Toppings", "Toppings")}: ${order.toppings.length ? order.toppings.map((entry) => translateModifierValue(entry)).join(", ") : translateUi("None", "Ninguno")}</p>
            <p>${translateUi("Special Instructions", "Instrucciones especiales")}: ${order.specialInstructions || translateUi("None", "Ninguno")}</p>
            <p>${translateUi("Item Total", "Total del articulo")}: ${formatMoney(order.totalPrice)}</p>
          </div>
        </article>
      `;
      }
    )
    .join("");

  const total = cart.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  checkoutTotal.textContent = `${translateUi("Total", "Total")}: ${formatMoney(total)}`;
  checkoutStatus.textContent = translateUi(
    "Step 3 of 3: Review the order and complete checkout.",
    "Paso 3 de 3: Revisa el pedido y completa el pago."
  );
}

function resetOrderSummary() {
  renderOrder([]);
}

function buildOrderPayload(cart) {
  return {
    status: "completed",
    paymentMethod: "customer-kiosk",
    items: cart.map((order) => {
      const quantity = Math.max(1, Number(order.quantity || 1));
      const unitPrice = Number.isFinite(Number(order.unitPrice))
        ? Number(order.unitPrice)
        : Number(order.totalPrice || 0) / quantity;

      return {
        id: Number(order.itemId),
        quantity,
        price: unitPrice,
        modifiers: [
          order.size,
          ...(isSmoothieCategory(order.category) ? [] : [order.temperature]),
          order.ice,
          order.sugar,
          ...(order.toppings || []),
        ].filter(Boolean),
      };
    }),
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
    checkoutStatus.textContent = "No order available yet.";
    return;
  }

  payButton.disabled = true;
  const originalButtonText = payButton.textContent;
  payButton.textContent = "Processing...";
  checkoutStatus.textContent = "Submitting your order...";

  try {
    const payload = await submitOrder(cart);
    sessionStorage.removeItem("customerSelectedMenuItem");
    sessionStorage.removeItem("customerCustomizedOrder");
    sessionStorage.removeItem("customerCart");
    resetOrderSummary();
    checkoutStatus.textContent = `Payment complete. Order #${payload.orderId} is confirmed.`;
    showPaymentSuccessModal(payload.orderId);
  } catch (error) {
    checkoutStatus.textContent = `Payment failed. ${error.message}`;
  } finally {
    payButton.disabled = false;
    payButton.textContent = originalButtonText;
  }
});

successNewOrderButton.addEventListener("click", goToNewOrder);
if (cancelOrderButton) {
  cancelOrderButton.addEventListener("click", cancelCurrentOrder);
}

renderOrder(loadCart());
