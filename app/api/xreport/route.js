import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

function toHourLabel(hour) {
  const normalizedHour = Number(hour);
  const padded = String(normalizedHour).padStart(2, "0");
  return `${padded}:00 - ${padded}:59`;
}

export async function GET() {
  try {
    const pool = getPool();

    const businessDateResult = await pool.query(`
      SELECT COALESCE(MAX(DATE(order_time)), CURRENT_DATE)::date AS business_date
      FROM "Order";
    `);

    const businessDate = businessDateResult.rows[0]?.business_date;

    const hourlyResult = await pool.query(
      `
        SELECT
          EXTRACT(HOUR FROM order_time)::int AS hour,
          COUNT(*)::int AS orders,
          COALESCE(SUM(subtotal), 0)::numeric(12, 2) AS total_sales
        FROM "Order"
        WHERE DATE(order_time) = $1::date
        GROUP BY EXTRACT(HOUR FROM order_time)
        ORDER BY hour
      `,
      [businessDate]
    );

    const rows = hourlyResult.rows.map((row) => ({
      hour: Number(row.hour),
      hourLabel: toHourLabel(row.hour),
      orders: Number(row.orders),
      totalSales: Number(row.total_sales),
    }));

    const totals = rows.reduce(
      (accumulator, row) => ({
        totalOrders: accumulator.totalOrders + row.orders,
        totalSales: accumulator.totalSales + row.totalSales,
      }),
      { totalOrders: 0, totalSales: 0 }
    );

    return NextResponse.json({
      businessDate,
      rows,
      totalOrders: totals.totalOrders,
      totalSales: Number(totals.totalSales.toFixed(2)),
    });
  } catch (error) {
    console.error("XReport failed:", error.message);
    return NextResponse.json({ error: "XReport failed" }, { status: 500 });
  }
}
