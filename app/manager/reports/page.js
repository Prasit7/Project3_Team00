"use client";

import Link from "next/link";
import ManagerShell from "../components/ManagerShell";
import styles from "../manager.module.css";

const reportCards = [
  {
    title: "Product Usage Chart",
    description: "Top-selling menu items ranked by total quantity sold.",
    href: "/manager/reports/usage",
    cta: "Open Product Usage Chart",
  },
  {
    title: "X-Report",
    description: "Most recent business-day order totals.",
    href: "/manager/reports/xreport",
    cta: "Open X-Report",
  },
  {
    title: "New Seasonal Menu Item",
    description: "Create and review seasonal menu offerings.",
    href: "/manager/reports/seasonal",
    cta: "Open Seasonal Report",
  },
  {
    title: "Z-Report",
    description: "High-volume daily order snapshot.",
    href: "/manager/reports/zreport",
    cta: "Open Z-Report",
  },
  {
    title: "Sales Report",
    description: "Revenue and average order value summaries.",
    href: "/manager/reports/sales",
    cta: "Open Sales Report",
  },
];

export default function ReportsPage() {
  return (
    <ManagerShell title="Reports Dashboard" subtitle="Manager reporting and analytics tools">
      <section className={styles.grid}>
        {reportCards.map((report) => (
          <article className={styles.card} key={report.href}>
            <h3>{report.title}</h3>
            <p>{report.description}</p>
            <Link href={report.href} className={styles.cardLink}>
              {report.cta}
            </Link>
          </article>
        ))}
      </section>
    </ManagerShell>
  );
}
