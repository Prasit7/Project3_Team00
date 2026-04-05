import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

let pool;

function isTruthy(value) {
  return typeof value === "string" && ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

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
  const useSsl = isTruthy(process.env.DB_SSL) || process.env.VERCEL === "1";
  const ssl = useSsl ? { rejectUnauthorized: false } : false;
  const envConnectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (envConnectionString) {
    return {
      connectionString: envConnectionString.replace(/^jdbc:/, ""),
      ssl,
    };
  }

  const envHost = process.env.DB_HOST;
  const envDatabase = process.env.DB_NAME;
  const envUser = process.env.DB_USER;
  const envPassword = process.env.DB_PASSWORD;

  if (envHost && envDatabase && envUser && envPassword) {
    return {
      host: envHost,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      database: envDatabase,
      user: envUser,
      password: envPassword,
      ssl,
    };
  }

  const propertiesPath = path.join(process.cwd(), "db.properties");

  if (!fs.existsSync(propertiesPath)) {
    throw new Error(
      "Database config not found. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD, or provide db.properties locally."
    );
  }

  const properties = parsePropertiesFile(propertiesPath);
  const rawConnectionString = properties["db.url"];
  const user = properties["db.user"];
  const password = properties["db.password"];
  const propertiesUseSsl = properties["db.ssl"] === "true";

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
    ssl: propertiesUseSsl ? { rejectUnauthorized: false } : false,
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(loadDatabaseConfig());
  }

  return pool;
}
