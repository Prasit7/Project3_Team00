import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // query daily order counts grouped by date, then filter for days with at least 100 orders
    // return the most recent qualifying day (Z report logic)
    const result = await getPool().query(`
      SELECT 
        DATE(order_time) AS report_date,
        COUNT(*) AS total_orders
      FROM "Order"
      GROUP BY DATE(order_time)
      HAVING COUNT(*) >= 100
      ORDER BY DATE(order_time) DESC
      LIMIT 1;
    `)
    // return the most recent "high volume" report day as JSON
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('ZReport failed:', err.message)
    return NextResponse.json({ error: 'ZReport failed' }, { status: 500 })
  }
}