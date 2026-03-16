export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import StatusBadge from '@/components/ui/StatusBadge';
import MatchingResults from '@/components/invoices/MatchingResults';
import LineItemsTable from '@/components/invoices/LineItemsTable';
import AuditLog from '@/components/invoices/AuditLog';
import ActionButtons from '@/components/invoices/ActionButtons';
import type { InvoiceDetail, InvoiceStatus } from '@/types';

async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices/${id}`,
    { cache: 'no-store' }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load invoice');
  return res.json();
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value ?? '—'}</dd>
    </div>
  );
}

function formatAmount(n: number | null, currency?: string | null) {
  if (n == null) return null;
  const sym = currency === 'ZAR' || !currency ? 'R ' : `${currency} `;
  return sym + n.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  const status = invoice.Queue?.CurrentStatus as InvoiceStatus | undefined;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/invoices" className="hover:text-brand-blue transition-colors">Invoices</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">
          {invoice.InvoiceNumber ?? `Invoice #${invoice.InvoiceHeaderId}`}
        </span>
        {status && <StatusBadge status={status} />}
      </div>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {invoice.SupplierName ?? 'Unknown Supplier'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Invoice {invoice.InvoiceNumber ?? '—'} · Received {formatDate(invoice.Document?.ReceivedDateTime ?? invoice.CreatedDateTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">
              {formatAmount(invoice.TotalAmount, invoice.Currency) ?? '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Confidence: {invoice.ExtractionConfidence != null ? `${invoice.ExtractionConfidence}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — extracted fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-slate-700">Extracted Invoice Data</h3>
              <span className="text-xs text-slate-400">Source: {invoice.Document?.FileName}</span>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Supplier Name"   value={invoice.SupplierName} />
                <Field label="VAT Number"      value={invoice.SupplierVatNumber} />
                <Field label="Invoice Number"  value={invoice.InvoiceNumber} />
                <Field label="Invoice Date"    value={formatDate(invoice.InvoiceDate)} />
                <Field label="PO Number"       value={invoice.PurchaseOrderNumber} />
                <Field label="Currency"        value={invoice.Currency} />
                <Field label="Subtotal"        value={formatAmount(invoice.SubtotalAmount, invoice.Currency)} />
                <Field label="VAT Amount"      value={formatAmount(invoice.VatAmount, invoice.Currency)} />
                <Field label="Total Amount"    value={formatAmount(invoice.TotalAmount, invoice.Currency)} />
              </dl>

              {/* Bank details */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Supplier Bank Details on Invoice
                </p>
                <dl className="grid grid-cols-3 gap-4">
                  <Field label="Bank Name"      value={invoice.BankName} />
                  <Field label="Account Number" value={invoice.BankAccountNumber} />
                  <Field label="Branch Code"    value={invoice.BankBranchCode} />
                </dl>
              </div>
            </div>
          </div>

          {/* Line items */}
          <LineItemsTable lines={invoice.Lines} />

          {/* Audit log */}
          <AuditLog logs={invoice.AuditLog} />
        </div>

        {/* Right column — matching + actions */}
        <div className="space-y-5">
          <ActionButtons
            invoiceId={invoice.InvoiceHeaderId}
            currentStatus={status ?? 'New'}
          />
          <MatchingResults matchResult={invoice.MatchResult} />
        </div>
      </div>
    </div>
  );
}
