import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db'; // 从 db.ts 导入
import { getLongUrl } from '@/lib/utils'; // getLongUrl 在 utils

export async function GET(
  req: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  const db = await getDbConnection();
  const longUrl = await getLongUrl(db, params.shortcode);
  if (longUrl) {
    return NextResponse.redirect(longUrl, 301);
  }
  return new NextResponse('404 - 未找到', { status: 404 });
}
