import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { saveShortUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { url, custom_code, expires_in_days } = await req.json();
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'; // 更好 IP 检测

    const db = await getDbConnection();
    const shortCode = await saveShortUrl(
      db,
      url,
      custom_code,
      ip,
      expires_in_days
    ); // 传 IP 限流

    const baseUrl = `${
      req.headers.get('x-forwarded-proto') || 'https'
    }://${req.headers.get('host')}/`;
    const shortUrl = `${baseUrl}${shortCode}`;

    return NextResponse.json({ shortUrl, message: '生成成功！' });
  } catch (error: any) {
    console.error('POST generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
