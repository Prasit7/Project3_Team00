import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

function parseHour(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) {
    return fallback;
  }
  return parsed;
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export async function GET(request) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);

    const dateParam = searchParams.get("date");
    const fromHour = parseHour(searchParams.get("fromHour"), 0);
    const toHour = parseHour(searchParams.get("toHour"), 23);

    if (dateParam && !isValidDateString(dateParam)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    if (fromHour > toHour) {
      return NextResponse.json({ error: "From hour cannot be after To hour." }, { status: 400 });
    }

    const businessDateResult = await pool.query(`
      SELECT COALESCE(MAX(DATE(order_time)), CURRENT_DATE)::date AS business_date
      FROM "Order";
    `);
    const businessDate = dateParam || businessDateResult.rows[0]?.business_date;

    const itemsResult = await pool.query(
      `
        SELECT
          mi.name,
          SUM(oi.quantity)::int AS sold,
          COALESCE(SUM(oi.quantity * oi.item_price), 0)::numeric(12, 2) AS revenue
        FROM "Order_Item" oi
        JOIN "Order" o
          ON o.order_id = oi.order_id
        JOIN "Menu_Item" mi
          ON mi.menu_item_id = oi.menu_item_id
        WHERE DATE(o.order_time) = $1::date
          AND EXTRACT(HOUR FROM o.order_time)::int BETWEEN $2 AND $3
        GROUP BY mi.name
        ORDER BY sold DESC, mi.name ASC
      `,
      [businessDate, fromHour, toHour]
    );

    const totalsResult = await pool.query(
      `
        SELECT
          COUNT(DISTINCT o.order_id)::int AS total_orders,
          COALESCE(SUM(o.subtotal), 0)::numeric(12, 2) AS total_sales
        FROM "Order" o
        WHERE DATE(o.order_time) = $1::date
          AND EXTRACT(HOUR FROM o.order_time)::int BETWEEN $2 AND $3
      `,
      [businessDate, fromHour, toHour]
    );

    return NextResponse.json({
      businessDate,
      fromHour,
      toHour,
      items: itemsResult.rows.map((row) => ({
        name: row.name,
        sold: Number(row.sold),
        revenue: Number(row.revenue),
      })),
      totalOrders: Number(totalsResult.rows[0]?.total_orders || 0),
      totalSales: Number(totalsResult.rows[0]?.total_sales || 0),
    });
  } catch (error) {
    console.error("Sales report failed:", error.message);
    return NextResponse.json({ error: "Sales report failed" }, { status: 500 });
  }
}
