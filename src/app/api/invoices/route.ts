import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/constants';
import type { InvoiceListItem } from '@/types';

// Active statuses shown in the main queue (everything that needs action or is awaiting export)
const ACTIVE_STATUSES = `'New','Matched','NeedsReview','FraudRisk','Approved','Referred'`;
// History statuses (processed/terminal)
const HISTORY_STATUSES = `'Exported','Rejected'`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const view   = searchParams.get('view') || 'queue'; // 'queue' | 'history'
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const month  = searchParams.get('month') || ''; // YYYY-MM for history filter
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const offset = (page - 1) * PAGE_SIZE;

    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (view === 'history') {
      conditions.push(`aq.CurrentStatus IN (${HISTORY_STATUSES})`);
      if (month) {
        const [y, m] = month.split('-').map(Number);
        conditions.push(`YEAR(ih.InvoiceDate) = @yr AND MONTH(ih.InvoiceDate) = @mo`);
        params.yr = y;
        params.mo = m;
      }
    } else {
      // Default queue view — only active statuses
      if (status && status !== 'All') {
        conditions.push(`aq.CurrentStatus = @status`);
        params.status = status;
      } else {
        conditions.push(`aq.CurrentStatus IN (${ACTIVE_STATUSES})`);
      }
    }

    if (search) {
      conditions.push(`(ih.SupplierName LIKE @search OR ih.InvoiceNumber LIKE @search)`);
      params.search = `%${search}%`;
    }

    const where = conditions.length ? conditions.join(' AND ') : '1=1';

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total
       FROM InvoiceHeader ih
       JOIN ApprovalQueue aq ON aq.InvoiceHeaderId = ih.InvoiceHeaderId
       WHERE ${where}`,
      params
    );

    const rows = await query<InvoiceListItem[]>(
      `SELECT
         ih.InvoiceHeaderId,
         ih.DocumentId,
         d.FileName,
         ih.SupplierName,
         ih.InvoiceNumber,
         ih.InvoiceDate,
         ih.TotalAmount,
         ih.Currency,
         aq.CurrentStatus,
         imr.MatchScore,
         aq.ReadyForExport,
         ih.CreatedDateTime
       FROM InvoiceHeader ih
       JOIN ApprovalQueue aq ON aq.InvoiceHeaderId = ih.InvoiceHeaderId
       JOIN Document d ON d.DocumentId = ih.DocumentId
       LEFT JOIN InvoiceMatchResult imr ON imr.InvoiceHeaderId = ih.InvoiceHeaderId
       WHERE ${where}
       ORDER BY ih.CreatedDateTime DESC
       OFFSET ${offset} ROWS FETCH NEXT ${PAGE_SIZE} ROWS ONLY`,
      params
    );

    return NextResponse.json({
      data: rows,
      total: countRows[0]?.total ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    console.error('Invoices list error:', err);
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
  }
}
