"""
Project 2 - Python Scripts to generate CSVs

Outputs:
- employees.csv
- orders.csv
- order_items.csv
- menu_items.csv
- menu_item_modifications.csv
- order_item_modifiers.csv
- inventory_items.csv
- menu_inventory.csv
"""

import csv
import random
import datetime
from datetime import timedelta

# ========================================
# TEAM OF 5 CONFIGURATION
# ========================================
NUM_WEEKS = 52
SALES_TARGET = 1_000_000
NUM_PEAK_DAYS = 3
NUM_MENU_ITEMS = 20

# How close you want to be to target sales (±)
SALES_TOLERANCE = 25_000  # adjust if you want tighter/looser

# ========================================
# DATE CALCULATIONS
# ========================================
end_date = datetime.date.today()
start_date = end_date - timedelta(weeks=NUM_WEEKS)

# ========================================
# EMPLOYEE DATA
# ========================================
EMPLOYEES = [
    {'employee_id': 1, 'first_name': 'Sarah', 'last_name': 'Johnson', 'role': 'Manager', 'is_active': True},
    {'employee_id': 2, 'first_name': 'Michael', 'last_name': 'Chen', 'role': 'Cashier', 'is_active': True},
    {'employee_id': 3, 'first_name': 'Emily', 'last_name': 'Rodriguez', 'role': 'Cashier', 'is_active': True},
    {'employee_id': 4, 'first_name': 'David', 'last_name': 'Kim', 'role': 'Cashier', 'is_active': True},
    {'employee_id': 5, 'first_name': 'Jessica', 'last_name': 'Patel', 'role': 'Cashier', 'is_active': True},
    {'employee_id': 6, 'first_name': 'James', 'last_name': 'Wilson', 'role': 'Manager', 'is_active': True},
    {'employee_id': 7, 'first_name': 'Maria', 'last_name': 'Garcia', 'role': 'Cashier', 'is_active': False},
]

# ========================================
# MENU ITEMS (20 items)
# ========================================
MENU_ITEMS = [
    {'menu_item_id': 1, 'name': 'Classic Milk Tea', 'category': 'Milk Tea', 'base_price': 5.50, 'is_available': True},
    {'menu_item_id': 2, 'name': 'Brown Sugar Milk Tea', 'category': 'Milk Tea', 'base_price': 6.00, 'is_available': True},
    {'menu_item_id': 3, 'name': 'Taro Milk Tea', 'category': 'Milk Tea', 'base_price': 5.75, 'is_available': True},
    {'menu_item_id': 4, 'name': 'Matcha Milk Tea', 'category': 'Milk Tea', 'base_price': 6.25, 'is_available': True},
    {'menu_item_id': 5, 'name': 'Thai Tea', 'category': 'Milk Tea', 'base_price': 5.50, 'is_available': True},
    {'menu_item_id': 6, 'name': 'Honeydew Milk Tea', 'category': 'Milk Tea', 'base_price': 5.75, 'is_available': True},
    {'menu_item_id': 7, 'name': 'Mango Green Tea', 'category': 'Fruit Tea', 'base_price': 5.50, 'is_available': True},
    {'menu_item_id': 8, 'name': 'Passion Fruit Tea', 'category': 'Fruit Tea', 'base_price': 5.25, 'is_available': True},
    {'menu_item_id': 9, 'name': 'Lychee Black Tea', 'category': 'Fruit Tea', 'base_price': 5.25, 'is_available': True},
    {'menu_item_id': 10, 'name': 'Peach Oolong Tea', 'category': 'Fruit Tea', 'base_price': 5.50, 'is_available': True},
    {'menu_item_id': 11, 'name': 'Wintermelon Tea', 'category': 'Fruit Tea', 'base_price': 5.00, 'is_available': True},
    {'menu_item_id': 12, 'name': 'Jasmine Green Tea', 'category': 'Tea', 'base_price': 4.75, 'is_available': True},
    {'menu_item_id': 13, 'name': 'Strawberry Milk Tea', 'category': 'Milk Tea', 'base_price': 6.00, 'is_available': True},
    {'menu_item_id': 14, 'name': 'Coconut Milk Tea', 'category': 'Milk Tea', 'base_price': 5.75, 'is_available': True},
    {'menu_item_id': 15, 'name': 'Coffee Milk Tea', 'category': 'Milk Tea', 'base_price': 6.25, 'is_available': True},
    {'menu_item_id': 16, 'name': 'Almond Milk Tea', 'category': 'Milk Tea', 'base_price': 6.00, 'is_available': True},
    {'menu_item_id': 17, 'name': 'Rose Milk Tea', 'category': 'Milk Tea', 'base_price': 6.50, 'is_available': True},
    {'menu_item_id': 18, 'name': 'Lavender Milk Tea', 'category': 'Milk Tea', 'base_price': 6.50, 'is_available': True},
    {'menu_item_id': 19, 'name': 'Cheese Foam Tea', 'category': 'Specialty', 'base_price': 7.00, 'is_available': True},
    {'menu_item_id': 20, 'name': 'Fruit Tea Combo', 'category': 'Fruit Tea', 'base_price': 7.50, 'is_available': True},
]

