import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { ensureDefaultSmoothies } from "../../../lib/defaultSmoothies";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDefaultSmoothies(getPool());

    const result = await getPool().query(`
      SELECT menu_item_id, name, category, base_price, is_available
      FROM "Menu_Item"
      WHERE is_available = TRUE
      ORDER BY menu_item_id
    `);

    return NextResponse.json(
      result.rows.map((row) => ({
        id: row.menu_item_id,
        name: row.name,
        category: row.category,
        price: Number(row.base_price),
        isAvailable: row.is_available,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
