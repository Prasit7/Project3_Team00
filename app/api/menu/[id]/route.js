import { getPool } from "../../../../lib/db";
import {
  handleRouteError,
  jsonError,
  jsonOk,
  parseJsonBody,
  parsePositiveIntegerId,
  toMenuApi,
  validateMenuPayload,
  ValidationError,
} from "../../../../lib/manager/contracts";

export const runtime = "nodejs";

function toRecipeApi(recipe) {
  return (recipe || []).map((entry) => ({
    inventoryItemId: entry.inventory_item_id,
    quantityRequired: Number(entry.quantity_required),
  }));
}

function buildUpdateQuery(id, payload) {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    throw new ValidationError("Provide at least one menu field to update.");
  }

  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);

  return {
    text: `
      UPDATE "Menu_Item"
      SET ${setClause}
      WHERE menu_item_id = $${entries.length + 1}
      RETURNING menu_item_id, name, category, base_price, is_available
    `,
    values: [...values, id],
  };
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

async function fetchMenuItemWithRecipe(client, id) {
  const result = await client.query(
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
      WHERE mi.menu_item_id = $1
      GROUP BY mi.menu_item_id, mi.name, mi.category, mi.base_price, mi.is_available
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function GET(_request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const row = await fetchMenuItemWithRecipe(getPool(), id);

    if (!row) {
      return jsonError("NOT_FOUND", "Menu item not found.", 404);
    }

    return jsonOk(toMenuApi(row, toRecipeApi(row.recipe)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request, context) {
  const client = await getPool().connect();

  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const body = await parseJsonBody(request);
    const validated = validateMenuPayload(body, { partial: true });
    const { recipe, ...menuPayload } = validated;

    await client.query("BEGIN");

    if (Object.keys(menuPayload).length > 0) {
      const updateQuery = buildUpdateQuery(id, menuPayload);
      const updated = await client.query(updateQuery);
      if (updated.rows.length === 0) {
        await client.query("ROLLBACK");
        return jsonError("NOT_FOUND", "Menu item not found.", 404);
      }
    } else {
      const exists = await client.query(`SELECT 1 FROM "Menu_Item" WHERE menu_item_id = $1`, [id]);
      if (exists.rows.length === 0) {
        await client.query("ROLLBACK");
        return jsonError("NOT_FOUND", "Menu item not found.", 404);
      }
    }

    if (recipe) {
      await client.query(`DELETE FROM "Menu_Inventory" WHERE menu_item_id = $1`, [id]);
      await insertRecipeItems(client, id, recipe);
    }

    const finalRow = await fetchMenuItemWithRecipe(client, id);
    await client.query("COMMIT");

    return jsonOk(toMenuApi(finalRow, toRecipeApi(finalRow.recipe)));
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

export async function DELETE(_request, context) {
  const client = await getPool().connect();

  try {
    const id = parsePositiveIntegerId((await context.params).id);
    await client.query("BEGIN");

    await client.query(`DELETE FROM "Menu_Inventory" WHERE menu_item_id = $1`, [id]);
    const result = await client.query(
      `
      DELETE FROM "Menu_Item"
      WHERE menu_item_id = $1
      RETURNING menu_item_id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return jsonError("NOT_FOUND", "Menu item not found.", 404);
    }

    await client.query("COMMIT");
    return jsonOk({ id: result.rows[0].menu_item_id, deleted: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return handleRouteError(error);
  } finally {
    client.release();
  }
}
