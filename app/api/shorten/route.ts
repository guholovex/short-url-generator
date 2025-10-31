import { NextRequest, NextResponse } from 'next/server';
// import { kv } from '@vercel/kv'; // 需要安装 @vercel/kv
import { getDbConnection } from '@/lib/db';
import { saveShortUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // 强制动态渲染，跳过 prerender

export async function POST(req: NextRequest) {
  try {
    const { url, custom_code } = await req.json();
    // const ip = req.headers.get('x-forwarded-for') || 'unknown';
    // const rateKey = `rate_${ip}`;
    // const now = Date.now();
    // const rateData = (await kv.get<{ count: number; time: number }>(
    //   rateKey
    // )) || { count: 0, time: now };

    // if (now - rateData.time > 60000) {
    //   // 1 分钟重置
    //   await kv.set(rateKey, { count: 0, time: now });
    //   rateData.count = 0;
    // }

    // if (rateData.count >= 5) {
    //   return NextResponse.json(
    //     { error: '请求频繁，请 1 分钟后重试' },
    //     { status: 429 }
    //   );
    // }

    const db = await getDbConnection();
    const shortCode = await saveShortUrl(db, url, custom_code);
    const baseUrl = `${
      req.headers.get('x-forwarded-proto') || 'https'
    }://${req.headers.get('host')}/`;
    const shortUrl = `${baseUrl}${shortCode}`;

    await kv.set(rateKey, { ...rateData, count: rateData.count + 1 });

    return NextResponse.json({ shortUrl, message: '生成成功！' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
