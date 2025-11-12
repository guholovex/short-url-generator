import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { getLongUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { shortcode: string } }
) {
  try {
    const db = await getDbConnection();
    const longUrl = await getLongUrl(db, params.shortcode);
    if (longUrl) {
      return NextResponse.redirect(longUrl, 301);
    }
    return new NextResponse('404 - 未找到', { status: 404 });
  } catch (error: any) {
    console.error('GET short error:', error);
    return new NextResponse('500 - 服务器错误', { status: 500 });
  }
}
