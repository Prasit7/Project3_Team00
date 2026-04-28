import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";
const BUSINESS_TIME_ZONE = "America/Chicago";

function dateKeyInBusinessTimeZone(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

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
      last_generated_at TIMESTAMPTZ,
      lockout_enabled_at TIMESTAMPTZ
    );
  `);

  await client.query(`
    ALTER TABLE xreport_state
    ADD COLUMN IF NOT EXISTS lockout_enabled_at TIMESTAMPTZ;
  `);

  await client.query(`
    INSERT INTO xreport_state (singleton_id, cutoff_at, last_generated_at, lockout_enabled_at)
    VALUES (1, NULL, NULL, NOW())
    ON CONFLICT (singleton_id) DO NOTHING;
  `);

  await client.query(`
    UPDATE xreport_state
    SET lockout_enabled_at = COALESCE(lockout_enabled_at, NOW())
    WHERE singleton_id = 1;
  `);
}

function withDailyLockoutInfo(stateRow) {
  const now = new Date();
  const nowKey = dateKeyInBusinessTimeZone(now);
  const lastGeneratedAt = stateRow?.last_generated_at ? new Date(stateRow.last_generated_at) : null;
  const lockoutEnabledAt = stateRow?.lockout_enabled_at ? new Date(stateRow.lockout_enabled_at) : null;

  if (!lastGeneratedAt || Number.isNaN(lastGeneratedAt.getTime())) {
    return {
      lastGeneratedAt: null,
      nextAvailableAt: null,
      canGenerate: true,
      retryAfterSeconds: 0,
    };
  }

  const lastKey = dateKeyInBusinessTimeZone(lastGeneratedAt);
  const startedAfterLockoutEnabled =
    lockoutEnabledAt && !Number.isNaN(lockoutEnabledAt.getTime())
      ? lastGeneratedAt.getTime() >= lockoutEnabledAt.getTime()
      : true;

  // Ignore any presses that happened before this lockout mode was re-enabled.
  const canGenerate = !startedAfterLockoutEnabled || lastKey !== nowKey;
  if (canGenerate) {
    return {
      lastGeneratedAt: lastGeneratedAt.toISOString(),
      nextAvailableAt: null,
      canGenerate: true,
      retryAfterSeconds: 0,
    };
  }

  const nextAvailableAt = new Date(lastGeneratedAt.getTime() + 24 * 60 * 60 * 1000);
  const retryAfterSeconds = Math.max(0, Math.ceil((nextAvailableAt.getTime() - now.getTime()) / 1000));

  return {
    lastGeneratedAt: lastGeneratedAt.toISOString(),
    nextAvailableAt: nextAvailableAt.toISOString(),
    canGenerate: false,
    retryAfterSeconds,
  };
}

export async function GET() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureXReportState(client);

    const stateResult = await client.query(
      `
        SELECT cutoff_at, last_generated_at, lockout_enabled_at
        FROM xreport_state
        WHERE singleton_id = 1
      `
    );

    const stateRow = stateResult.rows[0] || {};
    const businessDate = dateKeyInBusinessTimeZone(new Date());
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
      ...withDailyLockoutInfo(stateRow),
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

    const lockStateResult = await client.query(
      `
        SELECT last_generated_at, lockout_enabled_at
        FROM xreport_state
        WHERE singleton_id = 1
      `
    );
    const lockState = lockStateResult.rows[0] || {};
    const lockout = withDailyLockoutInfo(lockState);
    if (!lockout.canGenerate) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: "X-Report can only be generated once per business day.",
          ...lockout,
        },
        { status: 429 }
      );
    }

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
      nextAvailableAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      canGenerate: false,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("XReport generate failed:", error.message);
    return NextResponse.json({ error: "Failed to generate X-Report." }, { status: 500 });
  } finally {
    client.release();
  }
}
