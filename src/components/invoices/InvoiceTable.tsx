'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import StatusBadge from '@/components/ui/StatusBadge';
import type { InvoiceListItem, InvoiceStatus } from '@/types';

interface Props {
  data: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  isHistory?: boolean;
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount == null) return '—';
  const sym = currency === 'ZAR' || !currency ? 'R' : currency + ' ';
  return sym + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoiceTable({ data, total, page, pageSize, isHistory = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="font-medium">No invoices found</p>
        <p className="text-sm mt-1">Try changing the filter or search term</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="table-th">Supplier</th>
              <th className="table-th">Invoice No.</th>
              <th className="table-th">Date</th>
              <th className="table-th">Amount</th>
              <th className="table-th">PO Number</th>
              <th className="table-th">Status</th>
              <th className="table-th">Match Score</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((inv) => (
              <tr key={inv.InvoiceHeaderId} className="hover:bg-slate-50 transition-colors">
                <td className="table-td">
                  <div className="font-medium text-slate-800 truncate max-w-[180px]">
                    {inv.SupplierName ?? <span className="text-slate-400 italic">Unknown</span>}
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[180px]">{inv.FileName}</div>
                </td>
                <td className="table-td font-mono text-slate-600">
                  {inv.InvoiceNumber ?? '—'}
                </td>
                <td className="table-td text-slate-500">
                  {formatDate(inv.InvoiceDate)}
                </td>
                <td className="table-td font-semibold text-slate-800">
                  {formatCurrency(inv.TotalAmount, inv.Currency)}
                </td>
                <td className="table-td font-mono text-slate-500 text-xs">
                  {/* PO not directly in list — shown on detail */}—
                </td>
                <td className="table-td">
                  <StatusBadge status={inv.CurrentStatus as InvoiceStatus} />
                </td>
                <td className="table-td">
                  {inv.MatchScore != null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-16">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${inv.MatchScore}%`,
                            backgroundColor: inv.MatchScore >= 80 ? '#34d399'
                              : inv.MatchScore >= 40 ? '#fbbf24' : '#f87171',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500">{inv.MatchScore}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="table-td">
                  <Link
                    href={`/invoices/${inv.InvoiceHeaderId}`}
                    className={isHistory ? 'btn-secondary py-1.5 px-3 inline-block' : 'btn-primary py-1.5 px-3 inline-block'}
                  >
                    {isHistory ? 'View' : 'Review'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn-secondary px-2.5 py-1.5 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={p === page ? 'btn-primary px-3 py-1.5' : 'btn-secondary px-3 py-1.5'}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="btn-secondary px-2.5 py-1.5 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
