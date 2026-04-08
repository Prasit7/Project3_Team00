# Manager API Contracts (Task 1)

All manager endpoints return a common envelope:

- Success: `{ "ok": true, "data": ... }`
- Error: `{ "ok": false, "error": { "code": "...", "message": "...", "details": [...]? } }`

## Inventory

- `GET /api/inventory`
- `POST /api/inventory`
- `GET /api/inventory/:id`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`

Request shape (create/update):

```json
{
  "name": "Black Tea Leaves",
  "quantityOnHand": 1000,
  "unit": "oz"
}
```

Response item shape:

```json
{
  "id": 1,
  "name": "Black Tea Leaves",
  "quantityOnHand": 1000,
  "unit": "oz"
}
```

DB mapping: `inventory_item_id`, `name`, `quantity_on_hand`, `unit`.

## Employees

- `GET /api/employees`
- `POST /api/employees`
- `GET /api/employees/:id`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

Request shape (create/update):

```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "role": "Manager",
  "isActive": true
}
```

Response item shape:

```json
{
  "id": 1,
  "firstName": "Sarah",
  "lastName": "Johnson",
  "role": "Manager",
  "isActive": true
}
```

DB mapping: `employee_id`, `first_name`, `last_name`, `role`, `is_active`.

## Menu

- `GET /api/menu`
- `POST /api/menu`
- `GET /api/menu/:id`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`

Request shape (create/update):

```json
{
  "name": "Classic Milk Tea",
  "category": "Milk Tea",
  "basePrice": 5.5,
  "isAvailable": true,
  "recipe": [
    { "inventoryItemId": 1, "quantityRequired": 1.5 },
    { "inventoryItemId": 5, "quantityRequired": 6 }
  ]
}
```

Response item shape:

```json
{
  "id": 1,
  "name": "Classic Milk Tea",
  "category": "Milk Tea",
  "basePrice": 5.5,
  "isAvailable": true,
  "recipe": [
    { "inventoryItemId": 1, "quantityRequired": 1.5 },
    { "inventoryItemId": 5, "quantityRequired": 6 }
  ]
}
```

DB mapping:

- `Menu_Item`: `menu_item_id`, `name`, `category`, `base_price`, `is_available`
- `Menu_Inventory`: `menu_item_id`, `inventory_item_id`, `quantity_required`
