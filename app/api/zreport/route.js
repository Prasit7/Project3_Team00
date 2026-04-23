import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = getPool();

    const businessDateResult = await pool.query(`
      SELECT COALESCE(MAX(DATE(order_time)), CURRENT_DATE)::date AS business_date
      FROM "Order";
    `);
    const businessDate = businessDateResult.rows[0]?.business_date;

    const summaryResult = await pool.query(
      `
        SELECT
          COALESCE(SUM(subtotal), 0)::numeric(12, 2) AS sales_subtotal,
          COALESCE(SUM(subtotal), 0)::numeric(12, 2) AS sales_total,
          COUNT(*)::int AS order_count
        FROM "Order"
        WHERE DATE(order_time) = $1::date
      `,
      [businessDate]
    );

    const itemsResult = await pool.query(
      `
        SELECT COALESCE(SUM(oi.quantity), 0)::int AS items_sold
        FROM "Order_Item" oi
        JOIN "Order" o
          ON o.order_id = oi.order_id
        WHERE DATE(o.order_time) = $1::date
      `,
      [businessDate]
    );

    const xReportCountResult = await pool.query(
      `
        SELECT COUNT(DISTINCT EXTRACT(HOUR FROM order_time))::int AS x_report_count
        FROM "Order"
        WHERE DATE(order_time) = $1::date
      `,
      [businessDate]
    );

    const summary = summaryResult.rows[0] || {};

    return NextResponse.json({
      businessDate,
      salesSubtotal: Number(summary.sales_subtotal || 0),
      salesTotal: Number(summary.sales_total || 0),
      orderCount: Number(summary.order_count || 0),
      itemsSold: Number(itemsResult.rows[0]?.items_sold || 0),
      xReportCount: Number(xReportCountResult.rows[0]?.x_report_count || 0),
    });
  } catch (error) {
    console.error("ZReport failed:", error.message);
    return NextResponse.json({ error: "ZReport failed" }, { status: 500 });
  }
}
