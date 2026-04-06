import { getPool } from "../../../lib/db";
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  toEmployeeApi,
  validateEmployeePayload,
} from "../../../lib/manager/contracts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getPool().query(
      `
      SELECT employee_id, first_name, last_name, role, is_active
      FROM "Employee"
      ORDER BY employee_id
    `
    );

    return jsonOk(result.rows.map(toEmployeeApi));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request) {
  try {
    const body = await parseJsonBody(request);
    const payload = validateEmployeePayload(body);
    const result = await getPool().query(
      `
      INSERT INTO "Employee" (first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, COALESCE($4, TRUE))
      RETURNING employee_id, first_name, last_name, role, is_active
    `,
      [payload.first_name, payload.last_name, payload.role, payload.is_active]
    );

    return jsonOk(toEmployeeApi(result.rows[0]), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
