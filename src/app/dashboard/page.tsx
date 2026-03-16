export const dynamic = 'force-dynamic';

import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import type { DashboardStats, InvoiceListItem, InvoiceStatus } from '@/types';

async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/stats`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

async function getRecentInvoices(): Promise<InvoiceListItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices?page=1`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.slice(0, 8) ?? [];
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount == null) return '—';
  return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function DashboardPage() {
  let stats: DashboardStats;
  let recent: InvoiceListItem[] = [];

  try {
    [stats, recent] = await Promise.all([getStats(), getRecentInvoices()]);
  } catch {
    stats = { total: 0, New: 0, Matched: 0, NeedsReview: 0, FraudRisk: 0, Approved: 0, Rejected: 0, Referred: 0, Exported: 0, readyForExport: 0 };
  }

  const statCards = [
    { label: 'Total Invoices', value: stats.total,        color: '#2EA3F2', icon: <InvoiceIcon /> },
    { label: 'New',            value: stats.New,           color: '#64748b', icon: <NewIcon /> },
    { label: 'Matched',        value: stats.Matched,       color: '#3b82f6', icon: <MatchIcon /> },
    { label: 'Needs Review',   value: stats.NeedsReview,   color: '#f59e0b', icon: <ReviewIcon /> },
    { label: 'Fraud Risk',     value: stats.FraudRisk,     color: '#ef4444', icon: <FraudIcon /> },
    { label: 'Approved',       value: stats.Approved,      color: '#22c55e', icon: <CheckIcon /> },
    { label: 'Ready to Export',value: stats.readyForExport,color: '#14b8a6', icon: <ExportIcon /> },
    { label: 'Exported',       value: stats.Exported,      color: '#8b5cf6', icon: <DoneIcon /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">Invoice processing status across all suppliers</p>
        </div>
        <div className="flex gap-3">
          <Link href="/invoices?status=FraudRisk" className="btn-danger py-2">
            View Fraud Risks ({stats.FraudRisk})
          </Link>
          <Link href="/export" className="btn-primary py-2">
            Sage Export ({stats.readyForExport} ready)
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Alerts */}
      {stats.FraudRisk > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">
              {stats.FraudRisk} invoice{stats.FraudRisk !== 1 ? 's' : ''} flagged as Fraud Risk
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              These invoices have bank details that do not match the supplier master record. Please review immediately.
            </p>
          </div>
          <Link href="/invoices?status=FraudRisk" className="ml-auto text-xs font-medium text-red-700 underline shrink-0">
            Review now →
          </Link>
        </div>
      )}

      {stats.NeedsReview > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.NeedsReview} invoice{stats.NeedsReview !== 1 ? 's' : ''} need manual review
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Partial matches or missing PO numbers require human verification.</p>
          </div>
          <Link href="/invoices?status=NeedsReview" className="ml-auto text-xs font-medium text-amber-700 underline shrink-0">
            Review now →
          </Link>
        </div>
      )}

      {/* Recent invoices */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-slate-700">Recent Invoices</h3>
          <Link href="/invoices" className="text-xs text-brand-blue hover:underline font-medium">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No invoices in the system yet.</p>
            <p className="text-xs mt-1">Invoices will appear here once the Logic App processes documents.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Supplier</th>
                <th className="table-th">Invoice No.</th>
                <th className="table-th">Date</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((inv) => (
                <tr key={inv.InvoiceHeaderId} className="hover:bg-slate-50">
                  <td className="table-td font-medium text-slate-800 max-w-[160px] truncate">
                    {inv.SupplierName ?? <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  <td className="table-td font-mono text-slate-600">{inv.InvoiceNumber ?? '—'}</td>
                  <td className="table-td text-slate-500">{formatDate(inv.InvoiceDate)}</td>
                  <td className="table-td font-semibold">{formatCurrency(inv.TotalAmount, inv.Currency)}</td>
                  <td className="table-td">
                    <StatusBadge status={inv.CurrentStatus as InvoiceStatus} size="sm" />
                  </td>
                  <td className="table-td">
                    <Link href={`/invoices/${inv.InvoiceHeaderId}`} className="text-xs text-brand-blue hover:underline">
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Inline icon components
function InvoiceIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function NewIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" /></svg>;
}
function MatchIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function ReviewIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function FraudIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function CheckIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ExportIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
}
function DoneIcon() {
  return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" /></svg>;
}
