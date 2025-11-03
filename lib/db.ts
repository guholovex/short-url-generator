import { createClient } from '@supabase/supabase-js'; // 缓存

// KV 接口：统一 mock/真 KV 签名，支持泛型
interface KVInterface {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any, opts?: { ex?: number }): Promise<void>;
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// KV Mock（本地無 KV 時的空操作）
const createMockKV = () => ({
  get: async (_key: string) => {
    console.warn('KV get skipped in dev mode');
    return undefined;
  },
  set: async (_key: string, _value: any, _opts?: any) => {
    console.warn('KV set skipped in dev mode');
    return; // noop
  },
});

export async function initDatabase() {
  try {
    // 检查连接 & 表
    const { data, error } = await supabase
      .from('short_urls')
      .select('id')
      .limit(1);
    if (
      error &&
      !error.message.includes('relation "short_urls" does not exist')
    ) {
      throw error; // 忽略表不存在（手动创建）
    }
    console.log('Supabase connected');

    // KV 判斷與 Proxy
    const hasKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
    let kvClient: KVInterface = null;
    if (hasKV) {
      const { kv } = await import('@vercel/kv');
      kvClient = kv as KVInterface;
      // 測試
      await kvClient.set('health', 'ok', { ex: 60 });
      if ((await kvClient.get('health')) !== 'ok')
        throw new Error('KV init failed');
      console.log('KV connected (production mode)');
    } else {
      console.log('KV skipped (development mode)');
      kvClient = createMockKV(); // 用 mock
    }

    // Proxy：統一接口，自動處理
    const kvProxy = new Proxy(kvClient, {
      get(target: KVInterface, prop: string | symbol): any {
        const value = Reflect.get(target, prop); // 標準 get
        if (typeof value === 'function') {
          return function (...args: any[]): any {
            return value.apply(target, args); // 直接執行（mock 或真）
          };
        }
        return value;
      },
    });

    return kvProxy; // 返回代理 KV
  } catch (error) {
    console.error('Init error:', error);
    throw error;
  }
}

export async function getDbConnection() {
  const kvProxy = await initDatabase();
  return { supabase, kv: kvProxy as KVInterface | null }; // 返回对象，方便 utils 用
}
