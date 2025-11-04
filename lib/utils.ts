import type { SupabaseClient } from '@supabase/supabase-js';

// 类型定义
interface ShortUrl {
  id?: number;
  long_url: string;
  short_code: string;
  created_at?: string;
  clicks?: number;
}

interface KVInterface {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, opts?: { ex?: number }): Promise<void>;
}

// KV 类型（扩展 db 类型，确保 kv 支持泛型）
interface DbConnection {
  supabase: SupabaseClient<any, 'public', 'public', any, any>;
  kv: KVInterface | null; // 加这行：显式类型
}

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function generateShortCode(
  url: string,
  salt: string = Date.now().toString()
): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(url + salt);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash + data[i]) >>> 0;
  }
  let code = '';
  while (hash > 0 && code.length < 8) {
    // 增到 8 位
    code = CHARS[hash % CHARS.length] + code;
    hash = Math.floor(hash / CHARS.length);
  }
  return code.padStart(6, CHARS[0]); // 至少 6 位
}

export async function shortCodeExists(
  db: DbConnection,
  shortCode: string
): Promise<boolean> {
  if (!shortCode) return false; // 新增：null 安全
  const cacheKey = `exists:${shortCode.toLowerCase()}`;
  const cached = await db.kv.get<boolean>(cacheKey);
  if (cached !== undefined) return cached; // KV 缓存 5min

  const { data, error } = await db.supabase
    .from('short_urls')
    .select('id')
    .eq('short_code', shortCode.toLowerCase())
    .gte('expires_at', 'now()') // 只查未过期
    .maybeSingle();
  if (error) throw error;

  const exists = !!data;
  await db.kv.set(cacheKey, exists, { ex: 300 }); // 5min TTL
  return exists;
}

export async function saveShortUrl(
  db: DbConnection,
  longUrl: string,
  customCode?: string,
  ip?: string, // 用于限流
  expiresInDays: number = 10
): Promise<string> {
  try {
    if (longUrl.length > 2000) throw new Error('URL 过长');
    if (!longUrl.startsWith('http')) longUrl = 'https://' + longUrl;
    if (!/^https?:\/\//.test(longUrl)) throw new Error('无效 URL');

    // 限流（KV-based，5/min per IP）
    if (ip && db.kv) {
      const rateKey = `rate:${ip}`;
      const now = Date.now();
      let rateData = (await db.kv.get<{ count: number; time: number }>(
        rateKey
      )) || { count: 0, time: now };
      if (now - rateData.time > 60000) {
        rateData = { count: 0, time: now };
      }
      if (rateData.count >= 5) throw new Error('请求频繁，请 1 分钟后重试');
      await db.kv.set(
        rateKey,
        { ...rateData, count: rateData.count + 1 },
        { ex: 60 }
      );
    }

    // 检查现有 URL （缓存 + 未过期 DB）
    const cacheKey = `url:${longUrl.toLowerCase()}`;
    const cachedShort = await db.kv.get<string>(cacheKey);
    if (cachedShort) return cachedShort;

    let shortCode: string | null = null;

    // 优先自定义（用 RPC 原子验证/插入）
    if (customCode) {
      const { data, error } = await db.supabase.rpc('save_short_url_rpc', {
        long_url_input: longUrl,
        custom_code_input: customCode,
        expires_days_input: expiresInDays,
      });
      if (error) {
        console.log('Custom RPC error:', error.message);
        throw error; // 显式 throw，统一 catch
      }
      if (!data) {
        throw new Error('自定义 RPC 返回空数据');
      }
      shortCode = data as string;
      console.log('Custom code success:', shortCode);
      // try {
      // } catch (rpcError) {
      //   console.log('Custom RPC failed:', rpcError.message);
      //   // 如果自定义无效/冲突，继续 fallback
      //   if (
      //     rpcError.message.includes('自定义短码无效') ||
      //     rpcError.message.includes('短码已存在')
      //   ) {
      //     // 不 throw，继续 JS fallback
      //   } else {
      //     throw rpcError; // 其他错误如 URL 无效
      //   }
      // }
    }

    if (!shortCode) {
      let attempts = 0;
      while (attempts < 5) {
        const candidateCode = generateShortCode(longUrl);
        if (!(await shortCodeExists(db, candidateCode))) {
          shortCode = candidateCode;
          break;
        }
        attempts++;
      }
      if (!shortCode || attempts >= 5) throw new Error('生成短码冲突，请重试');

      console.log('JS fallback generated:', shortCode);

      // 用 RPC 插入 JS 生成的码（原子，传为 "自定义"）
      const { data: fallbackData, error: fallbackError } =
        await db.supabase.rpc('save_short_url_rpc', {
          long_url_input: longUrl,
          custom_code_input: shortCode,
          expires_days_input: expiresInDays,
        });
      if (fallbackError) {
        console.log('Fallback RPC error:', fallbackError.message);
        throw fallbackError;
      }
      if (!fallbackData) {
        throw new Error('Fallback RPC 返回空数据');
      }

      shortCode = fallbackData as string;
      console.log('Fallback RPC success:', shortCode);
    }

    // 缓存结果 1h
    await db.kv.set(cacheKey, shortCode, { ex: 3600 });
    await db.kv.set(`code:${shortCode.toLowerCase()}`, longUrl, { ex: 3600 }); // 反向缓存

    return shortCode;
  } catch (error: any) {
    console.error('saveShortUrl error:', error);
    throw error;
  }
}

export async function getLongUrl(
  db: DbConnection,
  shortCode: string
): Promise<string | null> {
  try {
    const cacheKey = `code:${shortCode.toLowerCase()}`;
    const cached = await db.kv.get<string>(cacheKey);
    if (cached) {
      // 异步更新点击（不阻塞）
      updateClicks(db.supabase, shortCode).catch(console.error);
      return cached;
    }

    const { data, error } = await db.supabase
      .from('short_urls')
      .select('long_url')
      .eq('short_code', shortCode.toLowerCase())
      .gte('expires_at', 'now()')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const longUrl = (data as Record<string, string>).long_url;
    await db.kv.set(cacheKey, longUrl, { ex: 3600 });

    // 原子更新点击
    await updateClicks(db.supabase, shortCode);

    return longUrl;
  } catch (error: any) {
    console.error('getLongUrl error:', error);
    return null;
  }
}

// 辅助：点击 RPC
async function updateClicks(supabase: any, shortCode: string) {
  if (!shortCode) return; // 新增：null 安全
  const { error } = await supabase.rpc('increment_clicks_rpc', {
    short_code_input: shortCode,
  });
  if (error) console.error('Clicks update failed:', error);
}
