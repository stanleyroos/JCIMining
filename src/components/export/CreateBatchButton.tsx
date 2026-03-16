'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  readyCount: number;
}

export default function CreateBatchButton({ readyCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<{ batchReference: string; recordCount: number; csv: string; fileName: string } | null>(null);

  async function createBatch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/export/batches', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create batch');
        return;
      }
      setLastBatch(data);

      // Auto-download
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 items-end">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {lastBatch && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
          Batch <span className="font-mono font-semibold">{lastBatch.batchReference}</span> created with {lastBatch.recordCount} invoice{lastBatch.recordCount !== 1 ? 's' : ''} — CSV downloaded.
        </div>
      )}
      <button
        onClick={createBatch}
        disabled={loading || readyCount === 0}
        className="btn-primary flex items-center gap-2 disabled:opacity-40"
      >
        {loading ? (
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )}
        {loading ? 'Creating…' : `Create Export Batch (${readyCount} invoice${readyCount !== 1 ? 's' : ''})`}
      </button>
    </div>
  );
}
