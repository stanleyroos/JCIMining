'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/invoices',
    label: 'Invoices',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/export',
    label: 'Sage Export',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar flex flex-col w-64 bg-brand-dark text-white shrink-0"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
          <Image
            src="https://jcimining.co.za/wp-content/uploads/2021/11/jci-mining-logo-5.png"
            alt="JCI Mining"
            width={40}
            height={40}
            className="object-contain p-0.5"
            unoptimized
          />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">JCI Mining</div>
          <div className="text-xs text-white/50 leading-tight mt-0.5">AP Invoice Review</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <span className={clsx(active ? 'text-white' : 'text-white/50')}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-blue/30 flex items-center justify-center text-xs font-bold text-brand-blue">
            AP
          </div>
          <div>
            <div className="text-xs font-medium text-white/80">Accounts Payable</div>
            <div className="text-xs text-white/40">Internal Tool · v1.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
