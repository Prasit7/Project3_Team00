import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getPool().query('SELECT * FROM "Employee";');
    console.log("Employee rows:", result.rows);

    return NextResponse.json({
      ok: true,
      rows: result.rows,
    });
  } catch (error) {
    console.error("Query failed:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
