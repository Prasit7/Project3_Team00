import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

function normalizeOrderItems(payloadItems) {
  if (!Array.isArray(payloadItems)) return [];

  return payloadItems
    .map((item) => ({
      id: Number(item.id),
      quantity: Number(item.quantity),
      price: Number(item.price),
      modifiers: Array.isArray(item.modifiers)
        ? item.modifiers.map((modifier) => String(modifier).trim()).filter(Boolean)
        : [],
    }))
    .filter((item) => Number.isFinite(item.id) && Number.isFinite(item.quantity) && item.quantity > 0 && Number.isFinite(item.price));
}

export async function POST(request) {
  const pool = getPool();

  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId || 1);
    const status = String(body.status || "completed");
    const orderItems = normalizeOrderItems(body.items);

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid employeeId." }, { status: 400 });
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ ok: false, error: "Order must include at least one item." }, { status: 400 });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query('LOCK TABLE "Order" IN EXCLUSIVE MODE');
      await client.query('LOCK TABLE "Order_Item" IN EXCLUSIVE MODE');

      const orderIdResult = await client.query('SELECT COALESCE(MAX(order_id), 0) + 1 AS next_order_id FROM "Order"');
      const orderId = Number(orderIdResult.rows[0].next_order_id);

      await client.query(
        `INSERT INTO "Order" (order_id, employee_id, order_time, status, subtotal)
         VALUES ($1, $2, NOW(), $3, $4)`,
        [orderId, employeeId, status, subtotal]
      );

      const orderItemIdResult = await client.query(
        'SELECT COALESCE(MAX(order_item_id), 0) + 1 AS next_order_item_id FROM "Order_Item"'
      );
      let nextOrderItemId = Number(orderItemIdResult.rows[0].next_order_item_id);

      const modifierNames = Array.from(new Set(orderItems.flatMap((item) => item.modifiers)));
      const modifierLookup = new Map();

      if (modifierNames.length > 0) {
        const modifierResult = await client.query(
          `SELECT modifier_id, name, price_delta
           FROM "Menu_Item_Modifications"
           WHERE is_available = TRUE AND name = ANY($1)`,
          [modifierNames]
        );

        for (const row of modifierResult.rows) {
          modifierLookup.set(String(row.name), {
            modifierId: Number(row.modifier_id),
            priceDelta: Number(row.price_delta),
          });
        }
      }

      for (const item of orderItems) {
        const orderItemId = nextOrderItemId;
        nextOrderItemId += 1;

        await client.query(
          `INSERT INTO "Order_Item" (order_item_id, order_id, menu_item_id, quantity, item_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderItemId, orderId, item.id, item.quantity, item.price]
        );

        for (const modifierName of item.modifiers) {
          const modifierData = modifierLookup.get(modifierName);
          if (!modifierData) continue;

          await client.query(
            `INSERT INTO "Order_Item_Modifier" (order_item_id, modifier_id, modifier_price)
             VALUES ($1, $2, $3)`,
            [orderItemId, modifierData.modifierId, modifierData.priceDelta]
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        ok: true,
        orderId,
        subtotal,
        itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unable to submit order.",
      },
      { status: 500 }
    );
  }
}
