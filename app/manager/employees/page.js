"use client";

import { useEffect, useState } from "react";
import ManagerShell from "../components/ManagerShell";
import StatusMessage from "../components/StatusMessage";
import styles from "../manager.module.css";

const emptyForm = { firstName: "", lastName: "", role: "", isActive: true, hourlyRate: 15 };

export default function EmployeesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed to load employees.");
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
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role,
      isActive: item.isActive,
      hourlyRate: item.hourlyRate ?? 15,  
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
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role.trim(),
      isActive: Boolean(form.isActive),
      hourlyRate: Number(form.hourlyRate),
    };

    const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Save failed.");

      setStatus({ type: "ok", text: editingId ? "Employee updated." : "Employee created." });
      resetForm();
      await loadItems();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  async function onDelete(id) {
    setStatus({ type: "", text: "" });
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Delete failed.");
      setStatus({ type: "ok", text: "Employee removed." });
      if (editingId === id) resetForm();
      await loadItems();
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    }
  }

  return (
    <ManagerShell title="Employee Manager" subtitle="Add, update, and remove employees">
      <section className={styles.section}>
        <StatusMessage status={status} />
        <form onSubmit={onSubmit}>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={form.firstName}
              placeholder="First name"
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              required
            />
            <input
              className={styles.input}
              value={form.lastName}
              placeholder="Last name"
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              required
            />
            <input
              className={styles.input}
              value={form.role}
              placeholder="Role"
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              required
            />
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={form.hourlyRate}
              placeholder="Hourly rate"
              onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
              required
            />
          </div>
          <div className={styles.actions}>
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
              {editingId ? "Update Employee" : "Add Employee"}
            </button>
            <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Employees</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Role</th>
                <th>Active</th>
                <th>Hourly Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7}>No employees found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.firstName}</td>
                    <td>{item.lastName}</td>
                    <td>{item.role}</td>
                    <td>{item.isActive ? "Yes" : "No"}</td>
                    <td>${(item.hourlyRate ?? 15).toFixed(2)}</td>
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
