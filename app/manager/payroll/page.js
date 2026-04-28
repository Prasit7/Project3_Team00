"use client";

import { useEffect, useState } from "react";
import ManagerShell from "../components/ManagerShell";
import styles from "../manager.module.css";

export default function PayrollPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (!json.ok) {
        setData([]);
        setLoading(false);
        return;
      }

      const payroll = json.data.map((emp) => {
        const hours = Number(emp.hoursWorkedThisWeek ?? 0);
        const rate = Number(emp.hourlyRate ?? 15.0);
        return {
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.role,
        hours,
        rate,
        total: hours * rate,
      };
      });

      setData(payroll);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <ManagerShell title="Payroll" subtitle="Employee hours and earnings">
      <div style={{ padding: "20px" }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Hours</th>
                <th>Hourly Rate</th>
                <th>Total Pay</th>
              </tr>
            </thead>
            <tbody>
              {data.map((emp, i) => (
                <tr key={i}>
                  <td>{emp.name}</td>
                  <td>{emp.role}</td>
                  <td>{emp.hours}</td>
                  <td>${emp.rate.toFixed(2)}</td>
                  <td>${emp.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ManagerShell>
  );
}
