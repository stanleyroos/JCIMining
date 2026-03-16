import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

type Action = 'Approve' | 'Reject' | 'Refer' | 'MarkForExport';

const ACTION_STATUS_MAP: Record<Action, string> = {
  Approve:       'Approved',
  Reject:        'Rejected',
  Refer:         'Referred',
  MarkForExport: 'Approved',
};

const ACTION_LOG_TYPE: Record<Action, string> = {
  Approve:       'Approved',
  Reject:        'Rejected',
  Refer:         'Referred',
  MarkForExport: 'MarkedForExport',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json() as { action: Action; comments?: string; reviewedBy?: string };
    const { action, comments, reviewedBy = 'Accounts Team' } = body;

    if (!['Approve', 'Reject', 'Refer', 'MarkForExport'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get approval queue record
    const queues = await query<{ ApprovalQueueId: number; CurrentStatus: string }[]>(
      `SELECT ApprovalQueueId, CurrentStatus FROM ApprovalQueue WHERE InvoiceHeaderId = @id`,
      { id: id }
    );

    if (!queues[0]) return NextResponse.json({ error: 'Queue record not found' }, { status: 404 });

    const queueId = queues[0].ApprovalQueueId;
    const newStatus = ACTION_STATUS_MAP[action];
    const readyForExport = action === 'Approve' || action === 'MarkForExport' ? 1 : 0;

    // Update ApprovalQueue
    await execute(
      `UPDATE ApprovalQueue
       SET CurrentStatus     = @status,
           ReviewedBy        = @reviewer,
           ReviewedDateTime  = GETUTCDATE(),
           ReviewComments    = @comments,
           ReadyForExport    = @ready,
           UpdatedDateTime   = GETUTCDATE()
       WHERE ApprovalQueueId = @queueId`,
      {
        status:   newStatus,
        reviewer: reviewedBy,
        comments: comments ?? null,
        ready:    readyForExport,
        queueId:  queueId,
      }
    );

    // Insert audit log entry
    await execute(
      `INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
       VALUES (@queueId, @actionType, @actionBy, @comments)`,
      {
        queueId:    queueId,
        actionType: ACTION_LOG_TYPE[action],
        actionBy:   reviewedBy,
        comments:   comments ?? null,
      }
    );

    return NextResponse.json({ success: true, newStatus });
  } catch (err) {
    console.error('Invoice action error:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
