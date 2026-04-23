"use client";

import { useEffect, useMemo, useState } from "react";
import ManagerShell from "../../components/ManagerShell";
import StatusMessage from "../../components/StatusMessage";
import styles from "../../manager.module.css";

const emptyForm = {
  name: "",
  basePrice: "",
};

function isSeasonalCategory(category) {
  const normalized = String(category || "").trim().toLowerCase();
  return normalized.includes("seasonal");
}

export default function SeasonalReportPage() {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ type: "", text: "" });

  async function loadSeasonalItems() {
    try {
      const response = await fetch("/api/menu");
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message || "Failed to load menu items.");
      }

      setItems((payload.data || []).filter((item) => isSeasonalCategory(item.category)));
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to load seasonal menu items." });
    }
  }

  useEffect(() => {
    loadSeasonalItems();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const parsedPrice = Number(form.basePrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setStatus({ type: "error", text: "Base price must be a non-negative number." });
      return;
    }

    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: "Seasonal",
          basePrice: parsedPrice,
          isAvailable: true,
          recipe: [],
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload?.error?.message || payload?.error || "Failed to create seasonal item.");
      }

      setStatus({ type: "ok", text: "Seasonal menu item created." });
      setForm(emptyForm);
      await loadSeasonalItems();
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to create seasonal menu item." });
    }
  }

  const itemCount = useMemo(() => items.length, [items]);

  return (
    <ManagerShell title="New Seasonal Menu Item" subtitle="Create and review seasonal offerings">
      <section className={styles.section}>
        <StatusMessage status={status} />
        <form onSubmit={onSubmit}>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={form.name}
              placeholder="Seasonal item name"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              placeholder="Base price"
              onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
              required
            />
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
              Add Seasonal Item
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Seasonal Menu Items ({itemCount})</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>No seasonal menu items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.basePrice}</td>
                    <td>{item.isAvailable ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ManagerShell>
  );
}
