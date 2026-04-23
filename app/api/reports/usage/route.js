import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export async function GET(request) {
  try {
    const pool = getPool();
    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if ((fromParam && !isValidDateString(fromParam)) || (toParam && !isValidDateString(toParam))) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    const boundsResult = await pool.query(`
      SELECT
        COALESCE(MIN(DATE(order_time)), CURRENT_DATE)::date AS min_date,
        COALESCE(MAX(DATE(order_time)), CURRENT_DATE)::date AS max_date
      FROM "Order";
    `);

    const minDate = boundsResult.rows[0]?.min_date;
    const maxDate = boundsResult.rows[0]?.max_date;

    const fromDate = fromParam || minDate;
    const toDate = toParam || maxDate;

    if (fromDate > toDate) {
      return NextResponse.json({ error: "From date cannot be after To date." }, { status: 400 });
    }

    const usageResult = await pool.query(
      `
        SELECT
          mi.name,
          SUM(oi.quantity)::int AS total_sold
        FROM "Order_Item" oi
        JOIN "Order" o
          ON o.order_id = oi.order_id
        JOIN "Menu_Item" mi
          ON mi.menu_item_id = oi.menu_item_id
        WHERE DATE(o.order_time) BETWEEN $1::date AND $2::date
        GROUP BY mi.name
        ORDER BY total_sold DESC, mi.name ASC
        LIMIT 15
      `,
      [fromDate, toDate]
    );

    return NextResponse.json({
      fromDate,
      toDate,
      itemCount: usageResult.rows.length,
      items: usageResult.rows.map((row) => ({
        name: row.name,
        totalSold: Number(row.total_sold),
      })),
    });
  } catch (error) {
    console.error("Usage failed:", error.message);
    return NextResponse.json({ error: "Usage failed" }, { status: 500 });
  }
}
