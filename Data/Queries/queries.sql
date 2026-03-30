-- Defaults so the file runs even if you don't pass -v variables
\set week_start 2025-02-17
\set menu_item_id 1
\set day 2026-02-16
\set hour 12

-- Special Query #1: Weekly Sales History (52 wks)
-- Given a specific week, how many orders were placed?
SELECT
  :'week_start'::date AS week_start,
  COUNT(*) AS orders_placed
FROM "Order" o
WHERE date_trunc('week', o.order_time)::date = :'week_start'::date;

-- Q2 average order value by week
SELECT
    TO_CHAR(o.order_time, 'Day') AS weekday_name,
    EXTRACT(DOW FROM o.order_time)::int AS weekday_number,
    COUNT(*) AS total_orders,
    ROUND(AVG(o.subtotal), 2) AS avg_order_value,
    ROUND(SUM(o.subtotal), 2) AS total_revenue
FROM "Order" o
GROUP BY weekday_name, weekday_number
ORDER BY avg_order_value DESC;



-- Q3) Weekly revenue + orders (temporal + totals)
SELECT
  date_trunc('week', o.order_time)::date AS week_start,
  COUNT(*) AS orders,
  SUM(o.subtotal) AS weekly_revenue,
  AVG(o.subtotal) AS avg_order_value
FROM "Order" o
GROUP BY 1
ORDER BY 1;

-- Q4) Daily revenue distribution
SELECT
  o.order_time::date AS day,
  COUNT(*) AS orders,
  SUM(o.subtotal) AS daily_revenue
FROM "Order" o
GROUP BY 1
ORDER BY daily_revenue DESC
LIMIT 15;

-- Q5) Revenue by hour AND weekday
SELECT
  TO_CHAR(o.order_time, 'Day') AS weekday_name,
  EXTRACT(DOW FROM o.order_time)::int AS weekday_num,
  EXTRACT(HOUR FROM o.order_time)::int AS hour_of_day,
  COUNT(*) AS orders,
  SUM(o.subtotal) AS revenue
FROM "Order" o
GROUP BY 1, 2, 3
ORDER BY weekday_num, hour_of_day;

-- Q6) (Top 10 menu items by quantity sold)
SELECT
  mi.menu_item_id,
  mi.name,
  SUM(oi.quantity) AS qty_sold
FROM "Order_Item" oi
JOIN "Menu_Item" mi ON mi.menu_item_id = oi.menu_item_id
GROUP BY mi.menu_item_id, mi.name
ORDER BY qty_sold DESC
LIMIT 10;

-- Q7) Top 10 menu items by item revenue (quantity * item_price stored on Order_Item)
SELECT
  mi.menu_item_id,
  mi.name,
  SUM(oi.quantity * oi.item_price) AS item_revenue
FROM "Order_Item" oi
JOIN "Menu_Item" mi ON mi.menu_item_id = oi.menu_item_id
GROUP BY mi.menu_item_id, mi.name
ORDER BY item_revenue DESC
LIMIT 10;

-- Q8) Modifier usage counts
SELECT
  m.modifier_id,
  m.name,
  m.modifier_type,
  COUNT(*) AS times_used,
  SUM(oim.modifier_price) AS modifier_revenue
FROM "Order_Item_Modifier" oim
JOIN "Menu_Item_Modifications" m ON m.modifier_id = oim.modifier_id
GROUP BY m.modifier_id, m.name, m.modifier_type
ORDER BY times_used DESC
LIMIT 15;

-- Q9) Cashier performance: orders + revenue per employee
SELECT
  e.employee_id,
  e.first_name || ' ' || e.last_name AS employee_name,
  COUNT(o.order_id) AS orders_handled,
  SUM(o.subtotal) AS revenue_handled
FROM "Order" o
JOIN "Employee" e ON e.employee_id = o.employee_id
GROUP BY e.employee_id, employee_name
ORDER BY revenue_handled DESC;

-- Q10) Ingredient list for a menu item
SELECT
  mi.menu_item_id,
  mi.name AS menu_item_name,
  inv.inventory_item_id,
  inv.name AS inventory_item_name,
  miv.quantity_required,
  inv.unit
FROM "Menu_Item" mi
JOIN "Menu_Inventory" miv ON miv.menu_item_id = mi.menu_item_id
JOIN "Inventory_Item" inv ON inv.inventory_item_id = miv.inventory_item_id
WHERE mi.menu_item_id = :'menu_item_id'::int
ORDER BY inv.inventory_item_id;

-- Q11) Inventory consumption estimate
SELECT
  inv.inventory_item_id,
  inv.name AS inventory_item_name,
  inv.unit,
  SUM(oi.quantity * miv.quantity_required) AS estimated_units_consumed
FROM "Order_Item" oi
JOIN "Menu_Inventory" miv ON miv.menu_item_id = oi.menu_item_id
JOIN "Inventory_Item" inv ON inv.inventory_item_id = miv.inventory_item_id
GROUP BY inv.inventory_item_id, inv.name, inv.unit
ORDER BY estimated_units_consumed DESC;

-- Q12) Stockout risk check: estimated consumption > quantity_on_hand
WITH usage AS (
  SELECT
    inv.inventory_item_id,
    SUM(oi.quantity * miv.quantity_required) AS estimated_units_consumed
  FROM "Order_Item" oi
  JOIN "Menu_Inventory" miv ON miv.menu_item_id = oi.menu_item_id
  JOIN "Inventory_Item" inv ON inv.inventory_item_id = miv.inventory_item_id
  GROUP BY inv.inventory_item_id
)
SELECT
  inv.inventory_item_id,
  inv.name,
  inv.unit,
  inv.quantity_on_hand,
  u.estimated_units_consumed,
  (inv.quantity_on_hand - u.estimated_units_consumed) AS remaining_estimate
FROM "Inventory_Item" inv
JOIN usage u ON u.inventory_item_id = inv.inventory_item_id
ORDER BY remaining_estimate ASC;

-- Q13 SPECIAL QUERY #3 PEAK SALES DAY
SELECT
  (:'day'::date) AS day,
  COALESCE(SUM(t.subtotal), 0) AS top10_orders_sum
FROM (
  SELECT o.subtotal
  FROM "Order" o
  WHERE o.order_time::date = :'day'::date
  ORDER BY o.subtotal DESC
  LIMIT 10
) t;

-- Q14 SPECIAL QUERY #4 REALISTIC SALES HISTORY
SELECT
  (:'hour'::int) AS hour_of_day,
  COUNT(*) AS orders_placed,
  COALESCE(SUM(o.subtotal), 0) AS orders_total_sum
FROM "Order" o
WHERE EXTRACT(HOUR FROM o.order_time)::int = :'hour'::int;

-- Q15 SPECIAL QUERY #5 MENU ITEM INVENTORY
SELECT
  mi.menu_item_id,
  mi.name AS menu_item_name,
  COUNT(miv.inventory_item_id) AS inventory_items_count
FROM "Menu_Item" mi
LEFT JOIN "Menu_Inventory" miv
  ON miv.menu_item_id = mi.menu_item_id
WHERE mi.menu_item_id = :'menu_item_id'::int
GROUP BY mi.menu_item_id, mi.name;

-- Q16 min and max date
SELECT
    MIN(o.order_time)::date AS earliest_order_date,
    MAX(o.order_time)::date AS latest_order_date
FROM "Order" o;