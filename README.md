# 短链接生成器

## 本地运行

```npm
npm install
npm run dev
```

## vercel 部署

- fork 本仓库，在 vercel 上导入
- 点击 Storage，新建一个 Database：选择 Neon 新建
- region 选择合适的区域，点击 Continue，输入 Database name，然后创建
- 创建成功后，点击 Connect Project，选择该项目，然后点击 Connect
- 然后点击 Open in Neon，在 SQL Edit 里添加以下代码并运行

  - 创建 RPC

  ```SQL
  -- 原子化保存短链接的 RPC
  CREATE OR REPLACE FUNCTION save_short_url_rpc(long_url_input TEXT, custom_code_input TEXT DEFAULT NULL)
  RETURNS TEXT AS $$
  DECLARE
  short_code_result TEXT;
  existing_short TEXT;
  BEGIN
  -- 检查现有 URL
  SELECT short_code INTO existing_short
  FROM short_urls
  WHERE LOWER(long_url) = LOWER(long_url_input)
  LIMIT 1;

  IF existing_short IS NOT NULL THEN
    RETURN existing_short;
  END IF;

  IF custom_code_input IS NOT NULL THEN
    short_code_result := LOWER(custom_code_input);
    -- 检查自定义码冲突
    IF EXISTS (SELECT 1 FROM short_urls WHERE LOWER(short_code) = short_code_result) THEN
      RAISE EXCEPTION '短码已存在';
    END IF;
  ELSE
    -- 生成随机码（简化，实际用 JS 生成后传）
    short_code_result := SUBSTRING(MD5(RANDOM()::TEXT), 1, 6); -- 临时，实际用 JS 哈希
    -- 循环检查冲突（简化版，实际用 JS 预查）
    WHILE EXISTS (SELECT 1 FROM short_urls WHERE LOWER(short_code) = short_code_result) LOOP
      short_code_result := SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
    END LOOP;
  END IF;

  -- 插入
  INSERT INTO short_urls (long_url, short_code)
  VALUES (long_url_input, short_code_result);

  RETURN short_code_result;
  EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '保存失败: %', SQLERRM;
  END;
  $$ LANGUAGE plpgsql;
  ```

  - 创建 short_urls table + 索引

  ```SQL
  CREATE TABLE IF NOT EXISTS short_urls (
  id SERIAL PRIMARY KEY,
  long_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_short_code ON short_urls(short_code);
  ```

  - 启用 RLS

  ```SQL
  ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
  ```

  - 创建 Policies

  ```SQL
  -- Policy 1: 公開讀取（重定向用）
  CREATE POLICY "Public read access" ON short_urls
  FOR SELECT USING (true);
  -- Policy 2: 公開插入（生成短連結用，帶格式驗證）
  CREATE POLICY "Public insert access" ON short_urls
  FOR INSERT WITH CHECK (
  long_url ~ '^https?://.+$' AND  -- 確保 URL 以 http(s):// 開頭，且有內容
    length(short_code) >= 1 AND length(short_code) <= 10 AND
    short_code ~ '^[a-zA-Z0-9]+$' -- 僅字母數字，1-10 位
  );
  -- Policy 3: 公開更新（點擊計數用）
  CREATE POLICY "Public update access" ON short_urls
  FOR UPDATE USING (true)
  WITH CHECK (true); -- 允許所有更新（或加條件，如 clicks >= 0）
  ```

  - 创建 Trigger + Function【非必须】

  ```SQL
  -- 刪舊 Trigger
  DROP TRIGGER IF EXISTS enforce_clicks_increment ON short_urls;
  -- 創建 Function
  CREATE OR REPLACE FUNCTION enforce_clicks_increment()
  RETURNS TRIGGER AS $$
  BEGIN
  IF NEW.clicks != OLD.clicks + 1 THEN
  RAISE EXCEPTION 'Clicks can only be incremented by 1 (attempted: % to %)', OLD.clicks, NEW.clicks;
  END IF;
  RETURN NEW;
  END;
    $$
    LANGUAGE plpgsql;
  -- 附加 Trigger
  CREATE TRIGGER enforce_clicks_increment
  BEFORE UPDATE ON short_urls
  FOR EACH ROW EXECUTE FUNCTION enforce_clicks_increment();
  ```

- 添加 KV
  返回 vercel 项目，给项目添加 Redis KV: storage>create database>upstash>Upstash for Redis > Create

- 重新部署
