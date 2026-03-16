import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { buildSageExportCsv } from '@/lib/sage-export';
import type { SageExportBatch } from '@/types';

// GET /api/export/batches — list all batches
export async function GET() {
  try {
    const batches = await query<SageExportBatch[]>(
      `SELECT * FROM SageExportBatch ORDER BY CreatedDateTime DESC`
    );
    return NextResponse.json(batches);
  } catch (err) {
    console.error('Export batches list error:', err);
    return NextResponse.json({ error: 'Failed to load batches' }, { status: 500 });
  }
}

// POST /api/export/batches — create a new export batch
export async function POST(_req: NextRequest) {
  try {
    // Find all approved invoices ready for export that haven't been exported
    const readyInvoices = await query<{ InvoiceHeaderId: number; ApprovalQueueId: number }[]>(
      `SELECT aq.InvoiceHeaderId, aq.ApprovalQueueId
       FROM ApprovalQueue aq
       WHERE aq.ReadyForExport = 1
         AND aq.ExportStatus = 'Pending'
         AND aq.CurrentStatus = 'Approved'
         AND aq.InvoiceHeaderId NOT IN (
           SELECT sebi.InvoiceHeaderId FROM SageExportBatchItem sebi
           JOIN SageExportBatch seb ON seb.SageExportBatchId = sebi.SageExportBatchId
           WHERE seb.ExportStatus = 'Complete'
         )`
    );

    if (readyInvoices.length === 0) {
      return NextResponse.json({ error: 'No invoices ready for export' }, { status: 400 });
    }

    const batchDate = new Date();
    const batchRef  = `SAGE-${batchDate.getFullYear()}${String(batchDate.getMonth() + 1).padStart(2, '0')}${String(batchDate.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
    const fileName  = `${batchRef}.csv`;

    // Create batch header
    const batchResult = await execute(
      `INSERT INTO SageExportBatch (BatchReference, BatchDate, ExportStatus, FileName, RecordCount)
       OUTPUT INSERTED.SageExportBatchId
       VALUES (@ref, @date, 'Pending', @file, @count)`,
      {
        ref:   batchRef,
        date:  batchDate,
        file:  fileName,
        count: readyInvoices.length,
      }
    );

    const batchId = (batchResult.recordset as unknown as { SageExportBatchId: number }[])[0].SageExportBatchId;

    // Insert batch items
    for (const inv of readyInvoices) {
      await execute(
        `INSERT INTO SageExportBatchItem (SageExportBatchId, InvoiceHeaderId, ExportLineStatus)
         VALUES (@batchId, @invId, 'Included')`,
        {
          batchId: batchId,
          invId:   inv.InvoiceHeaderId,
        }
      );
    }

    // Generate CSV
    const invoiceIds = readyInvoices.map(r => r.InvoiceHeaderId);
    const csv = await buildSageExportCsv(invoiceIds);

    // Mark batch as complete and update export dates
    await execute(
      `UPDATE SageExportBatch
       SET ExportStatus = 'Complete', ExportedDateTime = GETUTCDATE()
       WHERE SageExportBatchId = @batchId`,
      { batchId: batchId }
    );

    // Update export batch items with timestamps
    await execute(
      `UPDATE SageExportBatchItem
       SET ExportedDateTime = GETUTCDATE()
       WHERE SageExportBatchId = @batchId`,
      { batchId: batchId }
    );

    // Update ApprovalQueue records — mark as Exported
    for (const inv of readyInvoices) {
      await execute(
        `UPDATE ApprovalQueue
         SET CurrentStatus = 'Exported', ExportStatus = 'Exported', UpdatedDateTime = GETUTCDATE()
         WHERE ApprovalQueueId = @queueId`,
        { queueId: inv.ApprovalQueueId }
      );
      await execute(
        `INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
         VALUES (@queueId, 'Exported', 'System', @ref)`,
        {
          queueId: inv.ApprovalQueueId,
          ref:     `Included in export batch ${batchRef}`,
        }
      );
    }

    return NextResponse.json({
      batchId,
      batchReference: batchRef,
      fileName,
      recordCount: readyInvoices.length,
      csv,
    });
  } catch (err) {
    console.error('Export batch create error:', err);
    return NextResponse.json({ error: 'Failed to create export batch' }, { status: 500 });
  }
}