# ========================================
# MENU ITEM MODIFICATIONS
# ========================================
MODIFIERS = [
    {'modifier_id': 1, 'name': 'Tapioca Pearls', 'price_delta': 0.50, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 2, 'name': 'Mini Pearls', 'price_delta': 0.50, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 3, 'name': 'Popping Boba', 'price_delta': 0.75, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 4, 'name': 'Grass Jelly', 'price_delta': 0.50, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 5, 'name': 'Aloe Vera', 'price_delta': 0.50, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 6, 'name': 'Pudding', 'price_delta': 0.75, 'modifier_type': 'Topping', 'is_available': True},
    {'modifier_id': 7, 'name': '0% Sugar', 'price_delta': 0.00, 'modifier_type': 'Sugar Level', 'is_available': True},
    {'modifier_id': 8, 'name': '25% Sugar', 'price_delta': 0.00, 'modifier_type': 'Sugar Level', 'is_available': True},
    {'modifier_id': 9, 'name': '50% Sugar', 'price_delta': 0.00, 'modifier_type': 'Sugar Level', 'is_available': True},
    {'modifier_id': 10, 'name': '75% Sugar', 'price_delta': 0.00, 'modifier_type': 'Sugar Level', 'is_available': True},
    {'modifier_id': 11, 'name': '100% Sugar', 'price_delta': 0.00, 'modifier_type': 'Sugar Level', 'is_available': True},
    {'modifier_id': 12, 'name': 'No Ice', 'price_delta': 0.00, 'modifier_type': 'Ice Level', 'is_available': True},
    {'modifier_id': 13, 'name': 'Less Ice', 'price_delta': 0.00, 'modifier_type': 'Ice Level', 'is_available': True},
    {'modifier_id': 14, 'name': 'Regular Ice', 'price_delta': 0.00, 'modifier_type': 'Ice Level', 'is_available': True},
    {'modifier_id': 15, 'name': 'Extra Ice', 'price_delta': 0.00, 'modifier_type': 'Ice Level', 'is_available': True},
]

