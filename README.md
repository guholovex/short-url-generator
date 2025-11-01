# 短链接生成器
## 本地运行
  ```npm
  npm install
  npm run dev
  ```
## vercel部署
- fork本仓库，在vercel上导入
- 点击 Storage，新建一个Database：选择 Neon 新建
- region 选择合适的区域，点击Continue，输入 Database name，然后创建
- 创建成功后，点击 Connect Project，选择该项目，在 Custom Prefix 中填入 POSTGRES，然后点击 Connect
- 然后点击Open in Neon，在 SQL Edit 里添加
  ```SQL
  CREATE TABLE IF NOT EXISTS short_urls (
  id SERIAL PRIMARY KEY,
  long_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0); CREATE INDEX IF NOT EXISTS idx_short_code ON short_urls(short_code);
  ```
  后运行
