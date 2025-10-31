import { sql } from '@vercel/postgres';

export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS short_urls (
      id SERIAL PRIMARY KEY,
      long_url TEXT NOT NULL,
      short_code VARCHAR(10) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      clicks INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_short_code ON short_urls(short_code);
  `;
}

export async function getDbConnection() {
  await initDatabase();
  return sql;
}
