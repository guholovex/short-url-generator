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
- 创建成功后，点击 Connect Project，选择该项目，在 Custom Prefix 中填入 POSTGRES，然后点击 Connect
- 然后点击 Open in Neon，在 SQL Edit 里添加下面代码后运行
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
