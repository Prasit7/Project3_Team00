// menuboard.js — Kungfu Boba Menu Board Scripts
// Purpose: Handles the live clock update for the menu board display.
// Note: The menu board is non-interactive; this file only manages
// time-based display updates.

// Live Clock 
// Updates the clock element in the header every second.
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  document.getElementById("clock").textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);