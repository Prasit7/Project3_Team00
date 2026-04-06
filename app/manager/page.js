"use client";

import Link from "next/link";
import ManagerShell from "./components/ManagerShell";
import styles from "./manager.module.css";

export default function ManagerPage() {
  return (
    <ManagerShell title="Manager Tools" subtitle="Operational admin tools (excluding reports)">
      <section className={styles.grid}>
        <article className={styles.card}>
          <h3>Inventory</h3>
          <p>Add, update, and remove inventory items.</p>
          <Link href="/manager/inventory" className={styles.cardLink}>
            Open Inventory
          </Link>
        </article>

        <article className={styles.card}>
          <h3>Menu</h3>
          <p>Manage menu items and their inventory recipe mappings.</p>
          <Link href="/manager/menu" className={styles.cardLink}>
            Open Menu
          </Link>
        </article>

        <article className={styles.card}>
          <h3>Employees</h3>
          <p>Create and maintain employee records and statuses.</p>
          <Link href="/manager/employees" className={styles.cardLink}>
            Open Employees
          </Link>
        </article>
      </section>
    </ManagerShell>
  );
}
