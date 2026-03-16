'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/invoices':  'Invoice Review',
  '/export':    'Sage Export',
};

export default function TopBar() {
  const pathname = usePathname();

  const baseRoute = '/' + pathname.split('/')[1];
  const title = TITLES[baseRoute] ?? 'Invoice Review';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connected to Azure SQL
        </div>
      </div>
    </header>
  );
}
