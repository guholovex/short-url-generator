import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection, getLongUrl } from '@/lib/utils';

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
