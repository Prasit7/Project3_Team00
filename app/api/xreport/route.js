import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
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

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('XReport failed:', err.message)
    return NextResponse.json({ error: 'XReport failed' }, { status: 500 })
  }
}