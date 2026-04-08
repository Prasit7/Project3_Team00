import { NextResponse } from 'next/server'
import { getPool } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const result = await getPool().query(`
      SELECT COUNT(*) AS total_orders
      FROM "Order";
    `)

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('Reports failed:', err.message)
    return NextResponse.json({ error: 'Reports failed' }, { status: 500 })
  }
}