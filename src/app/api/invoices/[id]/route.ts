import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { InvoiceDetail } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const headers = await query<InvoiceDetail[]>(
      `SELECT ih.*, d.FileName, d.FilePath, d.SourceMailbox, d.ReceivedDateTime, d.ProcessedDateTime
       FROM InvoiceHeader ih
       JOIN Document d ON d.DocumentId = ih.DocumentId
       WHERE ih.InvoiceHeaderId = @id`,
      { id: id }
    );

    if (!headers[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [lines, matchResult, queue, auditLog] = await Promise.all([
      query(
        `SELECT * FROM InvoiceLine WHERE InvoiceHeaderId = @id ORDER BY LineNumber`,
        { id: id }
      ),
      query(
        `SELECT * FROM InvoiceMatchResult WHERE InvoiceHeaderId = @id`,
        { id: id }
      ),
      query(
        `SELECT * FROM ApprovalQueue WHERE InvoiceHeaderId = @id`,
        { id: id }
      ),
      query(
        `SELECT aal.*
         FROM ApprovalActionLog aal
         JOIN ApprovalQueue aq ON aq.ApprovalQueueId = aal.ApprovalQueueId
         WHERE aq.InvoiceHeaderId = @id
         ORDER BY aal.ActionDateTime DESC`,
        { id: id }
      ),
    ]);

    const detail: InvoiceDetail = {
      ...headers[0],
      Document: {
        DocumentId: headers[0].DocumentId,
        FileName: (headers[0] as unknown as Record<string, string>).FileName,
        FilePath: (headers[0] as unknown as Record<string, string | null>).FilePath,
        SourceMailbox: (headers[0] as unknown as Record<string, string | null>).SourceMailbox,
        ReceivedDateTime: (headers[0] as unknown as Record<string, string | null>).ReceivedDateTime,
        ProcessedDateTime: (headers[0] as unknown as Record<string, string | null>).ProcessedDateTime,
        CreatedDateTime: headers[0].CreatedDateTime,
      },
      Lines: lines as unknown as InvoiceDetail['Lines'],
      MatchResult: (matchResult as unknown as InvoiceDetail['MatchResult'][])[0] ?? null,
      Queue: (queue as unknown as InvoiceDetail['Queue'][])[0] ?? null,
      AuditLog: auditLog as unknown as InvoiceDetail['AuditLog'],
    };

    return NextResponse.json(detail);
  } catch (err) {
    console.error('Invoice detail error:', err);
    return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 });
  }
}
