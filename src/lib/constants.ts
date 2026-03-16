import type { InvoiceStatus } from '@/types';

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  New: 'New',
  Matched: 'Matched',
  NeedsReview: 'Needs Review',
  FraudRisk: 'Risk',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Referred: 'Referred',
  Exported: 'Exported',
};

export const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string; dot: string }> = {
  New:          { bg: 'bg-slate-50',    text: 'text-slate-500',   dot: 'bg-slate-300' },
  Matched:      { bg: 'bg-sky-50',      text: 'text-sky-600',     dot: 'bg-sky-300' },
  NeedsReview:  { bg: 'bg-amber-50',    text: 'text-amber-600',   dot: 'bg-amber-300' },
  FraudRisk:    { bg: 'bg-red-50',      text: 'text-red-500',     dot: 'bg-red-300' },
  Approved:     { bg: 'bg-emerald-50',  text: 'text-emerald-600', dot: 'bg-emerald-300' },
  Rejected:     { bg: 'bg-rose-50',     text: 'text-rose-500',    dot: 'bg-rose-300' },
  Referred:     { bg: 'bg-violet-50',   text: 'text-violet-500',  dot: 'bg-violet-300' },
  Exported:     { bg: 'bg-teal-50',     text: 'text-teal-500',    dot: 'bg-teal-300' },
};

export const ALL_STATUSES: InvoiceStatus[] = [
  'New', 'Matched', 'NeedsReview', 'FraudRisk',
  'Approved', 'Rejected', 'Referred', 'Exported',
];

export const PAGE_SIZE = 20;
