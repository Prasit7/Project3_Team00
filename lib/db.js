import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

let pool;

function parsePropertiesFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

function loadDatabaseConfig() {
  const propertiesPath = path.join(process.cwd(), "db.properties");

  if (!fs.existsSync(propertiesPath)) {
    throw new Error("db.properties was not found in the project root.");
  }

  const properties = parsePropertiesFile(propertiesPath);
  const rawConnectionString = properties["db.url"];
  const user = properties["db.user"];
  const password = properties["db.password"];
  const useSsl = properties["db.ssl"] === "true" || process.env.DB_SSL === "true";

  if (!rawConnectionString || !user || !password) {
    throw new Error("db.properties must define db.url, db.user, and db.password.");
  }

  const normalizedUrl = rawConnectionString.replace(/^jdbc:/, "");
  const databaseUrl = new URL(normalizedUrl);

  return {
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 5432,
    database: databaseUrl.pathname.replace(/^\//, ""),
    user,
    password,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(loadDatabaseConfig());
  }

  return pool;
}
