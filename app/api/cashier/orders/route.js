import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

export const runtime = "nodejs";

class InventoryValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InventoryValidationError";
  }
}

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

async function resolveEmployeeId(client, requestedEmployeeId) {
  if (Number.isFinite(requestedEmployeeId) && requestedEmployeeId > 0) {
    const exactMatch = await client.query(
      `SELECT employee_id
       FROM "Employee"
       WHERE employee_id = $1 AND is_active = TRUE`,
      [requestedEmployeeId]
    );

    if (exactMatch.rowCount > 0) {
      return Number(exactMatch.rows[0].employee_id);
    }
  }

  const fallback = await client.query(
    `SELECT employee_id
     FROM "Employee"
     WHERE is_active = TRUE
     ORDER BY employee_id
     LIMIT 1`
  );

  if (fallback.rowCount === 0) {
    throw new Error("No active employee found for order submission.");
  }

  return Number(fallback.rows[0].employee_id);
}

function getSizeFromLabel(label) {
  const normalized = String(label || "").trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("24")) return "24";
  if (normalized.includes("20")) return "20";
  if (normalized.includes("16")) return "16";

  if (normalized.includes("large")) return "20";
  if (normalized.includes("regular")) return "16";
  if (normalized.includes("small")) return "16";

  return null;
}

function inferSelectedSize(orderItem) {
  if (!orderItem || !Array.isArray(orderItem.modifiers)) return null;

  for (const modifier of orderItem.modifiers) {
    const parsed = getSizeFromLabel(modifier);
    if (parsed) return parsed;
  }

  return null;
}

async function buildInventoryUsage(client, orderItems) {
  const menuItemIds = Array.from(new Set(orderItems.map((item) => item.id)));
  if (menuItemIds.length === 0) {
    return new Map();
  }

  const packagingInventoryResult = await client.query(
    `SELECT inventory_item_id, name
     FROM "Inventory_Item"
     WHERE name IN (
       '16oz Cup',
       '20oz Cup',
       '24oz Cup',
       'Plastic Lid - 16oz',
       'Plastic Lid - 20oz',
       'Plastic Lid - 24oz'
     )`
  );

  const packagingByName = new Map(
    packagingInventoryResult.rows.map((row) => [String(row.name), Number(row.inventory_item_id)])
  );
  const cupBySize = {
    "16": packagingByName.get("16oz Cup"),
    "20": packagingByName.get("20oz Cup"),
    "24": packagingByName.get("24oz Cup"),
  };
  const lidBySize = {
    "16": packagingByName.get("Plastic Lid - 16oz"),
    "20": packagingByName.get("Plastic Lid - 20oz"),
    "24": packagingByName.get("Plastic Lid - 24oz"),
  };

  const recipeResult = await client.query(
    `SELECT mi.menu_item_id, mi.inventory_item_id, mi.quantity_required, ii.name AS inventory_name
     FROM "Menu_Inventory" mi
     JOIN "Inventory_Item" ii ON ii.inventory_item_id = mi.inventory_item_id
     WHERE menu_item_id = ANY($1)`,
    [menuItemIds]
  );

  const recipeByMenuItem = new Map();
  for (const row of recipeResult.rows) {
    const menuItemId = Number(row.menu_item_id);
    const existing = recipeByMenuItem.get(menuItemId) || [];
    existing.push({
      inventoryItemId: Number(row.inventory_item_id),
      quantityRequired: Number(row.quantity_required),
      inventoryName: String(row.inventory_name),
    });
    recipeByMenuItem.set(menuItemId, existing);
  }

  const usageByInventoryItem = new Map();
  for (const orderItem of orderItems) {
    const recipe = recipeByMenuItem.get(orderItem.id) || [];
    let recipeCupSize = null;
    let recipeLidSize = null;

    for (const ingredient of recipe) {
      const ingredientName = String(ingredient.inventoryName || "").toLowerCase();
      const ingredientSize = getSizeFromLabel(ingredientName);

      if (ingredientName.includes("cup")) {
        if (ingredientSize) recipeCupSize = ingredientSize;
        continue;
      }

      if (ingredientName.includes("lid")) {
        if (ingredientSize) recipeLidSize = ingredientSize;
        continue;
      }

      const usedQuantity = ingredient.quantityRequired * orderItem.quantity;
      usageByInventoryItem.set(
        ingredient.inventoryItemId,
        (usageByInventoryItem.get(ingredient.inventoryItemId) || 0) + usedQuantity
      );
    }

    const selectedSize = inferSelectedSize(orderItem);
    const cupSizeToUse = selectedSize || recipeCupSize || "20";
    const lidSizeToUse = selectedSize || recipeLidSize || cupSizeToUse;

    const cupInventoryId = cupBySize[cupSizeToUse];
    const lidInventoryId = lidBySize[lidSizeToUse];

    if (Number.isFinite(cupInventoryId)) {
      usageByInventoryItem.set(cupInventoryId, (usageByInventoryItem.get(cupInventoryId) || 0) + orderItem.quantity);
    }

    if (Number.isFinite(lidInventoryId)) {
      usageByInventoryItem.set(lidInventoryId, (usageByInventoryItem.get(lidInventoryId) || 0) + orderItem.quantity);
    }
  }

  return usageByInventoryItem;
}

