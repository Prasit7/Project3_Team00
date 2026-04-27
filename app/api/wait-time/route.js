import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

const AVG_MINUTES_PER_ORDER = 3;
const MIN_WAIT_MINUTES = 2;
const MAX_WAIT_MINUTES = 25;

function toDateKey(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value || "").slice(0, 10);
}

function todayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function clampWaitMinutes(ordersPerHalfHour) {
  return Math.min(
    MAX_WAIT_MINUTES,
    Math.max(MIN_WAIT_MINUTES, Math.round(ordersPerHalfHour * AVG_MINUTES_PER_ORDER))
  );
}

function calculateFallbackWaitMinutes(rows, businessDate) {
  const hourNow = new Date().getHours();
  const normalizedRows = rows
    .map((row) => ({
      hour: Number(row.hour),
      orders: Number(row.orders) || 0,
    }))
    .filter((row) => Number.isInteger(row.hour))
    .sort((a, b) => a.hour - b.hour);

  let recentOrdersPerHalfHour = 0;

  if (normalizedRows.length > 0) {
    const businessDateText = toDateKey(businessDate);
    const today = todayDateKey();
    const recentRows = businessDateText === today
      ? normalizedRows.filter((row) => row.hour >= hourNow - 1 && row.hour <= hourNow)
      : normalizedRows.slice(-2);
    const fallbackRows = recentRows.length > 0 ? recentRows : normalizedRows.slice(-2);
    const recentOrders = fallbackRows.reduce((total, row) => total + row.orders, 0);
    const hoursSampled = Math.max(1, fallbackRows.length);

    recentOrdersPerHalfHour = (recentOrders / hoursSampled) / 2;
  }

  return clampWaitMinutes(recentOrdersPerHalfHour);
}

export async function GET() {
  try {
    const pool = getPool();

    const businessDateResult = await pool.query(`
      SELECT COALESCE(MAX(DATE(order_time)), CURRENT_DATE)::date AS business_date
      FROM "Order";
    `);

    const businessDate = businessDateResult.rows[0]?.business_date;

    const trafficResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE DATE(order_time) = CURRENT_DATE
            AND order_time >= CURRENT_TIMESTAMP - INTERVAL '30 minutes'
        )::int AS orders_last_30_minutes,
        COUNT(*) FILTER (
          WHERE DATE(order_time) = CURRENT_DATE
            AND order_time >= CURRENT_TIMESTAMP - INTERVAL '60 minutes'
        )::int AS orders_last_60_minutes
      FROM "Order";
    `);

    const traffic = trafficResult.rows[0] || {};
    const ordersLast30Minutes = Number(traffic.orders_last_30_minutes) || 0;
    const ordersLast60Minutes = Number(traffic.orders_last_60_minutes) || 0;

    if (ordersLast30Minutes > 0 || ordersLast60Minutes > 0) {
      const ordersPerHalfHour = ordersLast30Minutes > 0
        ? ordersLast30Minutes
        : ordersLast60Minutes / 2;

      return NextResponse.json({
        businessDate,
        waitMinutes: clampWaitMinutes(ordersPerHalfHour),
        traffic: {
          ordersLast30Minutes,
          ordersLast60Minutes,
          source: ordersLast30Minutes > 0 ? "last_30_minutes" : "last_60_minutes",
        },
      });
    }

    const hourlyResult = await pool.query(
      `
        SELECT
          EXTRACT(HOUR FROM order_time)::int AS hour,
          COUNT(*)::int AS orders
        FROM "Order"
        WHERE DATE(order_time) = $1::date
        GROUP BY EXTRACT(HOUR FROM order_time)
        ORDER BY hour
      `,
      [businessDate]
    );

    const waitMinutes = calculateFallbackWaitMinutes(hourlyResult.rows, businessDate);

    return NextResponse.json({
      businessDate,
      waitMinutes,
      traffic: {
        ordersLast30Minutes,
        ordersLast60Minutes,
        source: "hourly_fallback",
      },
    });
  } catch (error) {
    console.error("Wait time failed:", error.message);
    return NextResponse.json({ error: "Wait time failed" }, { status: 500 });
  }
}
