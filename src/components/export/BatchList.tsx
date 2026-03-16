import type { SageExportBatch } from '@/types';

interface Props {
  batches: SageExportBatch[];
}

const STATUS_STYLE: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Complete: 'bg-green-100 text-green-700',
  Failed:   'bg-red-100 text-red-700',
};

function formatDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function BatchList({ batches }: Props) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <p className="font-medium">No export batches yet</p>
        <p className="text-sm mt-1">Approve invoices and create an export batch to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="table-th">Batch Reference</th>
            <th className="table-th">Batch Date</th>
            <th className="table-th">Records</th>
            <th className="table-th">Status</th>
            <th className="table-th">Exported At</th>
            <th className="table-th">File</th>
            <th className="table-th">Download</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {batches.map((batch) => (
            <tr key={batch.SageExportBatchId} className="hover:bg-slate-50">
              <td className="table-td font-mono font-medium text-slate-800">{batch.BatchReference}</td>
              <td className="table-td text-slate-500">
                {new Date(batch.BatchDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td className="table-td">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm">
                  {batch.RecordCount ?? 0}
                </span>
              </td>
              <td className="table-td">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  STATUS_STYLE[batch.ExportStatus] ?? 'bg-slate-100 text-slate-600'
                }`}>
                  {batch.ExportStatus}
                </span>
              </td>
              <td className="table-td text-slate-500 text-xs">{formatDateTime(batch.ExportedDateTime)}</td>
              <td className="table-td text-xs text-slate-500 font-mono">{batch.FileName ?? '—'}</td>
              <td className="table-td">
                {batch.ExportStatus === 'Complete' && (
                  <a
                    href={`/api/export/batches/${batch.SageExportBatchId}/download`}
                    download={batch.FileName ?? `${batch.BatchReference}.csv`}
                    className="btn-primary py-1.5 px-3 inline-block text-xs"
                  >
                    Download CSV
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
