import { getPool } from "../../../../lib/db";
import {
  handleRouteError,
  jsonError,
  jsonOk,
  parseJsonBody,
  parsePositiveIntegerId,
  toInventoryApi,
  validateInventoryPayload,
  ValidationError,
} from "../../../../lib/manager/contracts";

export const runtime = "nodejs";

function buildUpdateQuery(id, payload) {
  const entries = Object.entries(payload);
  if (entries.length === 0) {
    throw new ValidationError("Provide at least one field to update.");
  }

  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);

  return {
    text: `
      UPDATE "Inventory_Item"
      SET ${setClause}
      WHERE inventory_item_id = $${entries.length + 1}
      RETURNING inventory_item_id, name, quantity_on_hand, unit
    `,
    values: [...values, id],
  };
}

export async function GET(_request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const result = await getPool().query(
      `
      SELECT inventory_item_id, name, quantity_on_hand, unit
      FROM "Inventory_Item"
      WHERE inventory_item_id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Inventory item not found.", 404);
    }

    return jsonOk(toInventoryApi(result.rows[0]));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const body = await parseJsonBody(request);
    const payload = validateInventoryPayload(body, { partial: true });
    const updateQuery = buildUpdateQuery(id, payload);

    const result = await getPool().query(updateQuery);

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Inventory item not found.", 404);
    }

    return jsonOk(toInventoryApi(result.rows[0]));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const result = await getPool().query(
      `
      DELETE FROM "Inventory_Item"
      WHERE inventory_item_id = $1
      RETURNING inventory_item_id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Inventory item not found.", 404);
    }

    return jsonOk({ id: result.rows[0].inventory_item_id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
