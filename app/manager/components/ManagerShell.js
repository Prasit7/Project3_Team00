"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../manager.module.css";

const navItems = [
  { href: "/manager", label: "Home" },
  { href: "/manager/inventory", label: "Inventory" },
  { href: "/manager/menu", label: "Menu" },
  { href: "/manager/employees", label: "Employees" },
  { href: "/manager/payroll", label: "Payroll" },
  { href: "/manager/orders", label: "Orders" },
  { href: "/manager/reports", label: "Reports" },
];

export default function ManagerShell({ title, subtitle, children }) {
  const pathname = usePathname();
  const [isHighContrast, setIsHighContrast] = useState(false);

  // read saved preferences on mount
  useEffect(() => {
    setIsHighContrast(localStorage.getItem("highContrast") === "true");
  }, []);

  // apply data-theme to <html> whenever isHighContrast changes
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isHighContrast ? "high-contrast" : ""
    );
    localStorage.setItem("highContrast", isHighContrast);
  }, [isHighContrast]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* accessibility bar */}
        <div className={styles.a11yBar} role="toolbar" aria-label="Accessibility options">
          <button
            className={`${styles.a11yBtn} ${isHighContrast ? styles.a11yBtnActive : ""}`}
            type="button"
            aria-pressed={isHighContrast}
            aria-label="Toggle high contrast mode"
            onClick={() => setIsHighContrast((prev) => !prev)}
          >
            {isHighContrast ? "High Contrast: On" : "High Contrast: Off"}
          </button>
        </div>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            type="button"
            onClick={() => signOut({ callbackUrl: "/manager/login" })}
          >
            Sign Out
          </button>
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
