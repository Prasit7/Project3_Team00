import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getPool().query(`
      SELECT modifier_id, name, price_delta, modifier_type, is_available
      FROM "Menu_Item_Modifications"
      WHERE is_available = TRUE
      ORDER BY modifier_type, modifier_id
    `);

    return NextResponse.json(
      result.rows.map((row) => ({
        id: row.modifier_id,
        name: row.name,
        priceDelta: Number(row.price_delta),
        modifierType: row.modifier_type,
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
