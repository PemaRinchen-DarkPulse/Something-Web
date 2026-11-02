import { useMemo } from 'react'
import type { Consignment } from '../data/types'
import { useStore } from '../store/DataStore'

export const totalKg = (c: Consignment) => c.items.reduce((s, i) => s + i.kg, 0)
export const acceptedKg = (c: Consignment) => c.destinations.reduce((s, d) => s + (d.acceptedKg ?? 0), 0)
export const revenueOf = (c: Consignment) => c.destinations.reduce((s, d) => s + (d.acceptedKg ?? 0) * d.pricePerKg, 0)

/** Statuses where produce has physically left the collection point. */
export const COLLECTED: Consignment['status'][] = ['Dispatched', 'Delivered', 'Settled', 'Closed']
/** Statuses where buyers have confirmed what they accepted. */
export const DELIVERED: Consignment['status'][] = ['Delivered', 'Settled', 'Closed']

/** Name lookups by id, so pages never show raw ids. */
export function useLookups() {
  const { products, members, buyers, drivers } = useStore()
  return useMemo(
    () => ({
      product: (id?: string) => products.find((p) => p.id === id)?.name ?? '—',
      member: (id?: string) => members.find((m) => m.id === id)?.name ?? 'Unknown',
      buyer: (id?: string) => buyers.find((b) => b.id === id)?.name ?? '—',
      driver: (id?: string) => drivers.find((d) => d.id === id)?.name ?? 'Unassigned',
      vehicle: (id?: string) => drivers.find((d) => d.id === id)?.vehicle ?? '—',
    }),
    [products, members, buyers, drivers],
  )
}
