const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function generateShortCode(url: string): string {
  // 使用 Crypto API 模拟 joaat 哈希（低碰撞）
  const encoder = new TextEncoder();
  const data = encoder.encode(url + Date.now());
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data[i]) >>> 0; // joaat 变体
  }
  let code = '';
  while (hash > 0) {
    code = CHARS[hash % 36] + code;
    hash = Math.floor(hash / 36);
  }
  return (code + '000000').slice(0, 6).padStart(6, '0');
}

export async function shortCodeExists(
  db: any,
  shortCode: string
): Promise<boolean> {
  const result = await db.query(
    'SELECT 1 FROM short_urls WHERE LOWER(short_code) = LOWER($1) LIMIT 1',
    [shortCode]
  );
  return result.rows.length > 0;
}

export async function saveShortUrl(
  db: any,
  longUrl: string,
  customCode?: string
): Promise<string> {
  if (longUrl.length > 2000) throw new Error('URL 过长');

  if (!longUrl.startsWith('http')) longUrl = 'https://' + longUrl;
  if (!/^https?:\/\//.test(longUrl)) throw new Error('无效 URL');

  const existingResult = await db.query(
    'SELECT short_code FROM short_urls WHERE LOWER(long_url) = LOWER($1)',
    [longUrl]
  );
  if (existingResult.rows.length > 0) return existingResult.rows[0].short_code;

  let shortCode: string;
  if (customCode) {
    shortCode = customCode.toLowerCase();
    if (!/^[a-z0-9]{1,10}$/.test(shortCode))
      throw new Error('短码格式错误（仅小写字母数字，1-10位）');
    if (await shortCodeExists(db, shortCode)) throw new Error('短码已存在');
  } else {
    shortCode = generateShortCode(longUrl);
    let attempts = 0;
    while ((await shortCodeExists(db, shortCode)) && attempts < 5) {
      shortCode = generateShortCode(longUrl + Math.random().toString());
      attempts++;
    }
    if (attempts >= 5) throw new Error('生成短码失败（冲突过多）');
  }

  await db.query(
    'INSERT INTO short_urls (long_url, short_code) VALUES ($1, $2)',
    [longUrl, shortCode]
  );
  return shortCode;
}

export async function getLongUrl(
  db: any,
  shortCode: string
): Promise<string | null> {
  const result = await db.query(
    'SELECT long_url FROM short_urls WHERE LOWER(short_code) = LOWER($1)',
    [shortCode]
  );
  if (result.rows.length > 0) {
    await db.query(
      'UPDATE short_urls SET clicks = clicks + 1 WHERE LOWER(short_code) = LOWER($1)',
      [shortCode]
    );
    return result.rows[0].long_url;
  }
  return null;
}
