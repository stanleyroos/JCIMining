import { query, sql } from './db';

interface ExportInvoice {
  InvoiceHeaderId: number;
  InvoiceNumber: string | null;
  InvoiceDate: string | null;
  SupplierCode: string | null;
  SupplierName: string | null;
  Currency: string | null;
  SubtotalAmount: number | null;
  VatAmount: number | null;
  TotalAmount: number | null;
  PurchaseOrderNumber: string | null;
  lines: ExportLine[];
}

interface ExportLine {
  LineNumber: number;
  Description: string | null;
  Quantity: number | null;
  UnitPrice: number | null;
  LineAmount: number | null;
}

function csvEscape(val: string | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(d: string | null): string {
  if (!d) return '';
  // Sage X3 expects DD/MM/YYYY
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day   = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year  = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '0.00';
  return n.toFixed(2);
}

export async function buildSageExportCsv(invoiceHeaderIds: number[]): Promise<string> {
  if (invoiceHeaderIds.length === 0) return '';

  // Fetch invoices with matched supplier codes
  const idList = invoiceHeaderIds.map(id => id).join(',');

  const invoiceRows = await query<ExportInvoice[]>(
    `SELECT
       ih.InvoiceHeaderId,
       ih.InvoiceNumber,
       ih.InvoiceDate,
       COALESCE(sm.SupplierCode, '') AS SupplierCode,
       ih.SupplierName,
       ih.Currency,
       ih.SubtotalAmount,
       ih.VatAmount,
       ih.TotalAmount,
       ih.PurchaseOrderNumber
     FROM InvoiceHeader ih
     LEFT JOIN InvoiceMatchResult imr ON imr.InvoiceHeaderId = ih.InvoiceHeaderId
     LEFT JOIN SupplierMaster sm ON sm.SupplierId = imr.MatchedSupplierId
     WHERE ih.InvoiceHeaderId IN (${idList})`
  );

  // Fetch lines for all invoices
  const lineRows = await query<(ExportLine & { InvoiceHeaderId: number })[]>(
    `SELECT InvoiceHeaderId, LineNumber, Description, Quantity, UnitPrice, LineAmount
     FROM InvoiceLine
     WHERE InvoiceHeaderId IN (${idList})
     ORDER BY InvoiceHeaderId, LineNumber`
  );

  // Group lines by invoice
  const linesByInvoice: Record<number, ExportLine[]> = {};
  for (const line of lineRows) {
    if (!linesByInvoice[line.InvoiceHeaderId]) linesByInvoice[line.InvoiceHeaderId] = [];
    linesByInvoice[line.InvoiceHeaderId].push(line);
  }

  const csvLines: string[] = [];

  // ----- CSV Header Row -----
  // Sage X3 Supplier Invoice import format
  // H rows = invoice header, D rows = detail lines, T rows = tax lines
  csvLines.push([
    'ROW_TYPE',
    'INVOICE_TYPE',
    'INVOICE_NUM',
    'INVOICE_DATE',
    'SUPPLIER_CODE',
    'CURRENCY',
    'SUBTOTAL',
    'VAT_AMOUNT',
    'TOTAL',
    'PO_NUMBER',
    'LINE_NUM',
    'DESCRIPTION',
    'QUANTITY',
    'UNIT_PRICE',
    'LINE_AMOUNT',
  ].join(','));

  for (const inv of invoiceRows) {
    const lines = linesByInvoice[inv.InvoiceHeaderId] ?? [];

    // Header row (H)
    csvLines.push([
      'H',
      'API',  // Sage X3 invoice type: API = Accounts Payable Invoice
      csvEscape(inv.InvoiceNumber),
      formatDate(inv.InvoiceDate),
      csvEscape(inv.SupplierCode || inv.SupplierName),
      csvEscape(inv.Currency || 'ZAR'),
      formatAmount(inv.SubtotalAmount),
      formatAmount(inv.VatAmount),
      formatAmount(inv.TotalAmount),
      csvEscape(inv.PurchaseOrderNumber),
      '', '', '', '', '',
    ].join(','));

    // Detail lines (D)
    if (lines.length > 0) {
      for (const line of lines) {
        csvLines.push([
          'D',
          '',
          csvEscape(inv.InvoiceNumber),
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          String(line.LineNumber),
          csvEscape(line.Description),
          line.Quantity != null ? line.Quantity.toFixed(4) : '',
          formatAmount(line.UnitPrice),
          formatAmount(line.LineAmount),
        ].join(','));
      }
    } else {
      // No lines extracted — create a single summary line
      csvLines.push([
        'D',
        '',
        csvEscape(inv.InvoiceNumber),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '1',
        'Invoice total (no line detail extracted)',
        '1.0000',
        formatAmount(inv.TotalAmount),
        formatAmount(inv.TotalAmount),
      ].join(','));
    }

    // Tax row (T)
    if (inv.VatAmount != null && inv.VatAmount > 0) {
      csvLines.push([
        'T',
        '',
        csvEscape(inv.InvoiceNumber),
        '',
        '',
        '',
        '',
        formatAmount(inv.VatAmount),
        '',
        '',
        '',
        'VAT',
        '',
        '',
        '',
      ].join(','));
    }
  }

  return csvLines.join('\r\n');
}
