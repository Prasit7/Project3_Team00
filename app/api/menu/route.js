import { getPool } from "../../../lib/db";
import { ensureDefaultSmoothies } from "../../../lib/defaultSmoothies";
import {
  handleRouteError,
  jsonError,
  jsonOk,
  parseJsonBody,
  toMenuApi,
  validateMenuPayload,
} from "../../../lib/manager/contracts";

export const runtime = "nodejs";

function toRecipeApi(recipe) {
  return (recipe || []).map((entry) => ({
    inventoryItemId: entry.inventory_item_id,
    quantityRequired: Number(entry.quantity_required),
  }));
}

async function insertRecipeItems(client, menuItemId, recipe) {
  if (!recipe || recipe.length === 0) {
    return;
  }

  const placeholders = recipe
    .map((_, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
    .join(", ");

  const values = [menuItemId];
  for (const entry of recipe) {
    values.push(entry.inventory_item_id, entry.quantity_required);
  }

  await client.query(
    `
      INSERT INTO "Menu_Inventory" (menu_item_id, inventory_item_id, quantity_required)
      VALUES ${placeholders}
    `,
    values
  );
}

export async function GET() {
  try {
    await ensureDefaultSmoothies(getPool());

    const result = await getPool().query(
      `
      SELECT
        mi.menu_item_id,
        mi.name,
        mi.category,
        mi.base_price,
        mi.is_available,
        COALESCE(
          json_agg(
            json_build_object(
              'inventory_item_id', miv.inventory_item_id,
              'quantity_required', miv.quantity_required
            )
            ORDER BY miv.inventory_item_id
          ) FILTER (WHERE miv.inventory_item_id IS NOT NULL),
          '[]'::json
        ) AS recipe
      FROM "Menu_Item" mi
      LEFT JOIN "Menu_Inventory" miv
        ON miv.menu_item_id = mi.menu_item_id
      GROUP BY mi.menu_item_id, mi.name, mi.category, mi.base_price, mi.is_available
      ORDER BY mi.menu_item_id
    `
    );

    const data = result.rows.map((row) => toMenuApi(row, toRecipeApi(row.recipe)));
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  const client = await getPool().connect();
  try {
    const body = await parseJsonBody(request);
    const payload = validateMenuPayload(body);

    await client.query("BEGIN");

    const insertResult = await client.query(
      `
      INSERT INTO "Menu_Item" (name, category, base_price, is_available)
      VALUES ($1, $2, $3, COALESCE($4, TRUE))
      RETURNING menu_item_id, name, category, base_price, is_available
    `,
      [payload.name, payload.category, payload.base_price, payload.is_available]
    );

    const row = insertResult.rows[0];
    const recipe = payload.recipe || [];
    await insertRecipeItems(client, row.menu_item_id, recipe);

    await client.query("COMMIT");

    return jsonOk(toMenuApi(row, toRecipeApi(recipe)), 201);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23503") {
      return jsonError("BAD_REQUEST", "Recipe references an unknown inventory item.", 400);
    }
    return handleRouteError(error);
  } finally {
    client.release();
  }
}
