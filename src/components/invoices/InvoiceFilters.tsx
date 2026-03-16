'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { STATUS_LABELS } from '@/lib/constants';
import type { InvoiceStatus } from '@/types';

// Statuses shown in the active queue
const QUEUE_STATUSES: InvoiceStatus[] = ['New', 'Matched', 'NeedsReview', 'FraudRisk', 'Approved', 'Referred'];

export default function InvoiceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view          = searchParams.get('view') || 'queue';
  const currentStatus = searchParams.get('status') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMonth  = searchParams.get('month') || '';

  function setParam(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function switchView(v: string) {
    router.push(`${pathname}?view=${v}`);
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Active Queue / History toggle */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg w-fit">
        {(['queue', 'history'] as const).map((v) => (
          <button
            key={v}
            onClick={() => switchView(v)}
            className={clsx(
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
              view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {v === 'queue' ? 'Active Queue' : 'History'}
          </button>
        ))}
      </div>

      {view === 'queue' ? (
        <div className="flex flex-col gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setParam({ status: '' })}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                !currentStatus ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              All
            </button>
            {QUEUE_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setParam({ status: s })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                  currentStatus === s
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <SearchBox value={currentSearch} onChange={(v) => setParam({ search: v })} />
        </div>
      ) : (
        /* History — month picker + search */
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Month</label>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setParam({ month: e.target.value })}
              className="input py-1.5 text-xs w-36"
            />
            {currentMonth && (
              <button
                onClick={() => setParam({ month: '' })}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
          <SearchBox value={currentSearch} onChange={(v) => setParam({ search: v })} />
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search supplier or invoice no."
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-9"
      />
    </div>
  );
}