# ========================================
# INVENTORY ITEMS
# ========================================
INVENTORY_ITEMS = [
    {'inventory_item_id': 1, 'name': 'Black Tea Leaves', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 2, 'name': 'Green Tea Leaves', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 3, 'name': 'Oolong Tea Leaves', 'quantity_on_hand': 800, 'unit': 'oz'},
    {'inventory_item_id': 4, 'name': 'Jasmine Tea Leaves', 'quantity_on_hand': 800, 'unit': 'oz'},
    {'inventory_item_id': 5, 'name': 'Whole Milk', 'quantity_on_hand': 5000, 'unit': 'oz'},
    {'inventory_item_id': 6, 'name': 'Non-Dairy Creamer', 'quantity_on_hand': 3000, 'unit': 'oz'},
    {'inventory_item_id': 7, 'name': 'Almond Milk', 'quantity_on_hand': 2000, 'unit': 'oz'},
    {'inventory_item_id': 8, 'name': 'Coconut Milk', 'quantity_on_hand': 2000, 'unit': 'oz'},
    {'inventory_item_id': 9, 'name': 'Brown Sugar Syrup', 'quantity_on_hand': 2000, 'unit': 'oz'},
    {'inventory_item_id': 10, 'name': 'Taro Powder', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 11, 'name': 'Matcha Powder', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 12, 'name': 'Thai Tea Mix', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 13, 'name': 'Honeydew Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 14, 'name': 'Mango Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 15, 'name': 'Passion Fruit Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 16, 'name': 'Lychee Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 17, 'name': 'Peach Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 18, 'name': 'Wintermelon Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 19, 'name': 'Strawberry Syrup', 'quantity_on_hand': 1200, 'unit': 'oz'},
    {'inventory_item_id': 20, 'name': 'Rose Syrup', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 21, 'name': 'Lavender Syrup', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 22, 'name': 'Coffee Extract', 'quantity_on_hand': 1000, 'unit': 'oz'},
    {'inventory_item_id': 23, 'name': 'Cheese Foam Powder', 'quantity_on_hand': 800, 'unit': 'oz'},
    {'inventory_item_id': 24, 'name': 'Tapioca Pearls', 'quantity_on_hand': 3000, 'unit': 'oz'},
    {'inventory_item_id': 25, 'name': 'Mini Tapioca Pearls', 'quantity_on_hand': 2000, 'unit': 'oz'},
    {'inventory_item_id': 26, 'name': 'Popping Boba - Strawberry', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 27, 'name': 'Popping Boba - Mango', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 28, 'name': 'Grass Jelly', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 29, 'name': 'Aloe Vera', 'quantity_on_hand': 1500, 'unit': 'oz'},
    {'inventory_item_id': 30, 'name': 'Simple Syrup', 'quantity_on_hand': 3000, 'unit': 'oz'},
    {'inventory_item_id': 31, 'name': 'Ice Cubes', 'quantity_on_hand': 10000, 'unit': 'oz'},
    {'inventory_item_id': 32, 'name': '16oz Cup', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 33, 'name': '20oz Cup', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 34, 'name': '24oz Cup', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 35, 'name': 'Plastic Lid - 16oz', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 36, 'name': 'Plastic Lid - 20oz', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 37, 'name': 'Plastic Lid - 24oz', 'quantity_on_hand': 5000, 'unit': 'unit'},
    {'inventory_item_id': 38, 'name': 'Wide Straw', 'quantity_on_hand': 10000, 'unit': 'unit'},
    {'inventory_item_id': 39, 'name': 'Regular Straw', 'quantity_on_hand': 10000, 'unit': 'unit'},
    {'inventory_item_id': 40, 'name': 'Napkins', 'quantity_on_hand': 15000, 'unit': 'unit'},
]

