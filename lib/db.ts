import { Pool } from 'pg'; // 标准 pooled 连接

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }, // Neon SSL
});

export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        long_url TEXT NOT NULL,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        clicks INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_short_code ON short_urls(short_code);
    `);
    console.log('DB initialized');
  } catch (error) {
    console.error('DB init error:', error);
  }
}

export async function getDbConnection() {
  await initDatabase(); // 自动初始化
  return pool; // 返回 Pool
}
