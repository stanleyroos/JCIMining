import type { InvoiceMatchResult } from '@/types';

interface Props {
  matchResult: InvoiceMatchResult | null;
  onRunMatch?: () => void;
  loading?: boolean;
}

interface CheckRowProps {
  label: string;
  passed: boolean | null;
  description?: string;
}

function CheckRow({ label, passed, description }: CheckRowProps) {
  if (passed === null) {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        passed ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {passed ? (
          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div>
        <p className={`text-sm font-medium ${passed ? 'text-green-700' : 'text-red-700'}`}>{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function MatchingResults({ matchResult, onRunMatch, loading }: Props) {
  const score = matchResult?.MatchScore ?? null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-slate-700">Matching Results</h3>
        {onRunMatch && (
          <button
            onClick={onRunMatch}
            disabled={loading}
            className="btn-primary py-1.5 px-3 text-xs"
          >
            {loading ? 'Running…' : matchResult ? 'Re-run Match' : 'Run Match'}
          </button>
        )}
      </div>
      <div className="card-body">
        {matchResult ? (
          <>
            {/* Score gauge */}
            <div className="mb-4 p-4 rounded-xl bg-slate-50 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={(score ?? 0) >= 80 ? '#22c55e' : (score ?? 0) >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${score ?? 0} ${100 - (score ?? 0)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-700">{score}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {matchResult.MatchStatus === 'Matched' && 'Good Match'}
                  {matchResult.MatchStatus === 'NeedsReview' && 'Needs Review'}
                  {matchResult.MatchStatus === 'FraudRisk' && 'Fraud Risk Detected'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {matchResult.MatchStatus === 'FraudRisk'
                    ? 'Please escalate to management before approving'
                    : matchResult.MatchStatus === 'NeedsReview'
                    ? 'Manual verification required'
                    : 'All key checks passed'}
                </p>
              </div>
            </div>

            {/* Individual checks */}
            <div>
              <CheckRow label="Supplier Verified"     passed={matchResult.SupplierMatchFlag} />
              <CheckRow label="Purchase Order Found"  passed={matchResult.PoMatchFlag} />
              <CheckRow label="Amount Matches PO"     passed={matchResult.AmountMatchFlag} />
              <CheckRow
                label="Bank Details Match"
                passed={matchResult.BankMatchFlag}
                description={!matchResult.BankMatchFlag && matchResult.SupplierMatchFlag
                  ? 'Bank account differs from supplier master record'
                  : undefined}
              />
              <CheckRow
                label="No Duplicate Invoice"
                passed={matchResult.DuplicateInvoiceFlag === null ? null : !matchResult.DuplicateInvoiceFlag}
                description={matchResult.DuplicateInvoiceFlag ? 'This invoice may have already been processed' : undefined}
              />
            </div>

            {/* AI Reason */}
            {matchResult.MatchReason && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">Match Analysis</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  {matchResult.MatchReason.split(' | ').join('\n')}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No match results yet</p>
            <p className="text-xs mt-1">Click &ldquo;Run Match&rdquo; to check against Sage data</p>
          </div>
        )}
      </div>
    </div>
  );
}
