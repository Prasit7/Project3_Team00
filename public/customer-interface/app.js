const startOrderButton = document.getElementById("start-order-button");
const kioskShell = document.getElementById("kiosk-shell");
const welcomeScreen = document.querySelector(".welcome-screen");
const categoryButtons = document.querySelectorAll(".chip");

if (startOrderButton && kioskShell && welcomeScreen) {
  startOrderButton.addEventListener("click", () => {
    welcomeScreen.classList.add("is-hidden");
    kioskShell.classList.remove("is-hidden");
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});
