import { NextResponse } from "next/server";

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export function jsonOk(data, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(code, message, status, details = undefined) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value) {
  return typeof value === "boolean";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireField(body, field, partial) {
  if (!partial && !(field in body)) {
    throw new ValidationError(`Missing required field: ${field}`);
  }
}

export function toInventoryApi(row) {
  return {
    id: row.inventory_item_id,
    name: row.name,
    quantityOnHand: Number(row.quantity_on_hand),
    unit: row.unit,
  };
}

export function validateInventoryPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object.");
  }

  const allowed = new Set(["name", "quantityOnHand", "unit"]);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new ValidationError("Request contains unknown fields.", unknown);
  }

  requireField(body, "name", partial);
  requireField(body, "quantityOnHand", partial);
  requireField(body, "unit", partial);

  const payload = {};

  if ("name" in body) {
    if (!isNonEmptyString(body.name)) {
      throw new ValidationError("name must be a non-empty string.");
    }
    payload.name = body.name.trim();
  }

  if ("quantityOnHand" in body) {
    if (!isFiniteNumber(body.quantityOnHand) || body.quantityOnHand < 0) {
      throw new ValidationError("quantityOnHand must be a non-negative number.");
    }
    payload.quantity_on_hand = body.quantityOnHand;
  }

  if ("unit" in body) {
    if (!isNonEmptyString(body.unit)) {
      throw new ValidationError("unit must be a non-empty string.");
    }
    payload.unit = body.unit.trim();
  }

  return payload;
}

export function toEmployeeApi(row) {
  return {
    id: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isActive: row.is_active,
    hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : 15.00,
    hoursWorkedThisWeek: Number(row.hours_worked_this_week ?? 0),
  };
}

export function validateEmployeePayload(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object.");
  }

  const allowed = new Set(["firstName", "lastName", "role", "isActive", "hourlyRate"]);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new ValidationError("Request contains unknown fields.", unknown);
  }

  requireField(body, "firstName", partial);
  requireField(body, "lastName", partial);
  requireField(body, "role", partial);

  const payload = {};

  if ("firstName" in body) {
    if (!isNonEmptyString(body.firstName)) {
      throw new ValidationError("firstName must be a non-empty string.");
    }
    payload.first_name = body.firstName.trim();
  }

  if ("lastName" in body) {
    if (!isNonEmptyString(body.lastName)) {
      throw new ValidationError("lastName must be a non-empty string.");
    }
    payload.last_name = body.lastName.trim();
  }

  if ("role" in body) {
    if (!isNonEmptyString(body.role)) {
      throw new ValidationError("role must be a non-empty string.");
    }
    payload.role = body.role.trim();
  }

  if ("isActive" in body) {
    if (!isBoolean(body.isActive)) {
      throw new ValidationError("isActive must be a boolean.");
    }
    payload.is_active = body.isActive;
  }

  if ("hourlyRate" in body) {
    if (!isFiniteNumber(body.hourlyRate) || body.hourlyRate < 0) {
      throw new ValidationError("hourlyRate must be a non-negative number.");
    }
    payload.hourly_rate = body.hourlyRate;
  }

  return payload;
}

function normalizeRecipeItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new ValidationError("Each recipe item must be an object.");
  }

  const allowed = new Set(["inventoryItemId", "quantityRequired"]);
  const unknown = Object.keys(item).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new ValidationError("Recipe item contains unknown fields.", unknown);
  }

  if (!Number.isInteger(item.inventoryItemId) || item.inventoryItemId <= 0) {
    throw new ValidationError("inventoryItemId must be a positive integer.");
  }

  if (!isFiniteNumber(item.quantityRequired) || item.quantityRequired <= 0) {
    throw new ValidationError("quantityRequired must be a positive number.");
  }

  return {
    inventory_item_id: item.inventoryItemId,
    quantity_required: item.quantityRequired,
  };
}

export function toMenuApi(row, recipe = []) {
  return {
    id: row.menu_item_id,
    name: row.name,
    category: row.category,
    basePrice: Number(row.base_price),
    isAvailable: row.is_available,
    recipe,
  };
}

export function validateMenuPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object.");
  }

  const allowed = new Set(["name", "category", "basePrice", "isAvailable", "recipe"]);
  const unknown = Object.keys(body).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new ValidationError("Request contains unknown fields.", unknown);
  }

  requireField(body, "name", partial);
  requireField(body, "category", partial);
  requireField(body, "basePrice", partial);

  const payload = {};

  if ("name" in body) {
    if (!isNonEmptyString(body.name)) {
      throw new ValidationError("name must be a non-empty string.");
    }
    payload.name = body.name.trim();
  }

  if ("category" in body) {
    if (!isNonEmptyString(body.category)) {
      throw new ValidationError("category must be a non-empty string.");
    }
    payload.category = body.category.trim();
  }

  if ("basePrice" in body) {
    if (!isFiniteNumber(body.basePrice) || body.basePrice < 0) {
      throw new ValidationError("basePrice must be a non-negative number.");
    }
    payload.base_price = body.basePrice;
  }

  if ("isAvailable" in body) {
    if (!isBoolean(body.isAvailable)) {
      throw new ValidationError("isAvailable must be a boolean.");
    }
    payload.is_available = body.isAvailable;
  }

  if ("recipe" in body) {
    if (!Array.isArray(body.recipe)) {
      throw new ValidationError("recipe must be an array.");
    }

    const normalized = body.recipe.map(normalizeRecipeItem);
    const seen = new Set();
    for (const entry of normalized) {
      if (seen.has(entry.inventory_item_id)) {
        throw new ValidationError("recipe cannot include duplicate inventoryItemId values.");
      }
      seen.add(entry.inventory_item_id);
    }

    payload.recipe = normalized;
  }

  return payload;
}

export function parsePositiveIntegerId(rawId) {
  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError("id must be a positive integer.");
  }
  return parsed;
}

export function handleRouteError(error) {
  if (error instanceof ValidationError) {
    return jsonError("BAD_REQUEST", error.message, 400, error.details);
  }

  return jsonError("INTERNAL_SERVER_ERROR", error.message || "Unexpected server error.", 500);
}
