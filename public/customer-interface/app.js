const startOrderButton = document.querySelector(".primary-button");

if (startOrderButton) {
  startOrderButton.addEventListener("click", () => {
    startOrderButton.textContent = "Menu loading next";
    startOrderButton.disabled = true;
  });
}
