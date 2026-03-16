export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import type { InvoiceListItem } from '@/types';

interface SearchParams {
  view?: string;
  status?: string;
  search?: string;
  month?: string;
  page?: string;
}

async function getInvoices(searchParams: SearchParams) {
  const params = new URLSearchParams();
  if (searchParams.view)   params.set('view',   searchParams.view);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.month)  params.set('month',  searchParams.month);
  if (searchParams.page)   params.set('page',   searchParams.page);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices?${params.toString()}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return { data: [] as InvoiceListItem[], total: 0, page: 1, pageSize: 20 };
  return res.json();
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { data, total, page, pageSize } = await getInvoices(searchParams);
  const isHistory = searchParams.view === 'history';

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {isHistory ? 'Invoice History' : 'Invoice Review'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {total} invoice{total !== 1 ? 's' : ''} {isHistory ? 'processed' : 'awaiting review'}
        </p>
      </div>

      <div className="card">
        <div className="card-body border-b border-slate-100">
          <Suspense fallback={null}>
            <InvoiceFilters />
          </Suspense>
        </div>
        <Suspense fallback={
          <div className="text-center py-12 text-slate-400 text-sm">Loading invoices…</div>
        }>
          <InvoiceTable
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            isHistory={isHistory}
          />
        </Suspense>
      </div>
    </div>
  );
}
