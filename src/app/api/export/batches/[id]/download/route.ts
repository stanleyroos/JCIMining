import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildSageExportCsv } from '@/lib/sage-export';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = parseInt(params.id);
    if (isNaN(batchId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    // Get batch details
    const batches = await query<{ BatchReference: string; FileName: string }[]>(
      `SELECT BatchReference, FileName FROM SageExportBatch WHERE SageExportBatchId = @id`,
      { id: batchId }
    );
    if (!batches[0]) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    // Get invoice IDs in this batch
    const items = await query<{ InvoiceHeaderId: number }[]>(
      `SELECT InvoiceHeaderId FROM SageExportBatchItem WHERE SageExportBatchId = @id`,
      { id: batchId }
    );

    const invoiceIds = items.map(i => i.InvoiceHeaderId);
    const csv = await buildSageExportCsv(invoiceIds);

    const fileName = batches[0].FileName || `${batches[0].BatchReference}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error('Export download error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
