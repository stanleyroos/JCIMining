import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { runMatching } from '@/lib/matching';

// Accepts either flat format { Description, Quantity, UnitPrice, Amount }
// or the Content Understanding valueObject format { valueObject: { Description: { valueString }, ... } }
interface LineItemInput {
  Description?: string;
  Quantity?: number;
  UnitPrice?: number;
  Amount?: number;
  // Content Understanding nested format
  valueObject?: {
    Description?: { valueString?: string };
    Quantity?:    { valueNumber?: number };
    UnitPrice?:   { valueNumber?: number };
    Amount?:      { valueNumber?: number };
  };
}

function normalizeLineItem(item: LineItemInput): { Description?: string | null; Quantity?: number | null; UnitPrice?: number | null; Amount?: number | null } {
  if (item.valueObject) {
    return {
      Description: item.valueObject.Description?.valueString ?? null,
      Quantity:    item.valueObject.Quantity?.valueNumber    ?? null,
      UnitPrice:   item.valueObject.UnitPrice?.valueNumber   ?? null,
      Amount:      item.valueObject.Amount?.valueNumber      ?? null,
    };
  }
  return item;
}

interface IngestBody {
  // Email / file metadata
  fileName: string;
  sourceMailbox?: string;
  receivedDateTime?: string;
  rawJson?: string;

  // Fields extracted by Content Understanding (match analyzer schema exactly)
  SupplierName?: string;
  SupplierVatNumber?: string;
  InvoiceNumber?: string;
  InvoiceDate?: string;
  PurchaseOrderNumber?: string;
  Currency?: string;
  SubtotalAmount?: number;
  VatAmount?: number;
  TotalAmount?: number;
  BankName?: string;
  BankAccountNumber?: string;
  BankBranchCode?: string;
  LineItems?: LineItemInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IngestBody;
    if (!body.fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // 1. Insert Document row
    const docResult = await query<{ DocumentId: number }[]>(
      `INSERT INTO Document (FileName, SourceMailbox, ReceivedDateTime, ProcessedDateTime, RawExtractionJson)
       OUTPUT INSERTED.DocumentId
       VALUES (@fileName, @sourceMailbox, @receivedDateTime, GETUTCDATE(), @rawJson)`,
      {
        fileName:        body.fileName,
        sourceMailbox:   body.sourceMailbox ?? 'invoices@jcimining.co.za',
        receivedDateTime: body.receivedDateTime ?? null,
        rawJson:         body.rawJson ?? null,
      }
    );
    const documentId = docResult[0]?.DocumentId;
    if (!documentId) throw new Error('Failed to insert Document');

    // 2. Insert InvoiceHeader row
    const headerResult = await query<{ InvoiceHeaderId: number }[]>(
      `INSERT INTO InvoiceHeader (
         DocumentId, SupplierName, SupplierVatNumber, InvoiceNumber, InvoiceDate,
         PurchaseOrderNumber, Currency, SubtotalAmount, VatAmount, TotalAmount,
         BankName, BankAccountNumber, BankBranchCode
       )
       OUTPUT INSERTED.InvoiceHeaderId
       VALUES (
         @docId, @supplierName, @supplierVat, @invoiceNumber, @invoiceDate,
         @poNumber, @currency, @subtotal, @vat, @total,
         @bankName, @bankAccount, @bankBranch
       )`,
      {
        docId:         documentId,
        supplierName:  body.SupplierName  ?? null,
        supplierVat:   body.SupplierVatNumber ?? null,
        invoiceNumber: body.InvoiceNumber ?? null,
        invoiceDate:   body.InvoiceDate   ?? null,
        poNumber:      body.PurchaseOrderNumber ?? null,
        currency:      body.Currency      ?? 'ZAR',
        subtotal:      body.SubtotalAmount ?? null,
        vat:           body.VatAmount     ?? null,
        total:         body.TotalAmount   ?? null,
        bankName:      body.BankName      ?? null,
        bankAccount:   body.BankAccountNumber ?? null,
        bankBranch:    body.BankBranchCode ?? null,
      }
    );
    const invoiceHeaderId = headerResult[0]?.InvoiceHeaderId;
    if (!invoiceHeaderId) throw new Error('Failed to insert InvoiceHeader');

    // 3. Insert line items
    const lines = body.LineItems ?? [];
    for (let i = 0; i < lines.length; i++) {
      const line = normalizeLineItem(lines[i]);
      await execute(
        `INSERT INTO InvoiceLine (InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount)
         VALUES (@headerId, @lineNum, @desc, @qty, @unitPrice, @amount)`,
        {
          headerId:  invoiceHeaderId,
          lineNum:   i + 1,
          desc:      line.Description ?? null,
          qty:       line.Quantity    ?? null,
          unitPrice: line.UnitPrice   ?? null,
          amount:    line.Amount      ?? null,
        }
      );
    }

    // 4. Create ApprovalQueue entry (status: New)
    const queueResult = await query<{ ApprovalQueueId: number }[]>(
      `INSERT INTO ApprovalQueue (InvoiceHeaderId, CurrentStatus)
       OUTPUT INSERTED.ApprovalQueueId
       VALUES (@headerId, 'New')`,
      { headerId: invoiceHeaderId }
    );
    const approvalQueueId = queueResult[0]?.ApprovalQueueId;

    // 5. Audit log: Submitted by Logic App
    if (approvalQueueId) {
      await execute(
        `INSERT INTO ApprovalActionLog (ApprovalQueueId, ActionType, ActionBy, Comments)
         VALUES (@queueId, 'Submitted', 'Logic App', @comments)`,
        {
          queueId:  approvalQueueId,
          comments: `Auto-submitted from ${body.sourceMailbox ?? 'invoices@jcimining.co.za'} — ${body.fileName}`,
        }
      );
    }

    // 6. Run matching immediately — sets status to Matched / NeedsReview / FraudRisk
    const matchResult = await runMatching(invoiceHeaderId);

    return NextResponse.json({
      invoiceHeaderId,
      documentId,
      matchScore:  matchResult.matchScore,
      matchStatus: matchResult.matchStatus,
      matchReason: matchResult.matchReason,
    });
  } catch (err) {
    console.error('Invoice ingest error:', err);
    return NextResponse.json({ error: 'Ingest failed', detail: String(err) }, { status: 500 });
  }
}
