const DEFAULT_SMOOTHIES = [
  { name: "Mango Pineapple Smoothie", category: "Smoothie", basePrice: 6.95 },
  { name: "Blueberry Acai Smoothie", category: "Smoothie", basePrice: 7.25 },
  { name: "Strawberry Banana Smoothie", category: "Smoothie", basePrice: 6.85 },
];

export async function ensureDefaultSmoothies(pool) {
  const wantedNames = DEFAULT_SMOOTHIES.map((item) => item.name.toLowerCase());
  const existingResult = await pool.query(
    `
      SELECT lower(name) AS lower_name
      FROM "Menu_Item"
      WHERE lower(name) = ANY($1::text[])
    `,
    [wantedNames]
  );

  const existing = new Set(existingResult.rows.map((row) => row.lower_name));
  const missing = DEFAULT_SMOOTHIES.filter((item) => !existing.has(item.name.toLowerCase()));
  if (missing.length === 0) return;

  for (const item of missing) {
    await pool.query(
      `
        INSERT INTO "Menu_Item" (name, category, base_price, is_available)
        VALUES ($1, $2, $3, TRUE)
      `,
      [item.name, item.category, item.basePrice]
    );
  }
}

