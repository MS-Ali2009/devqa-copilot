import { NextRequest, NextResponse } from 'next/server';
import { deleteHistoryItem, getHistoryItem } from '@/lib/db/history-repo';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const existing = await getHistoryItem(id);

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Item not found or forbidden' }, { status: 404 });
  }

  const success = await deleteHistoryItem(id);
  return NextResponse.json({ success });
}
