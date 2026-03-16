import type { InvoiceLine } from '@/types';

interface Props {
  lines: InvoiceLine[];
}

export default function LineItemsTable({ lines }: Props) {
  if (lines.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          No line items extracted for this invoice.
        </div>
      </div>
    );
  }

  const total = lines.reduce((sum, l) => sum + (l.LineAmount ?? 0), 0);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-slate-700">Line Items</h3>
        <span className="text-xs text-slate-400">{lines.length} line{lines.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="table-th w-12">#</th>
              <th className="table-th">Description</th>
              <th className="table-th text-right">Qty</th>
              <th className="table-th text-right">Unit Price</th>
              <th className="table-th text-right">Line Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line) => (
              <tr key={line.InvoiceLineId} className="hover:bg-slate-50">
                <td className="table-td text-slate-400">{line.LineNumber}</td>
                <td className="table-td">{line.Description ?? '—'}</td>
                <td className="table-td text-right font-mono">
                  {line.Quantity?.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) ?? '—'}
                </td>
                <td className="table-td text-right font-mono">
                  {line.UnitPrice != null
                    ? `R ${line.UnitPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
                <td className="table-td text-right font-semibold font-mono">
                  {line.LineAmount != null
                    ? `R ${line.LineAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={4} className="table-td text-right font-semibold text-slate-700">Total</td>
              <td className="table-td text-right font-bold text-slate-800 font-mono">
                R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
