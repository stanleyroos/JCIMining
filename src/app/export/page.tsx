export const dynamic = 'force-dynamic';

import BatchList from '@/components/export/BatchList';
import CreateBatchButton from '@/components/export/CreateBatchButton';
import type { SageExportBatch } from '@/types';

async function getBatches(): Promise<SageExportBatch[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/export/batches`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  return res.json();
}

async function getReadyCount(): Promise<number> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/stats`,
    { cache: 'no-store' }
  );
  if (!res.ok) return 0;
  const stats = await res.json();
  return stats.readyForExport ?? 0;
}

export default async function ExportPage() {
  const [batches, readyCount] = await Promise.all([getBatches(), getReadyCount()]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sage X3 Export</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate CSV import files for Sage X3. Does not post directly — upload the CSV through the Sage import screen.
          </p>
        </div>
        <CreateBatchButton readyCount={readyCount} />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <svg className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">How the export works</p>
          <ul className="text-xs text-blue-700 mt-1 space-y-0.5 list-disc list-inside">
            <li>Only invoices with status <strong>Approved</strong> and <strong>Ready for Export</strong> are included</li>
            <li>Each batch creates a unique reference and generates a Sage X3 supplier invoice import CSV</li>
            <li>Invoices are marked as <strong>Exported</strong> after a batch is created — they cannot be exported again</li>
            <li>Download the CSV and import it via Sage X3 → Purchasing → Import → Supplier Invoices</li>
          </ul>
        </div>
      </div>

      {/* Ready invoices count */}
      {readyCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
            <span className="text-teal-700 font-bold text-sm">{readyCount}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800">
              {readyCount} invoice{readyCount !== 1 ? 's' : ''} ready for export
            </p>
            <p className="text-xs text-teal-600">Click &ldquo;Create Export Batch&rdquo; to generate the Sage X3 CSV file.</p>
          </div>
        </div>
      )}

      {/* Batch history */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-slate-700">Export Batch History</h3>
          <span className="text-xs text-slate-400">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</span>
        </div>
        <BatchList batches={batches} />
      </div>
    </div>
  );
}
