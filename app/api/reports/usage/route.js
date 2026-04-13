import { NextResponse } from 'next/server'
import { getPool } from '../../../../lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // query the database to find the top 10 most ordered menu items
    // by summing quantities from order items and grouping by item name
    const result = await getPool().query(`
      SELECT 
        mi.name,
        SUM(oi.quantity) AS total_sold
      FROM "Order_Item" oi
      JOIN "Menu_Item" mi
        ON oi.menu_item_id = mi.menu_item_id
      GROUP BY mi.name
      ORDER BY total_sold DESC
      LIMIT 10;
    `)
    // return the aggregated results as JSON (top-selling menu items)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Usage failed:', err.message)
    return NextResponse.json({ error: 'Usage failed' }, { status: 500 })
  }
}