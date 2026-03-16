import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'JCI Mining – AP Invoice Review',
  description: 'Accounts Payable Invoice Review System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
