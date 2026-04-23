"use client";

import { useEffect, useState } from "react";
import ManagerShell from "../components/ManagerShell";

const hourlyRates = {
  Manager: 18,
  Cashier: 12,
};

// FAKE HOURS (since your DB does NOT have time tracking)
const employeeHours = [
  { employee_id: 1, hours: 40 },
  { employee_id: 2, hours: 32 },
  { employee_id: 3, hours: 28 },
  { employee_id: 4, hours: 35 },
  { employee_id: 5, hours: 20 },
  { employee_id: 6, hours: 45 },
];

function buildPayroll(employees) {
  return employees.map(emp => {
    const hours =
      employeeHours.find(h => h.employee_id === emp.id)?.hours || 0;

    const rate = hourlyRates[emp.role] || 0;

    return {
      name: `${emp.firstName} ${emp.lastName}`,
      role: emp.role,
      hours,
      rate,
      total: hours * rate,
    };
  });
}

export default function PayrollPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/employees");
      const json = await res.json();

      if (!json.ok) return;

      const payroll = buildPayroll(json.data);
      setData(payroll);
    }

    load();
  }, []);

  return (
    <ManagerShell title="Payroll" subtitle="Employee hours and earnings">
      <div style={{ padding: "20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Total Pay</th>
            </tr>
          </thead>

          <tbody>
            {data.map((emp, i) => (
              <tr key={i}>
                <td>{emp.name}</td>
                <td>{emp.role}</td>
                <td>{emp.hours}</td>
                <td>${emp.rate}</td>
                <td>${emp.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerShell>
  );
}