// EN/ES dictionary for all static public pages.
// Keys match data-i18n attributes in the HTML files and t() calls in JS files.

const translations = {
  en: {
    // portal
    portalTitle: "Zero Sugar Boba Portal Page",
    interfaceOptions: "Interface Options",
    manager: "Manager",
    cashier: "Cashier",
    customerKiosk: "Customer Kiosk",
    menuBoard: "Menu Board",

    // customer kiosk - menu page
    menuTitle: "Choose Your Items",
    menuStep: "Step 1 of 3: Select drinks from the menu.",
    nextCustomize: "Next: Customize Drinks",
    nextCheckout: "Next: Checkout",
    noItemSelected: "No item selected yet.",
    loadingMenu: "Loading menu...",
    menuReady: "Menu is ready.",
    statusError: "Something went wrong. Please try again.",
    loadingCustomization: "Loading customization options...",
    customizationReady: "Customization options are ready.",
    noMenuItems: "No menu items available right now.",
    menuUnavailable: "Menu unavailable",
    databaseLoadFailed: "Please try again soon.",
    tapToCustomize: "Tap to customize",
    openCustomization: "Open customization",
    closeCustomization: "Close customization",
    selectSize: "Select Size",
    baseLabel: "Base",
    categoryLabel: "Category",
    none: "None",
    itemWord: "Item",
    itemTotal: "Item Total",
    removeFromCart: "Remove from cart",
    addedToCartStatus: "added to cart.",
    removedFromCartStatus: "removed from cart.",
    sizeRegular: "Regular - 16oz",
    sizeLarge: "Large - 20oz",

    // customer kiosk - customize page
    customizeTitle: "Customize Your Drink",
    customizeStep: "Step 2 of 3: Choose size, ice, sugar, and toppings.",
    selectedDrink: "Selected Drink",
    size: "Size",
    iceLevel: "Ice Level",
    sugarLevel: "Sugar Level",
    toppings: "Toppings",
    specialInstructions: "Special Instructions",
    optionalNote: "Optional note",
    currentOrder: "Cart",
    noCustomization: "No customization saved yet.",
    addToOrder: "Add to Order",
    orderMore: "Order More",
    checkout: "Checkout",
    backToMenu: "Back to Menu",
    total: "Total:",

    // customer kiosk - checkout page
    checkoutTitle: "Checkout",
    checkoutStep: "Step 3 of 3: Review the order and complete checkout.",
    orderSummary: "Order Summary",
    noOrder: "No order available yet.",
    assistantSpace: "Assistant Space",
    assistantFuture: "Future chatbot / assistant",
    assistantReserved: "Reserved for later",
    backToCustomize: "Back to Customization",
    startNewOrder: "Start New Order",
    pay: "Pay",
    processing: "Processing...",
    submittingOrder: "Submitting your order...",
    paymentComplete: "Payment complete. Order",
    savedToDatabase: "is confirmed.",
    paymentFailed: "Payment failed.",
    paymentSuccessTitle: "Payment Successful",
    autoNewOrderIn: "Starting a new order in",
    secondsShort: "s",
    drinkCustomization: "Drink Customization",

    // menu board
    milkTeas: "Milk Teas",
    fruitTeas: "Fruit Teas",
    teaSpecialty: "Tea & Specialty",
    nowServing: "Now Serving",
  },

  es: {
    // portal
    portalTitle: "Portal de Zero Sugar Boba",
    interfaceOptions: "Opciones de Interfaz",
    manager: "Gerente",
    cashier: "Cajero",
    customerKiosk: "Quiosco de Cliente",
    menuBoard: "Menú Digital",

    // customer kiosk - menu page
    menuTitle: "Elige tus Artículos",
    menuStep: "Paso 1 de 3: Selecciona bebidas del menú.",
    nextCustomize: "Siguiente: Personalizar Bebidas",
    nextCheckout: "Siguiente: Pagar",
    noItemSelected: "Ningún artículo seleccionado.",
    loadingMenu: "Cargando menú...",
    menuReady: "El menú está listo.",
    statusError: "Algo salió mal. Inténtalo de nuevo.",
    loadingCustomization: "Cargando opciones de personalización...",
    customizationReady: "Las opciones de personalización están listas.",
    noMenuItems: "No hay artículos disponibles en este momento.",
    menuUnavailable: "Menú no disponible",
    databaseLoadFailed: "Inténtalo de nuevo en un momento.",
    tapToCustomize: "Toca para personalizar",
    openCustomization: "Abrir personalización",
    closeCustomization: "Cerrar personalización",
    selectSize: "Seleccionar tamaño",
    baseLabel: "Base",
    categoryLabel: "Categoría",
    none: "Ninguno",
    itemWord: "Artículo",
    itemTotal: "Total del artículo",
    removeFromCart: "Eliminar del carrito",
    addedToCartStatus: "agregado al carrito.",
    removedFromCartStatus: "eliminado del carrito.",
    sizeRegular: "Regular - 16oz",
    sizeLarge: "Grande - 20oz",

    // customer kiosk - customize page
    customizeTitle: "Personaliza tu Bebida",
    customizeStep: "Paso 2 de 3: Elige tamaño, hielo, azúcar y toppings.",
    selectedDrink: "Bebida Seleccionada",
    size: "Tamaño",
    iceLevel: "Nivel de Hielo",
    sugarLevel: "Nivel de Azúcar",
    toppings: "Toppings",
    specialInstructions: "Instrucciones Especiales",
    optionalNote: "Nota opcional",
    currentOrder: "Carrito",
    noCustomization: "No hay personalización guardada.",
    addToOrder: "Agregar al Pedido",
    orderMore: "Pedir Más",
    checkout: "Pagar",
    backToMenu: "Regresar al Menú",
    total: "Total:",

    // customer kiosk - checkout page
    checkoutTitle: "Pago",
    checkoutStep: "Paso 3 de 3: Revisa el pedido y completa el pago.",
    orderSummary: "Resumen del Pedido",
    noOrder: "No hay pedido disponible aún.",
    assistantSpace: "Espacio del Asistente",
    assistantFuture: "Chatbot / asistente futuro",
    assistantReserved: "Reservado para después",
    backToCustomize: "Regresar a Personalización",
    startNewOrder: "Iniciar Nuevo Pedido",
    pay: "Pagar",
    processing: "Procesando...",
    submittingOrder: "Enviando tu pedido...",
    paymentComplete: "Pago completado. Pedido",
    savedToDatabase: "está confirmado.",
    paymentFailed: "Pago fallido.",
    paymentSuccessTitle: "Pago Exitoso",
    autoNewOrderIn: "Iniciando un nuevo pedido en",
    secondsShort: "s",
    drinkCustomization: "Personalización de bebida",

    // menu board
    milkTeas: "Tés con Leche",
    fruitTeas: "Tés de Frutas",
    teaSpecialty: "Tés y Especialidades",
    nowServing: "Sirviendo Ahora",
  },
};

// returns the active language
function getLang() {
  return localStorage.getItem("lang") || "en";
}

// returns translated string by key, falls back to English
function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

// applies translations to all elements with a data-i18n attribute
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = t(key);
    if (el.hasAttribute("placeholder")) {
      el.setAttribute("placeholder", value);
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    el.setAttribute("aria-label", t(key));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    el.setAttribute("title", t(key));
  });
}
