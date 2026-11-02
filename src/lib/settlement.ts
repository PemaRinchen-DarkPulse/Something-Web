import type { Consignment, SettlementResult } from '../data/types'

export const DEFAULT_FEE_PCT = 3

interface Overrides {
  transportCost?: number
  feePct?: number
}

/**
 * Pooled settlement for one consignment.
 *
 *  - Buyers pay per kg they accepted, so revenue = Σ accepted kg × buyer price.
 *  - Every farmer in the pool receives the same pooled price per kg
 *    (revenue ÷ total accepted kg).
 *  - A farmer's accepted kg is their share of the total accepted kg, in the
 *    same proportion as their dispatched kg.
 *  - Transport is split by dispatched kg; the group fee is a % of gross.
 *  - Rounding remainders go to the last farmer so every column sums exactly.
 */
export function computeSettlement(c: Consignment, overrides: Overrides = {}): SettlementResult {
  const feePct = overrides.feePct ?? DEFAULT_FEE_PCT
  const transportTotal = overrides.transportCost ?? c.transportCost

  const totalDispatched = c.items.reduce((s, i) => s + i.kg, 0)
  const totalAccepted = c.destinations.reduce((s, d) => s + (d.acceptedKg ?? 0), 0)
  const revenue = c.destinations.reduce((s, d) => s + (d.acceptedKg ?? 0) * d.pricePerKg, 0)
  const pooledPrice = totalAccepted > 0 ? revenue / totalAccepted : 0

  let acceptedLeft = totalAccepted
  let grossLeft = revenue
  let transportLeft = transportTotal

  const rows = c.items.map((item, index) => {
    const last = index === c.items.length - 1
    const acceptedKg = last
      ? acceptedLeft
      : Math.round((item.kg * totalAccepted) / (totalDispatched || 1))
    const gross = last ? grossLeft : Math.round(acceptedKg * pooledPrice)
    const transport = last
      ? transportLeft
      : Math.round((transportTotal * item.kg) / (totalDispatched || 1))
    const fee = Math.round((gross * feePct) / 100)
    acceptedLeft -= acceptedKg
    grossLeft -= gross
    transportLeft -= transport
    return {
      memberId: item.memberId,
      dispatchedKg: item.kg,
      acceptedKg,
      pricePerKg: pooledPrice,
      gross,
      transport,
      fee,
      net: gross - transport - fee,
    }
  })

  return {
    rows,
    totalDispatched,
    totalAccepted,
    revenue,
    pooledPrice,
    transport: transportTotal,
    fee: rows.reduce((s, r) => s + r.fee, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
  }
}