async function consumeInventory(client, usageByInventoryItem) {
  const inventoryItemIds = Array.from(usageByInventoryItem.keys());
  if (inventoryItemIds.length === 0) {
    return;
  }

  const inventoryResult = await client.query(
    `SELECT inventory_item_id, name, quantity_on_hand
     FROM "Inventory_Item"
     WHERE inventory_item_id = ANY($1)
     FOR UPDATE`,
    [inventoryItemIds]
  );

  const inventoryById = new Map(
    inventoryResult.rows.map((row) => [
      Number(row.inventory_item_id),
      {
        name: String(row.name),
        quantityOnHand: Number(row.quantity_on_hand),
      },
    ])
  );

  for (const [inventoryItemId, usedQuantity] of usageByInventoryItem.entries()) {
    const inventoryItem = inventoryById.get(inventoryItemId);
    if (!inventoryItem) {
      throw new InventoryValidationError(`Inventory item ${inventoryItemId} was not found.`);
    }

    if (inventoryItem.quantityOnHand < usedQuantity) {
      throw new InventoryValidationError(
        `Insufficient inventory for ${inventoryItem.name}. Needed ${usedQuantity.toFixed(2)}, available ${inventoryItem.quantityOnHand.toFixed(2)}.`
      );
    }
  }

  for (const [inventoryItemId, usedQuantity] of usageByInventoryItem.entries()) {
    await client.query(
      `UPDATE "Inventory_Item"
       SET quantity_on_hand = quantity_on_hand - $1
       WHERE inventory_item_id = $2`,
      [usedQuantity, inventoryItemId]
    );
  }
}

export async function POST(request) {
  const pool = getPool();

  try {
    const body = await request.json();
    const requestedEmployeeId = Number(body.employeeId);
    const status = String(body.status || "completed");
    const orderItems = normalizeOrderItems(body.items);

    if (orderItems.length === 0) {
      return NextResponse.json({ ok: false, error: "Order must include at least one item." }, { status: 400 });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query('LOCK TABLE "Order" IN EXCLUSIVE MODE');
      await client.query('LOCK TABLE "Order_Item" IN EXCLUSIVE MODE');

      const employeeId = await resolveEmployeeId(client, requestedEmployeeId);

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

      const usageByInventoryItem = await buildInventoryUsage(client, orderItems);
      await consumeInventory(client, usageByInventoryItem);

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
    if (error instanceof InventoryValidationError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unable to submit order.",
      },
      { status: 500 }
    );
  }
}
