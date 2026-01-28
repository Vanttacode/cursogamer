import { createClient } from "@libsql/client";

const url = import.meta.env.DATABASE_URL;
const authToken = import.meta.env.DATABASE_AUTH_TOKEN;

if (!url) throw new Error("Falta DATABASE_URL");
export const db = createClient({ url, authToken });

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      children_json TEXT NOT NULL,
      children_count INTEGER NOT NULL,
      total_clp INTEGER NOT NULL,
      status TEXT NOT NULL, -- "STARTED" | "CONFIRMED"
      receipt_path TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // total cupos
  await db.execute(`INSERT OR IGNORE INTO meta (key, value) VALUES ('spots_total', '30');`);
  // 5 cupos ya tomados desde apertura
  await db.execute(`INSERT OR IGNORE INTO meta (key, value) VALUES ('spots_taken_seed', '5');`);
}
