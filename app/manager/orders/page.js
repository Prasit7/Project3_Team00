"use client";

import { useEffect, useMemo, useState } from "react";
import ManagerShell from "../components/ManagerShell";
import StatusMessage from "../components/StatusMessage";
import styles from "../manager.module.css";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatOrderTime(rawValue, dateTimeFormatter) {
  if (!rawValue) return "Unknown";
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return dateTimeFormatter.format(parsed);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  async function loadOrders() {
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch("/api/manager/orders");
      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error?.message || "Failed to load order history.");
      }

      setOrders(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      setStatus({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <ManagerShell title="Order History" subtitle="All created orders with timestamps and paid amounts">
      <section className={styles.section}>
        <StatusMessage status={status} />
        <h2>Orders</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Created Time</th>
                <th>Amount Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={4}>No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{formatOrderTime(order.orderTime, dateTimeFormatter)}</td>
                    <td>{currencyFormatter.format(order.amountPaid)}</td>
                    <td>{order.status || "completed"}</td>
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
