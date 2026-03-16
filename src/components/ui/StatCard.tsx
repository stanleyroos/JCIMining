interface Props {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
  href?: string;
}

export default function StatCard({ label, value, color = '#2EA3F2', icon }: Props) {
  return (
    <div className="card p-5 flex items-center gap-4">
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{label}</p>
        <p className="text-3xl font-bold mt-0.5" style={{ color }}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
