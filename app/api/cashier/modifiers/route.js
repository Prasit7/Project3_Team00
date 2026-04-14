import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

function isExclusiveGroup(modifierType) {
  const normalized = String(modifierType || "").toLowerCase();
  return normalized.includes("level") || normalized.includes("size");
}

export async function GET() {
  try {
    const result = await getPool().query(`
      SELECT modifier_id, name, price_delta, modifier_type
      FROM "Menu_Item_Modifications"
      WHERE is_available = TRUE
      ORDER BY modifier_type, name
    `);

    const grouped = new Map();

    for (const row of result.rows) {
      const title = row.modifier_type || "Other";
      if (!grouped.has(title)) {
        grouped.set(title, {
          title,
          exclusive: isExclusiveGroup(title),
          options: [],
        });
      }

      grouped.get(title).options.push({
        id: Number(row.modifier_id),
        label: row.name,
        priceDelta: Number(row.price_delta),
      });
    }

    return NextResponse.json(Array.from(grouped.values()));
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unable to load modifiers." }, { status: 500 });
  }
}
