// accessibility.js and translations.js handle the toolbar and language switching.
// Keep this file in place so future portal behavior has a dedicated home.
document.addEventListener("DOMContentLoaded", () => {
  if (typeof applyTranslations === "function") applyTranslations();
});
