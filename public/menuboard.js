// 🌐 Language toggle
document.getElementById("lang-en").onclick = () => {
  document.documentElement.lang = "en";
};

document.getElementById("lang-es").onclick = () => {
  document.documentElement.lang = "es";
};

// 🎨 High contrast toggle
document.getElementById("toggle-contrast").onclick = () => {
  const html = document.documentElement;
  html.dataset.theme =
    html.dataset.theme === "high-contrast" ? "" : "high-contrast";
};