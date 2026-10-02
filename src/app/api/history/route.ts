import { NextRequest, NextResponse } from 'next/server';
import { getHistoryItems, searchHistory, clearHistory } from '@/lib/db/history-repo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  const items = query ? await searchHistory(userId, query) : await getHistoryItems(userId);
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const success = await clearHistory(userId);
  return NextResponse.json({ success });
}
