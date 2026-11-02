import type { ReactNode } from 'react'

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'dark'

const tones: Record<Tone, { box: string; dot: string }> = {
  success: { box: 'bg-success-soft text-success', dot: 'bg-success' },
  warning: { box: 'bg-warning-soft text-warning', dot: 'bg-[#D99A32]' },
  danger: { box: 'bg-danger-soft text-danger', dot: 'bg-danger' },
  info: { box: 'bg-info-soft text-info', dot: 'bg-info' },
  neutral: { box: 'bg-subtle text-muted', dot: 'bg-[#A0AEC0]' },
  brand: { box: 'bg-primary-soft text-primary', dot: 'bg-primary' },
  dark: { box: 'bg-[#E9EDEA] text-[#3B4652]', dot: 'bg-[#4A5568]' },
}

export function Badge({ tone = 'neutral', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  const t = tones[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${t.box}`}>
      {dot && <span className={`size-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  )
}

const statusTone: Record<string, Tone> = {
  // Consignment lifecycle
  Draft: 'neutral',
  Planned: 'info',
  Dispatched: 'warning',
  Delivered: 'brand',
  Settled: 'success',
  Closed: 'dark',
  Cancelled: 'danger',
  // Rounds, orders, settlements
  Open: 'success',
  'Awaiting buyer': 'warning',
  Confirmed: 'success',
  Declined: 'danger',
  'Awaiting approval': 'warning',
  Approved: 'success',
  // Payouts
  Paid: 'success',
  Unpaid: 'warning',
  Waived: 'neutral',
  // Deliveries
  Pending: 'warning',
  Disputed: 'danger',
  'In transit': 'warning',
  'Awaiting dispatch': 'neutral',
  // Members, SMS, drivers
  Active: 'success',
  Inactive: 'neutral',
  Granted: 'success',
  Parsed: 'success',
  Unreadable: 'danger',
  Assigned: 'info',
  Available: 'success',
  'On trip': 'info',
  'Off duty': 'neutral',
  Responded: 'success',
  'No response': 'neutral',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'neutral'}>{status}</Badge>
}

/** Colours used by charts for each consignment status. */
export const statusColor: Record<string, string> = {
  Draft: '#A0AEC0',
  Planned: '#3B82B8',
  Dispatched: '#D99A32',
  Delivered: '#7FB394',
  Settled: '#246B45',
  Closed: '#4A5568',
  Cancelled: '#D9534F',
}
