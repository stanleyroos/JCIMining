import type { ApprovalActionLog } from '@/types';

interface Props {
  logs: ApprovalActionLog[];
}

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Submitted:      { bg: 'bg-slate-100',   text: 'text-slate-600',  icon: '📥' },
  Matched:        { bg: 'bg-blue-100',    text: 'text-blue-700',   icon: '🔍' },
  Approved:       { bg: 'bg-green-100',   text: 'text-green-700',  icon: '✅' },
  Rejected:       { bg: 'bg-red-100',     text: 'text-red-700',    icon: '❌' },
  Referred:       { bg: 'bg-purple-100',  text: 'text-purple-700', icon: '↗️' },
  MarkedForExport:{ bg: 'bg-teal-100',    text: 'text-teal-700',   icon: '📤' },
  Exported:       { bg: 'bg-teal-100',    text: 'text-teal-700',   icon: '✔️' },
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditLog({ logs }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-slate-700">Review Audit Log</h3>
        <span className="text-xs text-slate-400">{logs.length} event{logs.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="card-body">
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No actions recorded yet.</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-4 pl-10">
              {logs.map((log) => {
                const style = ACTION_COLORS[log.ActionType] ?? ACTION_COLORS['Submitted'];
                return (
                  <div key={log.ApprovalActionLogId} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-[1.75rem] w-5 h-5 rounded-full ${style.bg} flex items-center justify-center text-xs`}>
                      <span>{style.icon}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${style.text}`}>
                          {log.ActionType.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-xs text-slate-400">by {log.ActionBy}</span>
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDateTime(log.ActionDateTime)}
                        </span>
                      </div>
                      {log.Comments && (
                        <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{log.Comments}&rdquo;</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
