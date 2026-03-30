const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";
const rawDbUrl = process.env.DB_URL || "";
const connectionString = rawDbUrl.replace(/^jdbc:/, "");
const sslEnabled = process.env.DB_SSL === "true";

const pool = new Pool({
  connectionString,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS connected_at");
    res.json({
      ok: true,
      connectedAt: result.rows[0].connected_at
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/api/menu-items", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT menu_item_id, name, category, base_price, is_available
      FROM "Menu_Item"
      WHERE is_available = TRUE
      ORDER BY menu_item_id
    `);

    res.json(
      result.rows.map((row) => ({
        id: row.menu_item_id,
        name: row.name,
        category: row.category,
        price: Number(row.base_price),
        isAvailable: row.is_available
      }))
    );
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