# ========================================
# MENU-INVENTORY RELATIONSHIPS
# ========================================
MENU_INVENTORY = [
    (1, 1, 1), (1, 5, 8), (1, 24, 3), (1, 30, 1), (1, 31, 8), (1, 33, 1), (1, 36, 1), (1, 38, 1), (1, 40, 2),
    (2, 1, 1), (2, 5, 8), (2, 9, 2), (2, 24, 3), (2, 31, 8), (2, 33, 1), (2, 36, 1), (2, 38, 1), (2, 40, 2),
    (3, 1, 1), (3, 5, 8), (3, 10, 2), (3, 24, 3), (3, 31, 8), (3, 33, 1), (3, 36, 1), (3, 38, 1), (3, 40, 2),
    (4, 2, 1), (4, 5, 8), (4, 11, 1), (4, 24, 3), (4, 31, 8), (4, 33, 1), (4, 36, 1), (4, 38, 1), (4, 40, 2),
    (5, 12, 2), (5, 6, 8), (5, 30, 1), (5, 31, 8), (5, 33, 1), (5, 36, 1), (5, 38, 1), (5, 40, 2),
    (6, 2, 1), (6, 5, 8), (6, 13, 2), (6, 24, 3), (6, 31, 8), (6, 33, 1), (6, 36, 1), (6, 38, 1), (6, 40, 2),
    (7, 2, 1), (7, 14, 2), (7, 27, 2), (7, 31, 8), (7, 33, 1), (7, 36, 1), (7, 38, 1), (7, 40, 2),
    (8, 2, 1), (8, 15, 2), (8, 31, 8), (8, 33, 1), (8, 36, 1), (8, 39, 1), (8, 40, 2),
    (9, 1, 1), (9, 16, 2), (9, 31, 8), (9, 33, 1), (9, 36, 1), (9, 38, 1), (9, 40, 2),
    (10, 3, 1), (10, 17, 2), (10, 31, 8), (10, 33, 1), (10, 36, 1), (10, 39, 1), (10, 40, 2),
    (11, 2, 1), (11, 18, 2), (11, 31, 8), (11, 33, 1), (11, 36, 1), (11, 39, 1), (11, 40, 2),
    (12, 4, 1), (12, 30, 1), (12, 31, 8), (12, 33, 1), (12, 36, 1), (12, 39, 1), (12, 40, 2),
    (13, 1, 1), (13, 5, 8), (13, 19, 2), (13, 24, 3), (13, 31, 8), (13, 34, 1), (13, 37, 1), (13, 38, 1), (13, 40, 2),
    (14, 1, 1), (14, 8, 8), (14, 30, 1), (14, 24, 3), (14, 31, 8), (14, 33, 1), (14, 36, 1), (14, 38, 1), (14, 40, 2),
    (15, 1, 1), (15, 5, 8), (15, 22, 2), (15, 24, 3), (15, 31, 8), (15, 33, 1), (15, 36, 1), (15, 38, 1), (15, 40, 2),
    (16, 1, 1), (16, 7, 8), (16, 30, 1), (16, 29, 2), (16, 31, 8), (16, 33, 1), (16, 36, 1), (16, 38, 1), (16, 40, 2),
    (17, 1, 1), (17, 5, 8), (17, 20, 2), (17, 24, 3), (17, 31, 8), (17, 33, 1), (17, 36, 1), (17, 38, 1), (17, 40, 2),
    (18, 1, 1), (18, 5, 8), (18, 21, 2), (18, 24, 3), (18, 31, 8), (18, 33, 1), (18, 36, 1), (18, 38, 1), (18, 40, 2),
    (19, 2, 1), (19, 23, 2), (19, 31, 8), (19, 33, 1), (19, 36, 1), (19, 39, 1), (19, 40, 2),
    (20, 2, 1), (20, 14, 2), (20, 19, 1), (20, 15, 1), (20, 31, 8), (20, 34, 1), (20, 37, 1), (20, 38, 1), (20, 40, 2),
]

# ========================================
# HELPER FUNCTIONS
# ========================================
def get_hourly_weight(hour: int) -> float:
    """Traffic weight for each hour. Sum across 9..21 is ~1.0."""
    weights = {
        9: 0.02, 10: 0.04, 11: 0.10, 12: 0.12, 13: 0.11,
        14: 0.09, 15: 0.07, 16: 0.08, 17: 0.10, 18: 0.11,
        19: 0.09, 20: 0.05, 21: 0.02
    }
    return weights.get(hour, 0.05)

def build_peak_dates(start_d: datetime.date, end_d: datetime.date, n: int) -> list[datetime.date]:
    """Pick n peak days guaranteed to be inside [start_d, end_d]."""
    candidates = []
    for y in range(start_d.year, end_d.year + 1):
        # Typical peaks: semester starts + game day style
        candidates.extend([
            datetime.date(y, 8, 26),
            datetime.date(y, 9, 21),
            datetime.date(y, 1, 16),
        ])
    candidates = [d for d in candidates if start_d <= d <= end_d]
    candidates = sorted(set(candidates))

    # If not enough “named” peaks fall in range, fill with random in-range dates.
    if len(candidates) < n:
        pool_size = (end_d - start_d).days + 1
        while len(candidates) < n and pool_size > 0:
            d = start_d + timedelta(days=random.randint(0, pool_size - 1))
            candidates.append(d)
            candidates = sorted(set(candidates))

    return candidates[:n]

