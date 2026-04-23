"use client";

import { useMemo, useState } from "react";
import ManagerShell from "../../components/ManagerShell";
import StatusMessage from "../../components/StatusMessage";
import styles from "../../manager.module.css";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value || 0));
}

function hourLabel(hour) {
  const normalized = Number(hour);
  const period = normalized >= 12 ? "PM" : "AM";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12} ${period}`;
}

export default function SalesReportPage() {
  const [fromHour, setFromHour] = useState("0");
  const [toHour, setToHour] = useState("23");
  const [data, setData] = useState({ businessDate: "", items: [], totalOrders: 0, totalSales: 0, fromHour: 0, toHour: 23 });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        value: String(index),
        label: hourLabel(index),
      })),
    []
  );

  async function loadSales(nextFromHour = fromHour, nextToHour = toHour) {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const query = new URLSearchParams({
        fromHour: String(nextFromHour),
        toHour: String(nextToHour),
      });
      const response = await fetch(`/api/reports/sales?${query.toString()}`);
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to load sales report.");
      }

      setData(payload);
      setFromHour(String(payload.fromHour));
      setToHour(String(payload.toHour));
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to load sales report." });
      setData({ businessDate: "", items: [], totalOrders: 0, totalSales: 0, fromHour: Number(nextFromHour), toHour: Number(nextToHour) });
    } finally {
      setLoading(false);
    }
  }

  useState(() => {
    loadSales();
  });

  const businessDateLabel = data.businessDate ? new Date(data.businessDate).toLocaleDateString() : "N/A";

  return (
    <ManagerShell title="Sales Report" subtitle={`Loaded sales by item for ${businessDateLabel}`}>
      <section className={styles.section}>
        <div className={styles.row}>
          <select className={styles.select} value={fromHour} onChange={(event) => setFromHour(event.target.value)}>
            {hourOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span style={{ alignSelf: "center", fontWeight: 700 }}>to</span>
          <select className={styles.select} value={toHour} onChange={(event) => setToHour(event.target.value)}>
            {hourOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={() => loadSales(fromHour, toHour)}>
            Generate Sales
          </button>
        </div>

        <StatusMessage status={status} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading sales report...</td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={3}>No item sales found for this range.</td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.sold}</td>
                    <td>{formatMoney(item.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <p style={{ margin: 0 }}>
            <strong>Total Orders:</strong> {Number(data.totalOrders || 0)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Total Sales:</strong> {formatMoney(data.totalSales)}
          </p>
        </div>
        <p className={styles.messageOk} style={{ marginTop: "10px", marginBottom: 0, fontWeight: 600 }}>
          Loaded sales by item for {businessDateLabel} between {hourLabel(data.fromHour)} and {hourLabel(data.toHour)}.
        </p>
      </section>
    </ManagerShell>
  );
}
