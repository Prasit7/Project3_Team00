"use client";

import { useEffect, useState } from "react";
import ManagerShell from "../components/ManagerShell";
import StatusMessage from "../components/StatusMessage";
import styles from "../manager.module.css";

const emptyForm = { name: "", quantityOnHand: "", unit: "" };

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed to load inventory.");
      setItems(json.data);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function onEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      quantityOnHand: String(item.quantityOnHand),
      unit: item.unit,
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const payload = {
      name: form.name.trim(),
      quantityOnHand: Number(form.quantityOnHand),
      unit: form.unit.trim(),
    };

    const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Save failed.");

      setStatus({ type: "ok", text: editingId ? "Inventory item updated." : "Inventory item created." });
      resetForm();
      await loadItems();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  async function onDelete(id) {
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Delete failed.");
      setStatus({ type: "ok", text: "Inventory item removed." });
      if (editingId === id) resetForm();
      await loadItems();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  return (
    <ManagerShell title="Inventory Manager" subtitle="Add, edit, and remove inventory items">
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
              type="number"
              min="0"
              step="0.01"
              value={form.quantityOnHand}
              placeholder="Quantity"
              onChange={(e) => setForm((prev) => ({ ...prev, quantityOnHand: e.target.value }))}
              required
            />
            <input
              className={styles.input}
              value={form.unit}
              placeholder="Unit (oz, unit, etc.)"
              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
              required
            />
          </div>
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
              {editingId ? "Update Item" : "Add Item"}
            </button>
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Inventory Items</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={5}>No inventory items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.quantityOnHand}</td>
                    <td>{item.unit}</td>
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