PEAK_DATES = build_peak_dates(start_date, end_date, NUM_PEAK_DAYS)

def get_daily_multiplier(date_: datetime.date) -> float:
    """Sales multiplier based on weekday + peak days."""
    # Mon..Sun multipliers
    weekday_mult = [0.9, 0.95, 1.0, 1.05, 1.2, 1.3, 1.1]
    mult = weekday_mult[date_.weekday()]
    if date_ in PEAK_DATES:
        mult *= 2.5
    return mult

def pick_modifiers() -> list[dict]:
    """Pick modifiers realistically."""
    mods = []
    # 50% chance an item gets modifier set at all
    if random.random() < 0.5:
        # 30% chance add a topping
        if random.random() < 0.3:
            topping = random.choice([m for m in MODIFIERS if m['modifier_type'] == 'Topping'])
            mods.append(topping)

        # always include sugar + ice (these are 'free' but show realism)
        mods.append(random.choice([m for m in MODIFIERS if m['modifier_type'] == 'Sugar Level']))
        mods.append(random.choice([m for m in MODIFIERS if m['modifier_type'] == 'Ice Level']))

    return mods

# ========================================
# GENERATE ORDER DATA
# ========================================
def generate_orders(base_daily_orders: int, seed: int | None = None):
    """
    base_daily_orders is the *expected* order count per day before day/hour multipliers.
    We spread those orders across hours using weights and per-day multipliers.
    """
    if seed is not None:
        random.seed(seed)

    orders = []
    order_items = []
    order_item_modifiers = []

    order_id = 1
    order_item_id = 1
    total_revenue = 0.0

    current_date = start_date
    while current_date <= end_date:
        daily_mult = get_daily_multiplier(current_date)

        for hour in range(9, 22):  # 9 AM to 9 PM
            hour_weight = get_hourly_weight(hour)

            expected = base_daily_orders * hour_weight * daily_mult
            # add noise but keep it from collapsing to 0 too often
            noise = random.uniform(0.85, 1.15)
            num_orders = max(0, int(expected * noise))

            for _ in range(num_orders):
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                order_time = datetime.time(hour, minute, second)

                employee_id = random.choice([2, 3, 4, 5])
                status = 'completed'

                num_items = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
                selected_menu_items = random.sample(MENU_ITEMS, num_items)

                order_subtotal = 0.0
                order_items_list = []

                for menu_item in selected_menu_items:
                    quantity = random.choices([1, 2], weights=[0.9, 0.1])[0]
                    item_price = float(menu_item['base_price'])

                    mods = pick_modifiers()
                    for mod in mods:
                        item_price += float(mod['price_delta'])

                    item_price = round(item_price, 2)

                    order_items_list.append({
                        'order_item_id': order_item_id,
                        'order_id': order_id,
                        'menu_item_id': menu_item['menu_item_id'],
                        'quantity': quantity,
                        'item_price': item_price,
                        'modifiers': mods
                    })

                    order_subtotal += item_price * quantity
                    order_item_id += 1

                order_subtotal = round(order_subtotal, 2)
                total_revenue += order_subtotal

                orders.append({
                    'order_id': order_id,
                    'employee_id': employee_id,
                    # ISO timestamp string for Postgres
                    'order_time': f"{current_date.isoformat()} {order_time.strftime('%H:%M:%S')}",
                    'status': status,
                    'subtotal': order_subtotal
                })

                for item in order_items_list:
                    order_items.append({
                        'order_item_id': item['order_item_id'],
                        'order_id': item['order_id'],
                        'menu_item_id': item['menu_item_id'],
                        'quantity': item['quantity'],
                        'item_price': item['item_price']
                    })

                    for modifier in item['modifiers']:
                        order_item_modifiers.append({
                            'order_item_id': item['order_item_id'],
                            'modifier_id': modifier['modifier_id'],
                            'modifier_price': modifier['price_delta']
                        })

                order_id += 1

        current_date += timedelta(days=1)

    return orders, order_items, order_item_modifiers, float(total_revenue)

