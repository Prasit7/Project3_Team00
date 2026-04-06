"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../manager.module.css";

const navItems = [
  { href: "/manager", label: "Home" },
  { href: "/manager/inventory", label: "Inventory" },
  { href: "/manager/menu", label: "Menu" },
  { href: "/manager/employees", label: "Employees" },
];

export default function ManagerShell({ title, subtitle, children }) {
  const pathname = usePathname();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </header>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
