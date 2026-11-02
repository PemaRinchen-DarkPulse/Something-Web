import type { DataSnapshot } from '../data/mock'
import type { AppAlert } from '../data/types'
import { isoDate } from './format'

export function pledgeTotals(data: DataSnapshot, roundId: string): Record<string, number> {
  const round = data.rounds.find((r) => r.id === roundId)
  const totals: Record<string, number> = {}
  round?.pledges.forEach((p) => {
    totals[p.productId] = (totals[p.productId] ?? 0) + p.kg
  })
  return totals
}

/** Confirmed buyer demand vs. kg pledged in the open round, per product. */
export function shortfalls(data: DataSnapshot): { productId: string; ordered: number; pledged: number }[] {
  const open = data.rounds.find((r) => r.status === 'Open')
  if (!open) return []
  const pledged = pledgeTotals(data, open.id)
  const today = isoDate(0)
  const ordered: Record<string, number> = {}
  data.orders
    .filter((o) => o.confirmation === 'Confirmed' && o.deliveryDate >= today && open.productIds.includes(o.productId))
    .forEach((o) => {
      ordered[o.productId] = (ordered[o.productId] ?? 0) + o.kg
    })
  return Object.entries(ordered)
    .map(([productId, kg]) => ({ productId, ordered: kg, pledged: pledged[productId] ?? 0 }))
    .filter((s) => s.pledged < s.ordered)
}

export function buildAlerts(data: DataSnapshot, pendingChanges: number): AppAlert[] {
  const alerts: AppAlert[] = []
  const productName = (id: string) => data.products.find((p) => p.id === id)?.name ?? id

  const unreadable = data.sms.filter((s) => s.status === 'Unreadable').length
  if (unreadable > 0) {
    alerts.push({
      id: `sms-unreadable-${unreadable}`,
      severity: 'danger',
      title: `${unreadable} unreadable SMS ${unreadable === 1 ? 'message' : 'messages'}`,
      detail: 'Assign them manually so farmers’ pledges are not lost.',
      href: '/sms-inbox',
    })
  }

  const failed = data.rounds.filter((r) => r.status === 'Open').reduce((s, r) => s + (r.smsSent?.failed ?? 0), 0)
  if (failed > 0) {
    alerts.push({
      id: `sms-failed-${failed}`,
      severity: 'warning',
      title: `${failed} pledge requests failed to deliver`,
      detail: 'Follow up with these farmers by phone or enter pledges manually.',
      href: '/pledge-rounds',
    })
  }

  const unconfirmed = data.consignments.filter((c) => c.status === 'Planned' && !c.driverConfirmed)
  if (unconfirmed.length > 0) {
    alerts.push({
      id: `driver-unconfirmed-${unconfirmed.map((c) => c.id).join('')}`,
      severity: 'warning',
      title: `${unconfirmed.length} driver ${unconfirmed.length === 1 ? 'booking' : 'bookings'} unconfirmed`,
      detail: unconfirmed.map((c) => c.id).join(', '),
      href: unconfirmed.length === 1 ? `/consignments/${unconfirmed[0].id}` : '/consignments',
    })
  }

  const short = shortfalls(data)
  if (short.length > 0) {
    alerts.push({
      id: `shortfall-${short.map((s) => s.productId).join('')}`,
      severity: 'warning',
      title: `Produce shortfall: ${short.map((s) => productName(s.productId)).join(', ')}`,
      detail: short.map((s) => `${productName(s.productId)} short by ${s.ordered - s.pledged} kg`).join(' · '),
      href: '/pledge-rounds',
    })
  }

  const disputes = data.consignments.flatMap((c) => c.destinations).filter((d) => d.confirmation === 'Disputed').length
  if (disputes > 0) {
    alerts.push({
      id: `disputes-${disputes}`,
      severity: 'danger',
      title: `${disputes} open delivery ${disputes === 1 ? 'dispute' : 'disputes'}`,
      detail: 'Resolve before settlements are approved.',
      href: '/deliveries',
    })
  }

  const unpaid = data.payouts.filter((p) => p.status === 'Unpaid').length
  if (unpaid > 0) {
    alerts.push({
      id: `unpaid-${unpaid}`,
      severity: 'info',
      title: `${unpaid} farmers awaiting payment`,
      detail: 'Record payments once mBoB, mPay or cash is handed over.',
      href: '/payouts',
    })
  }

  if (pendingChanges > 0) {
    alerts.push({
      id: `pending-${pendingChanges}`,
      severity: 'info',
      title: `${pendingChanges} offline ${pendingChanges === 1 ? 'change' : 'changes'} waiting to sync`,
      detail: 'They will be sent when the device is back online.',
      href: '/settings',
    })
  }

  return alerts
}