def calibrate_base_daily_orders():
    """
    Auto-tune base_daily_orders so total revenue is close to SALES_TARGET.
    Uses up to 3 passes so you don't babysit multipliers.
    """
    base = 250  # starting guess for ~1M/year with ~ $10–$12 tickets
    seed = 42   # fixed seed so calibration is stable

    for attempt in range(1, 4):
        _, _, _, revenue = generate_orders(base, seed=seed)
        diff = revenue - SALES_TARGET

        print(f"[calibration attempt {attempt}] base_daily_orders={base} revenue=${revenue:,.2f} diff=${diff:,.2f}")

        if abs(diff) <= SALES_TOLERANCE:
            return base

        # scale base by ratio, clamp to avoid wild jumps
        ratio = SALES_TARGET / max(revenue, 1.0)
        ratio = max(0.5, min(2.0, ratio))
        base = max(50, int(base * ratio))

    return base

# ========================================
# WRITE CSV FILES
# ========================================
def write_csv_files():
    print("=" * 60)
    print("GENERATING CSV FILES FOR TEAM OF 5")
    print("=" * 60)
    print(f"Date range: {start_date} -> {end_date} ({NUM_WEEKS} weeks)")
    print(f"Peak dates (guaranteed in range): {', '.join(d.isoformat() for d in PEAK_DATES)}")
    print()

    # 1. Employees
    with open('Employee.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['employee_id', 'first_name', 'last_name', 'role', 'is_active'])
        writer.writeheader()
        writer.writerows(EMPLOYEES)

    # 2. Menu Items
    with open('Menu_item.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['menu_item_id', 'name', 'category', 'base_price', 'is_available'])
        writer.writeheader()
        writer.writerows(MENU_ITEMS)

    # 3. Menu Item Modifications
    with open('Menu_Item_Modifications.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['modifier_id', 'name', 'price_delta', 'modifier_type', 'is_available'])
        writer.writeheader()
        writer.writerows(MODIFIERS)

    # 4. Inventory Items
    with open('Inventory_Item.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['inventory_item_id', 'name', 'quantity_on_hand', 'unit'])
        writer.writeheader()
        writer.writerows(INVENTORY_ITEMS)

    # 5. Menu Inventory
    with open('Menu_Inventory.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['menu_item_id', 'inventory_item_id', 'quantity_required'])
        writer.writerows(MENU_INVENTORY)

    # 6. Calibrate order volume to hit target sales
    print("Calibrating order volume to hit sales target...")
    base_daily_orders = calibrate_base_daily_orders()
    print(f"✅ Using base_daily_orders={base_daily_orders}\n")

    # 7. Generate Orders
    print("Generating order data...")
    orders, order_items, order_item_modifiers, total_revenue = generate_orders(base_daily_orders, seed=None)

    print(f"Generated {len(orders):,} orders")
    print(f"Generated {len(order_items):,} order items")
    print(f"Generated {len(order_item_modifiers):,} order item modifiers")
    print(f"Total revenue: ${total_revenue:,.2f}")
    print(f"Target: ${SALES_TARGET:,.2f}")
    print()

    # 8. Orders
    with open('Order.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['order_id', 'employee_id', 'order_time', 'status', 'subtotal'])
        writer.writeheader()
        writer.writerows(orders)

    # 9. Order Items
    with open('Order_item.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['order_item_id', 'order_id', 'menu_item_id', 'quantity', 'item_price'])
        writer.writeheader()
        writer.writerows(order_items)

    # 10. Order Item Modifiers
    with open('Order_Item_Modifier.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['order_item_id', 'modifier_id', 'modifier_price'])
        writer.writeheader()
        writer.writerows(order_item_modifiers)

    print("=" * 60)
    print("ALL CSV FILES GENERATED SUCCESSFULLY!")
    print("=" * 60)
    print("Files created:")
    print("  - employees.csv")
    print("  - menu_items.csv")
    print("  - menu_item_modifications.csv")
    print("  - inventory_items.csv")
    print("  - menu_inventory.csv")
    print("  - orders.csv")
    print("  - order_items.csv")
    print("  - order_item_modifiers.csv")

if __name__ == "__main__":
    write_csv_files()