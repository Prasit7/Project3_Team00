import { getPool } from "../../../lib/db";
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  toInventoryApi,
  validateInventoryPayload,
} from "../../../lib/manager/contracts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getPool().query(
      `
      SELECT inventory_item_id, name, quantity_on_hand, unit
      FROM "Inventory_Item"
      ORDER BY inventory_item_id
    `
    );

    return jsonOk(result.rows.map(toInventoryApi));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const payload = validateInventoryPayload(body);
    const result = await getPool().query(
      `
      INSERT INTO "Inventory_Item" (name, quantity_on_hand, unit)
      VALUES ($1, $2, $3)
      RETURNING inventory_item_id, name, quantity_on_hand, unit
    `,
      [payload.name, payload.quantity_on_hand, payload.unit]
    );

    return jsonOk(toInventoryApi(result.rows[0]), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
