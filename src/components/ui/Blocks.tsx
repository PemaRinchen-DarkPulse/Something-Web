import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-primary-mid/60 pb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Bordered surface for charts and tables. Use sparingly: not everything needs a box. */
export function Panel({
  title,
  description,
  action,
  children,
  className = '',
  flush = false,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Remove body padding (for tables and lists that go edge to edge). */
  flush?: boolean
}) {
  return (
    <section className={`rounded-lg border border-line bg-surface ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  )
}

/** Unboxed section with a rule underneath the heading. */
export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-line pb-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const kpiTone = {
  brand: 'bg-primary-soft text-primary',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof kpiTone
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] text-muted">{label}</p>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${kpiTone[tone]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tnum">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" role="tablist">
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors md:min-h-10 ${
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 text-xs tnum ${active ? 'bg-primary-soft text-primary' : 'bg-subtle text-muted'}`}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function ProgressBar({ value, max, tone = 'brand' }: { value: number; max: number; tone?: 'brand' | 'warning' | 'danger' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = { brand: 'bg-primary', warning: 'bg-[#D99A32]', danger: 'bg-danger' }[tone]
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  )
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">{children}</dl>
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-muted">
        <Icon size={18} />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[13px] text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: ReactNode }) {
  const cls = tone === 'info' ? 'bg-info-soft text-[#2c5f86]' : 'bg-warning-soft text-[#7a520c]'
  return <div className={`rounded-md px-4 py-3 text-[13px] ${cls}`}>{children}</div>
}
