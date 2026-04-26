import { getPool } from "../../../../lib/db";
import { handleRouteError, jsonOk } from "../../../../lib/manager/contracts";

export const runtime = "nodejs";
const ORDER_HISTORY_LIMIT = 200;

function toOrderHistoryApi(row) {
  return {
    id: Number(row.order_id),
    orderTime: row.order_time,
    amountPaid: Number(row.subtotal),
    status: row.status,
  };
}

export async function GET() {
  try {
    const result = await getPool().query(
      `
      SELECT order_id, order_time, subtotal, status
      FROM "Order"
      ORDER BY order_time DESC, order_id DESC
      LIMIT $1
    `,
      [ORDER_HISTORY_LIMIT]
    );

    return jsonOk(result.rows.map(toOrderHistoryApi));
  } catch (error) {
    return handleRouteError(error);
  }
}
