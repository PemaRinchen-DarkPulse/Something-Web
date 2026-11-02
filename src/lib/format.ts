const DAY_MS = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date (YYYY-MM-DD), `offsetDays` from today. */
export function isoDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * DAY_MS)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Full ISO timestamp, `offsetHours` from now. */
export function isoDateTime(offsetHours = 0): string {
  return new Date(Date.now() + offsetHours * 3_600_000).toISOString()
}

function parseDate(value: string): Date {
  // Date-only strings are parsed as local dates to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function fmtDate(value?: string): string {
  if (!value) return '—'
  return parseDate(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDateTime(value?: string): string {
  if (!value) return '—'
  const d = parseDate(value)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function fmtNu(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}Nu. ${Math.abs(Math.round(n)).toLocaleString('en-US')}`
}

/** Nu. 1.43M for large values, full figure below a million. */
export function fmtNuCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `Nu. ${(n / 1_000_000).toFixed(2)}M`
  return fmtNu(n)
}

export function fmtKg(n: number): string {
  return `${fmtNum(n)} kg`
}

export function fmtPct(n: number): string {
  return `${Math.round(n)}%`
}

export function monthKey(value: string): string {
  const d = parseDate(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' })
}

/** "in 3 days", "yesterday", "5 days ago" for a date-only or ISO value. */
export function relativeDay(value: string): string {
  const target = parseDate(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / DAY_MS)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Closed'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h ${pad(m)}m`
  return `${h}h ${pad(m)}m ${pad(sec)}s`
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
