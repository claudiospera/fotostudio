interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: number
}

export const KpiCard = ({ label, value, sub, icon, trend }: KpiCardProps) => {
  return (
    <div className="bg-[var(--s1)] border border-[var(--b1)] rounded-[var(--r)] p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[var(--t2)] text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && (
          <span className="w-8 h-8 rounded-[var(--r2)] bg-[var(--acd)] flex items-center justify-center text-[var(--ac)]">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-['Syne'] font-bold text-2xl tracking-tight text-[var(--tx)]">{value}</span>
        {trend !== undefined && (
          <span className={`text-xs font-medium pb-0.5 ${trend >= 0 ? 'text-[var(--ac)]' : 'text-[var(--red)]'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {sub && <p className="text-[var(--t3)] text-xs mt-1">{sub}</p>}
    </div>
  )
}
