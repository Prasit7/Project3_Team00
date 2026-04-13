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
    noItemSelected: "No item selected yet.",
    statusLoaded: "Menu items loaded from the database.",
    statusError: "Could not load menu items from the database.",

    // customer kiosk - customize page
    customizeTitle: "Customize Your Drink",
    customizeStep: "Step 2 of 3: Choose size, ice, sugar, and toppings.",
    selectedDrink: "Selected Drink",
    size: "Size",
    iceLevel: "Ice Level",
    sugarLevel: "Sugar Level",
    toppings: "Toppings",
    specialInstructions: "Special Instructions",
    currentOrder: "Current Order",
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
    backToCustomize: "Back to Customization",
    startNewOrder: "Start New Order",
    pay: "Pay",
    processing: "Processing...",

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
    noItemSelected: "Ningún artículo seleccionado.",
    statusLoaded: "Artículos del menú cargados correctamente.",
    statusError: "No se pudo cargar el menú desde la base de datos.",

    // customer kiosk - customize page
    customizeTitle: "Personaliza tu Bebida",
    customizeStep: "Paso 2 de 3: Elige tamaño, hielo, azúcar y toppings.",
    selectedDrink: "Bebida Seleccionada",
    size: "Tamaño",
    iceLevel: "Nivel de Hielo",
    sugarLevel: "Nivel de Azúcar",
    toppings: "Toppings",
    specialInstructions: "Instrucciones Especiales",
    currentOrder: "Pedido Actual",
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
    backToCustomize: "Regresar a Personalización",
    startNewOrder: "Iniciar Nuevo Pedido",
    pay: "Pagar",
    processing: "Procesando...",

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
}