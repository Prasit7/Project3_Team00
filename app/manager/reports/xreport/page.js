"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ManagerShell from "../../components/ManagerShell";
import StatusMessage from "../../components/StatusMessage";
import styles from "../../manager.module.css";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

export default function XReportPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/xreport");
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to load X-Report.");
      }

      setData(payload || null);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to load X-Report." });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const businessDateLabel = useMemo(() => {
    if (!data?.businessDate) return "N/A";
    return new Date(data.businessDate).toLocaleDateString();
  }, [data]);

  return (
    <ManagerShell title="X-Report - Sales by Hour (Today)" subtitle={`Business Date: ${businessDateLabel}`}>
      <section className={styles.section}>
        <div className={styles.actions} style={{ marginBottom: "12px" }}>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={loadReport}>
            Refresh
          </button>
        </div>

        <StatusMessage status={status} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hour</th>
                <th>Orders</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading X-Report...</td>
                </tr>
              ) : data?.rows?.length ? (
                data.rows.map((row) => (
                  <tr key={row.hourLabel}>
                    <td>{row.hourLabel}</td>
                    <td>{row.orders}</td>
                    <td>{formatCurrency(row.totalSales)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No hourly sales found for this date.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <p style={{ margin: 0 }}>
            <strong>Total Orders:</strong> {Number(data?.totalOrders || 0)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Total Sales:</strong> {formatCurrency(data?.totalSales)}
          </p>
        </div>
        <p className={styles.subtitle} style={{ marginTop: "8px" }}>
          X-Report loaded for {businessDateLabel}.
        </p>
      </section>
    </ManagerShell>
  );
}
