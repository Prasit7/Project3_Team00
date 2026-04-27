import { getPool } from "../../../../lib/db";
import { jsonError, jsonOk } from "../../../../lib/manager/contracts";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const employeeId = Number(body?.employeeId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return jsonError("BAD_REQUEST", "employeeId must be a positive integer.", 400);
    }

    const result = await getPool().query(
      `
      SELECT employee_id, first_name, last_name, role, is_active
      FROM "Employee"
      WHERE employee_id = $1
    `,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return jsonError("NOT_FOUND", "Employee ID not found.", 404);
    }

    const employee = result.rows[0];
    if (!employee.is_active) {
      return jsonError("FORBIDDEN", "This employee account is inactive.", 403);
    }

    return jsonOk({
      id: employee.employee_id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      role: employee.role,
      isActive: employee.is_active,
    });
  } catch (error) {
    return jsonError("INTERNAL_SERVER_ERROR", error.message || "Unable to authenticate employee.", 500);
  }
}
