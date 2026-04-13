import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // get the most recent date in the Order table and count how many orders happened that day
    const result = await getPool().query(`
      SELECT 
        DATE(order_time) AS report_date,
        COUNT(*) AS orders_today
      FROM "Order"
      WHERE DATE(order_time) = (
        SELECT MAX(DATE(order_time))
        FROM "Order"
      )
      GROUP BY DATE(order_time);
    `)
     // return the result as JSON, or send a 500 error if something breaks
    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('XReport failed:', err.message)
    return NextResponse.json({ error: 'XReport failed' }, { status: 500 })
  }
}