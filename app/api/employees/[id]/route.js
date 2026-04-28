import { getPool } from "../../../../lib/db";
import {
  handleRouteError,
  jsonError,
  jsonOk,
  parseJsonBody,
  parsePositiveIntegerId,
  toEmployeeApi,
  validateEmployeePayload,
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
      UPDATE "Employee"
      SET ${setClause}
      WHERE employee_id = $${entries.length + 1}
      RETURNING employee_id, first_name, last_name, role, is_active, hourly_rate, hours_worked_this_week
    `,
    values: [...values, id],
  };
}

export async function GET(_request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const result = await getPool().query(
      `
      SELECT employee_id, first_name, last_name, role, is_active, hourly_rate, hours_worked_this_week
      FROM "Employee"
      WHERE employee_id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Employee not found.", 404);
    }

    return jsonOk(toEmployeeApi(result.rows[0]));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const body = await parseJsonBody(request);
    const payload = validateEmployeePayload(body, { partial: true });
    const updateQuery = buildUpdateQuery(id, payload);

    const result = await getPool().query(updateQuery);
    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Employee not found.", 404);
    }

    return jsonOk(toEmployeeApi(result.rows[0]));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request, context) {
  try {
    const id = parsePositiveIntegerId((await context.params).id);
    const result = await getPool().query(
      `
      DELETE FROM "Employee"
      WHERE employee_id = $1
      RETURNING employee_id
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Employee not found.", 404);
    }

    return jsonOk({ id: result.rows[0].employee_id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
