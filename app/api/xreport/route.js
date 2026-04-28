import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

function toHourLabel(hour) {
  const normalizedHour = Number(hour);
  const padded = String(normalizedHour).padStart(2, "0");
  return `${padded}:00 - ${padded}:59`;
}

async function ensureXReportState(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS xreport_state (
      singleton_id SMALLINT PRIMARY KEY DEFAULT 1,
      cutoff_at TIMESTAMPTZ,
      last_generated_at TIMESTAMPTZ
    );
  `);

  await client.query(`
    INSERT INTO xreport_state (singleton_id, cutoff_at, last_generated_at)
    VALUES (1, NULL, NULL)
    ON CONFLICT (singleton_id) DO NOTHING;
  `);
}

export async function GET() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureXReportState(client);

    const stateResult = await client.query(
      `
        SELECT cutoff_at, last_generated_at
        FROM xreport_state
        WHERE singleton_id = 1
      `
    );

    const stateRow = stateResult.rows[0] || {};
    const businessDate = new Date().toISOString().slice(0, 10);
    const cutoffAt = stateRow.cutoff_at ? new Date(stateRow.cutoff_at) : null;
    const effectiveCutoff =
      cutoffAt &&
      !Number.isNaN(cutoffAt.getTime()) &&
      cutoffAt.toISOString().slice(0, 10) === businessDate
        ? cutoffAt.toISOString()
        : null;

    const hourlyResult = await client.query(
      `
        SELECT
          EXTRACT(HOUR FROM order_time)::int AS hour,
          COUNT(*)::int AS orders,
          COALESCE(SUM(subtotal), 0)::numeric(12, 2) AS total_sales
        FROM "Order"
        WHERE DATE(order_time) = $1::date
          AND ($2::timestamptz IS NULL OR order_time > $2::timestamptz)
        GROUP BY EXTRACT(HOUR FROM order_time)
        ORDER BY hour
      `,
      [businessDate, effectiveCutoff]
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
      lastGeneratedAt: stateRow?.last_generated_at || null,
      nextAvailableAt: null,
      canGenerate: true,
    });
  } catch (error) {
    console.error("XReport failed:", error.message);
    return NextResponse.json({ error: "XReport failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureXReportState(client);

    await client.query(
      `
        SELECT 1
        FROM xreport_state
        WHERE singleton_id = 1
        FOR UPDATE
      `
    );

    const now = new Date().toISOString();
    await client.query(
      `
        UPDATE xreport_state
        SET cutoff_at = $1::timestamptz,
            last_generated_at = $1::timestamptz
        WHERE singleton_id = 1
      `,
      [now]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      ok: true,
      message: "X-Report generated. Today's current rows have been cleared.",
      cutoffAt: now,
      lastGeneratedAt: now,
      nextAvailableAt: null,
      canGenerate: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("XReport generate failed:", error.message);
    return NextResponse.json({ error: "Failed to generate X-Report." }, { status: 500 });
  } finally {
    client.release();
  }
}
