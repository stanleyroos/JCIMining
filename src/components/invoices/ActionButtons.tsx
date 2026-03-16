'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InvoiceStatus } from '@/types';

interface Props {
  invoiceId: number;
  currentStatus: InvoiceStatus;
}

export default function ActionButtons({ invoiceId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [reviewer, setReviewer] = useState('Accounts Team');
  const [showComments, setShowComments] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isTerminal = ['Exported', 'Rejected'].includes(currentStatus);

  function promptAction(action: string) {
    setPendingAction(action);
    setShowComments(true);
  }

  async function submitAction() {
    if (!pendingAction) return;
    setLoading(pendingAction);
    setShowComments(false);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pendingAction, comments, reviewedBy: reviewer }),
      });
      if (res.ok) {
        setComments('');
        setPendingAction(null);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-slate-700">Actions</h3>
      </div>
      <div className="card-body space-y-3">
        {/* Reviewer name */}
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Reviewed by</label>
          <input
            type="text"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>

        {/* Comment box (shown when action is pending) */}
        {showComments && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-xs font-medium text-amber-700">
              {pendingAction === 'Reject' ? 'Please provide a rejection reason:' : 'Add a comment (optional):'}
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input min-h-[60px] resize-y"
              placeholder="Enter comments…"
            />
            <div className="flex gap-2">
              <button onClick={submitAction} disabled={!!loading} className="btn-primary flex-1">
                Confirm {pendingAction}
              </button>
              <button onClick={() => { setShowComments(false); setPendingAction(null); }} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isTerminal && !showComments && (
          <div className="space-y-2">
            <button
              onClick={() => promptAction('Approve')}
              disabled={!!loading || currentStatus === 'Approved'}
              className="btn-success w-full"
            >
              Approve
            </button>

            <button
              onClick={() => promptAction('Refer')}
              disabled={!!loading}
              className="w-full bg-violet-100 hover:bg-violet-200 text-violet-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-150"
            >
              Refer to Manager
            </button>

            <button
              onClick={() => promptAction('Reject')}
              disabled={!!loading}
              className="btn-danger w-full"
            >
              Reject
            </button>
          </div>
        )}

        {isTerminal && (
          <p className="text-center py-3 text-sm text-slate-400">
            This invoice has been {currentStatus.toLowerCase()} — no further actions available.
          </p>
        )}
      </div>
    </div>
  );
}
