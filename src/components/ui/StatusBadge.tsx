import clsx from 'clsx';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants';
import type { InvoiceStatus } from '@/types';

interface Props {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS['New'];
  const label  = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('rounded-full shrink-0', colors.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {label}
    </span>
  );
}
