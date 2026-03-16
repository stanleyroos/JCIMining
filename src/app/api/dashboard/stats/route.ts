import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { DashboardStats } from '@/types';

export async function GET() {
  try {
    const rows = await query<{ CurrentStatus: string; cnt: number }[]>(
      `SELECT CurrentStatus, COUNT(*) AS cnt
       FROM ApprovalQueue
       GROUP BY CurrentStatus`
    );

    const totalRow = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM ApprovalQueue`
    );

    const readyRow = await query<{ cnt: number }[]>(
      `SELECT COUNT(*) AS cnt FROM ApprovalQueue WHERE ReadyForExport = 1 AND ExportStatus = 'Pending'`
    );

    const statusMap: Record<string, number> = {};
    for (const r of rows) {
      statusMap[r.CurrentStatus] = r.cnt;
    }

    const stats: DashboardStats = {
      total:        totalRow[0]?.total ?? 0,
      New:          statusMap['New']         ?? 0,
      Matched:      statusMap['Matched']     ?? 0,
      NeedsReview:  statusMap['NeedsReview'] ?? 0,
      FraudRisk:    statusMap['FraudRisk']   ?? 0,
      Approved:     statusMap['Approved']    ?? 0,
      Rejected:     statusMap['Rejected']    ?? 0,
      Referred:     statusMap['Referred']    ?? 0,
      Exported:     statusMap['Exported']    ?? 0,
      readyForExport: readyRow[0]?.cnt ?? 0,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
