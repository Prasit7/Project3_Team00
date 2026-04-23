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

export default function ZReportPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [closingEmployeeId, setClosingEmployeeId] = useState("");
  const [employeeSignature, setEmployeeSignature] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch("/api/zreport");
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to load Z-Report.");
      }

      setData(payload || null);
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Failed to load Z-Report." });
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

  function onGenerateZReport() {
    setStatus({ type: "ok", text: `Z-Report generated for ${businessDateLabel}.` });
  }

  return (
    <ManagerShell title="Z-Report (End of Day)" subtitle={`Business Date: ${businessDateLabel}`}>
      <section className={styles.section}>
        <div className={styles.actions} style={{ marginBottom: "12px" }}>
          <button className={`${styles.button} ${styles.buttonSecondary}`} type="button" onClick={loadReport}>
            Refresh
          </button>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={onGenerateZReport}>
            Generate Z Report
          </button>
        </div>

        <StatusMessage status={status} />

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>Sales Subtotal</th>
                <td>{loading ? "..." : formatCurrency(data?.salesSubtotal)}</td>
              </tr>
              <tr>
                <th>Sales Total</th>
                <td>{loading ? "..." : formatCurrency(data?.salesTotal)}</td>
              </tr>
              <tr>
                <th>Order Count</th>
                <td>{loading ? "..." : Number(data?.orderCount || 0)}</td>
              </tr>
              <tr>
                <th>Items Sold</th>
                <td>{loading ? "..." : Number(data?.itemsSold || 0)}</td>
              </tr>
              <tr>
                <th>X Report Count</th>
                <td>{loading ? "..." : Number(data?.xReportCount || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <label>
            Closing Employee ID
            <input
              className={styles.input}
              value={closingEmployeeId}
              onChange={(event) => setClosingEmployeeId(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Employee Signature
            <input
              className={styles.input}
              value={employeeSignature}
              onChange={(event) => setEmployeeSignature(event.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>
        <p className={styles.subtitle} style={{ margin: 0 }}>
          Ready to run end-of-day close for {businessDateLabel}.
        </p>
      </section>
    </ManagerShell>
  );
}
