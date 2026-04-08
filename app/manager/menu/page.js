"use client";

import { useEffect, useState } from "react";
import ManagerShell from "../components/ManagerShell";
import StatusMessage from "../components/StatusMessage";
import styles from "../manager.module.css";

const emptyForm = {
  name: "",
  category: "",
  basePrice: "",
  isAvailable: true,
  recipe: [{ inventoryItemId: "", quantityRequired: "" }],
};

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function loadMenu() {
    setLoading(true);
    try {
      const [menuRes, inventoryRes] = await Promise.all([fetch("/api/menu"), fetch("/api/inventory")]);
      const [menuJson, inventoryJson] = await Promise.all([menuRes.json(), inventoryRes.json()]);

      if (!menuJson.ok) throw new Error(menuJson.error?.message || "Failed to load menu.");
      if (!inventoryJson.ok) throw new Error(inventoryJson.error?.message || "Failed to load inventory.");

      setItems(menuJson.data);
      setInventoryItems(inventoryJson.data);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function onEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      basePrice: String(item.basePrice),
      isAvailable: item.isAvailable,
      recipe:
        item.recipe.length > 0
          ? item.recipe.map((entry) => ({
              inventoryItemId: String(entry.inventoryItemId),
              quantityRequired: String(entry.quantityRequired),
            }))
          : [{ inventoryItemId: "", quantityRequired: "" }],
    });
  }

  function updateRecipeRow(index, field, value) {
    setForm((prev) => {
      const nextRecipe = [...prev.recipe];
      nextRecipe[index] = { ...nextRecipe[index], [field]: value };
      return { ...prev, recipe: nextRecipe };
    });
  }

  function addRecipeRow() {
    setForm((prev) => ({
      ...prev,
      recipe: [...prev.recipe, { inventoryItemId: "", quantityRequired: "" }],
    }));
  }

  function removeRecipeRow(index) {
    setForm((prev) => {
      if (prev.recipe.length === 1) {
        return prev;
      }
      const nextRecipe = prev.recipe.filter((_, i) => i !== index);
      return { ...prev, recipe: nextRecipe };
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const recipe = form.recipe
      .filter((entry) => entry.inventoryItemId !== "" && entry.quantityRequired !== "")
      .map((entry) => ({
        inventoryItemId: Number(entry.inventoryItemId),
        quantityRequired: Number(entry.quantityRequired),
      }));

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      basePrice: Number(form.basePrice),
      isAvailable: Boolean(form.isAvailable),
      recipe,
    };

    const url = editingId ? `/api/menu/${editingId}` : "/api/menu";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Save failed.");

      setStatus({ type: "ok", text: editingId ? "Menu item updated." : "Menu item created." });
      resetForm();
      await loadMenu();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  async function onDelete(id) {
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Delete failed.");
      setStatus({ type: "ok", text: "Menu item removed." });
      if (editingId === id) resetForm();
      await loadMenu();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  return (
    <ManagerShell title="Menu Manager" subtitle="Edit menu items and recipe mappings">
      <section className={styles.section}>
        <StatusMessage status={status} />
        <form onSubmit={onSubmit}>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={form.name}
              placeholder="Item name"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              className={styles.input}
              value={form.category}
              placeholder="Category"
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              required
            />
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              placeholder="Base price"
              onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))}
              required
            />
            <label>
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              />
              Available
            </label>
          </div>

          <h3>Recipe</h3>
          {form.recipe.map((entry, index) => (
            <div className={styles.recipeRow} key={`recipe-${index}`}>
              <select
                className={styles.select}
                value={entry.inventoryItemId}
                onChange={(e) => updateRecipeRow(index, "inventoryItemId", e.target.value)}
              >
                <option value="">Select inventory item</option>
                {inventoryItems.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                type="number"
                min="0.01"
                step="0.01"
                value={entry.quantityRequired}
                placeholder="Quantity required"
                onChange={(e) => updateRecipeRow(index, "quantityRequired", e.target.value)}
              />
              <button
                className={`${styles.button} ${styles.buttonDanger}`}
                type="button"
                onClick={() => removeRecipeRow(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={addRecipeRow}>
              Add Recipe Item
            </button>
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
              {editingId ? "Update Menu Item" : "Add Menu Item"}
            </button>
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Menu Items</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Available</th>
                <th>Recipe Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7}>No menu items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.basePrice}</td>
                    <td>{item.isAvailable ? "Yes" : "No"}</td>
                    <td>{item.recipe.length}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          type="button"
                          onClick={() => onEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${styles.button} ${styles.buttonDanger}`}
                          type="button"
                          onClick={() => onDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
