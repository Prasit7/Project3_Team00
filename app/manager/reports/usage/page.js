"use client";

import { useMemo, useState } from "react";
import ManagerShell from "../../components/ManagerShell";
import StatusMessage from "../../components/StatusMessage";
import styles from "../../manager.module.css";

function todayDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export default function UsagePage() {
  const [fromDate, setFromDate] = useState("2024-02-08");
  const [toDate, setToDate] = useState(todayDateString());
  const [data, setData] = useState({ fromDate: "", toDate: "", itemCount: 0, items: [] });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function loadUsage(nextFrom = fromDate, nextTo = toDate) {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const query = new URLSearchParams({ from: nextFrom, to: nextTo });
      const response = await fetch(`/api/reports/usage?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to load product usage.");
      }

      setData(payload);
      setFromDate(payload.fromDate);
      setToDate(payload.toDate);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to load product usage." });
      setData({ fromDate: nextFrom, toDate: nextTo, itemCount: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }

  useState(() => {
    loadUsage();
  });

  const maxSold = useMemo(() => {
    const items = data.items || [];
    if (items.length === 0) return 1;
    return Math.max(...items.map((item) => Number(item.totalSold || 0)), 1);
  }, [data]);

  return (
    <ManagerShell title="Product Usage Chart" subtitle="Usage by menu item and date range">
      <section className={styles.section}>
        <div className={styles.row}>
          <label>
            From
            <input
              className={styles.input}
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              className={styles.input}
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            type="button"
            onClick={() => loadUsage(fromDate, toDate)}
          >
            Generate Chart
          </button>
        </div>

        <StatusMessage status={status} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Total Quantity Sold</th>
                <th>Chart</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading usage chart...</td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={3}>No product usage found for this range.</td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const sold = Number(item.totalSold || 0);
                  const widthPercent = Math.max(5, Math.round((sold / maxSold) * 100));

                  return (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{sold}</td>
                      <td>
                        <div
                          style={{
                            width: `${widthPercent}%`,
                            minHeight: "14px",
                            borderRadius: "999px",
                            background: "#ea580c",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.messageOk} style={{ margin: 0, fontWeight: 600 }}>
          Showing usage for {data.itemCount} items from {data.fromDate || fromDate} to {data.toDate || toDate}.
        </p>
      </section>
    </ManagerShell>
  );
}
