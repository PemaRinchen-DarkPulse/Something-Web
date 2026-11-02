/**
 * In-memory data store for the demo.
 *
 * Every function on `Store` is the seam where a Spring Boot REST call goes
 * later (e.g. `addConsignment` -> POST /api/consignments). Right now they only
 * change state held in this browser tab; nothing is sent to a server and
 * everything resets on refresh.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createInitialData, GROUPS } from '../data/mock'
import type { DataSnapshot } from '../data/mock'
import type {
  AppAlert,
  Buyer,
  Consignment,
  ConsignmentItem,
  ConsignmentStatus,
  Driver,
  Group,
  Member,
  Order,
  OrderConfirmation,
  PayoutMethod,
  PledgeRound,
  Product,
  TimelineEvent,
} from '../data/types'
import { buildAlerts } from '../lib/alerts'
import { isoDate, isoDateTime, uid } from '../lib/format'
import { computeSettlement, DEFAULT_FEE_PCT } from '../lib/settlement'

export interface ToastMessage {
  id: string
  text: string
  tone: 'success' | 'info' | 'danger'
}

export interface NewConsignmentInput {
  collectionDate: string
  productId: string
  grade: string
  driverId?: string
  items: ConsignmentItem[]
  destinations: { buyerId: string; plannedKg: number; pricePerKg: number }[]
  transportCost: number
}

export interface DeliveryInput {
  acceptedKg: number
  note?: string
  photos: string[]
}

export interface Store extends DataSnapshot {
  group: Group
  groups: Group[]
  setGroupId: (id: string) => void

  alerts: AppAlert[]
  unreadAlerts: number
  markAlertsRead: () => void

  offline: boolean
  simulatedOffline: boolean
  setSimulatedOffline: (v: boolean) => void
  pendingChanges: number
  syncing: boolean
  lastSynced: string
  syncNow: () => void

  toasts: ToastMessage[]
  toast: (text: string, tone?: ToastMessage['tone']) => void
  dismissToast: (id: string) => void

  addConsignment: (input: NewConsignmentInput) => string
  assignDriver: (consignmentId: string, driverId: string) => void
  confirmDriver: (consignmentId: string) => void
  advanceConsignment: (consignmentId: string, to: ConsignmentStatus, label: string) => void
  cancelConsignment: (consignmentId: string, reason: string) => void
  confirmDelivery: (consignmentId: string, destId: string, input: DeliveryInput) => void
  resolveDispute: (consignmentId: string, destId: string, note: string) => void

  adjustSettlement: (consignmentId: string, input: { transportCost: number; feePct: number; note: string }) => void
  approveSettlement: (consignmentId: string) => void
  recordPayout: (payoutId: string, input: { method: PayoutMethod; reference: string; paidOn: string }) => void
  waivePayout: (payoutId: string, note: string) => void

  addMember: (m: Omit<Member, 'id' | 'joined'>) => void
  updateMember: (id: string, patch: Partial<Member>) => void
  saveProduct: (p: Omit<Product, 'id'> & { id?: string }) => void
  addBuyer: (b: Omit<Buyer, 'id'>) => void
  addDriver: (d: Omit<Driver, 'id'>) => void

  openRound: (r: { title: string; closesAt: string; pickupDate: string; productIds: string[] }) => void
  sendRoundSms: (roundId: string) => void
  closeRound: (roundId: string) => void
  addManualPledge: (roundId: string, p: { memberId: string; productId: string; kg: number }) => void

  saveOrder: (o: Omit<Order, 'id' | 'token' | 'confirmation'> & { id?: string }) => void
  setOrderConfirmation: (id: string, c: OrderConfirmation) => void

  assignSms: (smsId: string, input: { memberId: string; productId: string; kg: number }) => void
}

const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

const nextId = (prefix: string, existing: string[], start = 100) => {
  const nums = existing.map((id) => Number(id.replace(/\D/g, ''))).filter(Number.isFinite)
  return `${prefix}-${Math.max(start, ...nums) + 1}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSnapshot>(() => createInitialData())
  const [groupId, setGroupId] = useState(GROUPS[0].id)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set())

  // Seeded with a few "offline edits" so the pending indicator is visible in the demo.
  const [pendingChanges, setPendingChanges] = useState(3)
  const [simulatedOffline, setSimulatedOffline] = useState(false)
  const [browserOffline, setBrowserOffline] = useState(() => !navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(() => isoDateTime(-1.5))
  const offlineRef = useRef(false)
  const offline = simulatedOffline || browserOffline
  useEffect(() => {
    offlineRef.current = offline
  }, [offline])

  useEffect(() => {
    const on = () => setBrowserOffline(false)
    const off = () => setBrowserOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const toast = useCallback((text: string, tone: ToastMessage['tone'] = 'success') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, text, tone }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  /** Apply a change; while offline it joins the pending-sync queue. */
  const mutate = useCallback((fn: (d: DataSnapshot) => DataSnapshot) => {
    setData(fn)
    if (offlineRef.current) setPendingChanges((n) => n + 1)
  }, [])

  const patchConsignment = useCallback(
    (id: string, fn: (c: Consignment) => Consignment) =>
      mutate((d) => ({ ...d, consignments: d.consignments.map((c) => (c.id === id ? fn(c) : c)) })),
    [mutate],
  )

  const event = (label: string, by = 'Karma Wangchuk'): TimelineEvent => ({ at: isoDateTime(), label, by })

  const syncNow = useCallback(() => {
    if (offlineRef.current) {
      toast('Device is offline. Changes stay queued.', 'danger')
      return
    }
    setSyncing(true)
    window.setTimeout(() => {
      setSyncing(false)
      setPendingChanges(0)
      setLastSynced(isoDateTime())
      toast('Queue cleared. Demo mode: nothing was sent to a server.', 'info')
    }, 900)
  }, [toast])

  const alerts = useMemo(() => buildAlerts(data, pendingChanges), [data, pendingChanges])
  const unreadAlerts = alerts.filter((a) => !readAlerts.has(a.id)).length

  const store: Store = {
    ...data,
    group: GROUPS.find((g) => g.id === groupId) ?? GROUPS[0],
    groups: GROUPS,
    setGroupId,

    alerts,
    unreadAlerts,
    markAlertsRead: () => setReadAlerts(new Set(alerts.map((a) => a.id))),

    offline,
    simulatedOffline,
    setSimulatedOffline: (v) => {
      setSimulatedOffline(v)
      toast(v ? 'Offline mode simulated. New changes will queue.' : 'Back online.', 'info')
    },
    pendingChanges,
    syncing,
    lastSynced,
    syncNow,

    toasts,
    toast,
    dismissToast,

    addConsignment: (input) => {
      const id = nextId('CSG', data.consignments.map((c) => c.id))
      const consignment: Consignment = {
        id,
        collectionDate: input.collectionDate,
        status: 'Draft',
        productId: input.productId,
        grade: input.grade,
        driverId: input.driverId,
        driverConfirmed: false,
        items: input.items,
        destinations: input.destinations.map((d, i) => ({
          id: `dst-${id}-${i + 1}`,
          ...d,
          confirmation: 'Pending',
          photos: [],
        })),
        transportCost: input.transportCost,
        createdBy: 'Karma Wangchuk',
        timeline: [event('Consignment created')],
      }
      mutate((d) => ({ ...d, consignments: [consignment, ...d.consignments] }))
      return id
    },

    assignDriver: (consignmentId, driverId) =>
      patchConsignment(consignmentId, (c) => ({
        ...c,
        driverId,
        driverConfirmed: false,
        timeline: [...c.timeline, event('Driver assigned, awaiting confirmation')],
      })),

    confirmDriver: (consignmentId) =>
      patchConsignment(consignmentId, (c) => ({
        ...c,
        driverConfirmed: true,
        timeline: [...c.timeline, event('Driver confirmed booking (recorded by coordinator)')],
      })),

    advanceConsignment: (consignmentId, to, label) =>
      patchConsignment(consignmentId, (c) => ({ ...c, status: to, timeline: [...c.timeline, event(label)] })),

    cancelConsignment: (consignmentId, reason) =>
      patchConsignment(consignmentId, (c) => ({
        ...c,
        status: 'Cancelled',
        cancelReason: reason,
        timeline: [...c.timeline, event(`Consignment cancelled: ${reason}`)],
      })),

    confirmDelivery: (consignmentId, destId, input) =>
      mutate((d) => {
        const consignments = d.consignments.map((c) => {
          if (c.id !== consignmentId) return c
          const destinations = c.destinations.map((dest) => {
            if (dest.id !== destId) return dest
            const rejected = Math.max(dest.plannedKg - input.acceptedKg, 0)
            return {
              ...dest,
              acceptedKg: input.acceptedKg,
              rejectedKg: rejected,
              confirmation: rejected > 0 ? ('Disputed' as const) : ('Confirmed' as const),
              note: input.note,
              photos: [...dest.photos, ...input.photos],
              confirmedAt: isoDateTime(),
            }
          })
          const allDone = destinations.every((x) => x.confirmation !== 'Pending')
          const becomesDelivered = allDone && c.status === 'Dispatched'
          return {
            ...c,
            destinations,
            status: becomesDelivered ? ('Delivered' as const) : c.status,
            timeline: [
              ...c.timeline,
              event('Delivery recorded at a destination'),
              ...(becomesDelivered ? [event('All destinations confirmed', 'Buyer')] : []),
            ],
          }
        })
        const delivered = consignments.find((c) => c.id === consignmentId)
        const needsSettlement =
          delivered?.status === 'Delivered' && !d.settlements.some((s) => s.consignmentId === consignmentId)
        return {
          ...d,
          consignments,
          settlements: needsSettlement
            ? [
                ...d.settlements,
                {
                  consignmentId,
                  status: 'Awaiting approval' as const,
                  feePct: DEFAULT_FEE_PCT,
                  versions: [
                    {
                      version: 1,
                      at: isoDateTime(),
                      by: 'System',
                      note: 'Calculated from buyer-confirmed quantities.',
                      transportCost: delivered.transportCost,
                      feePct: DEFAULT_FEE_PCT,
                    },
                  ],
                },
              ]
            : d.settlements,
        }
      }),

    resolveDispute: (consignmentId, destId, note) =>
      patchConsignment(consignmentId, (c) => ({
        ...c,
        destinations: c.destinations.map((x) =>
          x.id === destId ? { ...x, confirmation: 'Confirmed', note: `${x.note ?? ''} Resolved: ${note}`.trim() } : x,
        ),
        timeline: [...c.timeline, event(`Dispute resolved: ${note}`)],
      })),

    adjustSettlement: (consignmentId, input) =>
      mutate((d) => ({
        ...d,
        consignments: d.consignments.map((c) =>
          c.id === consignmentId ? { ...c, transportCost: input.transportCost } : c,
        ),
        settlements: d.settlements.map((s) =>
          s.consignmentId === consignmentId
            ? {
                ...s,
                feePct: input.feePct,
                versions: [
                  ...s.versions,
                  {
                    version: s.versions.length + 1,
                    at: isoDateTime(),
                    by: 'Karma Wangchuk',
                    note: input.note,
                    transportCost: input.transportCost,
                    feePct: input.feePct,
                  },
                ],
              }
            : s,
        ),
      })),

    approveSettlement: (consignmentId) =>
      mutate((d) => {
        const c = d.consignments.find((x) => x.id === consignmentId)
        const meta = d.settlements.find((s) => s.consignmentId === consignmentId)
        if (!c || !meta) return d
        const result = computeSettlement(c, { feePct: meta.feePct })
        const existing = d.payouts.map((p) => p.id)
        const newPayouts = result.rows.map((row, i) => ({
          id: nextId('PAY', existing, 0).replace(/\d+$/, (n) => String(Number(n) + i).padStart(4, '0')),
          memberId: row.memberId,
          consignmentId,
          amount: row.net,
          status: 'Unpaid' as const,
        }))
        return {
          ...d,
          settlements: d.settlements.map((s) =>
            s.consignmentId === consignmentId
              ? { ...s, status: 'Approved' as const, approvedAt: isoDateTime(), approvedBy: 'Karma Wangchuk' }
              : s,
          ),
          consignments: d.consignments.map((x) =>
            x.id === consignmentId
              ? { ...x, status: 'Settled' as const, timeline: [...x.timeline, event('Settlement approved')] }
              : x,
          ),
          payouts: [...d.payouts, ...newPayouts],
        }
      }),

    recordPayout: (payoutId, input) =>
      mutate((d) => closeIfFullyPaid(
        d,
        d.payouts.map((p) => (p.id === payoutId ? { ...p, status: 'Paid' as const, ...input } : p)),
        payoutId,
      )),

    waivePayout: (payoutId, note) =>
      mutate((d) => closeIfFullyPaid(
        d,
        d.payouts.map((p) => (p.id === payoutId ? { ...p, status: 'Waived' as const, note } : p)),
        payoutId,
      )),

    addMember: (m) =>
      mutate((d) => ({
        ...d,
        members: [...d.members, { ...m, id: `m${d.members.length + 1}`, joined: isoDate(0) }],
      })),
    updateMember: (id, patch) =>
      mutate((d) => ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

    saveProduct: (p) =>
      mutate((d) => ({
        ...d,
        products: p.id
          ? d.products.map((x) => (x.id === p.id ? ({ ...x, ...p } as Product) : x))
          : [...d.products, { ...p, id: p.code.toLowerCase() }],
      })),
    addBuyer: (b) => mutate((d) => ({ ...d, buyers: [...d.buyers, { ...b, id: `b${d.buyers.length + 1}` }] })),
    addDriver: (dr) => mutate((d) => ({ ...d, drivers: [...d.drivers, { ...dr, id: `d${d.drivers.length + 1}` }] })),

    openRound: (r) =>
      mutate((d) => {
        const invited = d.members.filter((m) => m.status === 'Active' && m.smsConsent === 'Granted').map((m) => m.id)
        const round: PledgeRound = {
          id: nextId('PR', d.rounds.map((x) => x.id), 14),
          title: r.title,
          status: 'Open',
          opensAt: isoDateTime(),
          closesAt: r.closesAt,
          pickupDate: r.pickupDate,
          productIds: r.productIds,
          invited,
          pledges: [],
        }
        return {
          ...d,
          // Only one round is open at a time.
          rounds: [round, ...d.rounds.map((x) => (x.status === 'Open' ? { ...x, status: 'Closed' as const } : x))],
        }
      }),

    sendRoundSms: (roundId) =>
      mutate((d) => ({
        ...d,
        rounds: d.rounds.map((r) =>
          r.id === roundId ? { ...r, smsSent: { at: isoDateTime(), sent: r.invited.length, failed: 0 } } : r,
        ),
      })),

    closeRound: (roundId) =>
      mutate((d) => ({
        ...d,
        rounds: d.rounds.map((r) => (r.id === roundId ? { ...r, status: 'Closed', closesAt: isoDateTime() } : r)),
      })),

    addManualPledge: (roundId, p) =>
      mutate((d) => ({
        ...d,
        rounds: d.rounds.map((r) =>
          r.id === roundId ? { ...r, pledges: [...r.pledges, { ...p, source: 'Manual', at: isoDateTime() }] } : r,
        ),
      })),

    saveOrder: (o) =>
      mutate((d) => {
        if (o.id) {
          return { ...d, orders: d.orders.map((x) => (x.id === o.id ? { ...x, ...o, id: x.id } : x)) }
        }
        const order: Order = {
          ...o,
          id: nextId('ORD', d.orders.map((x) => x.id)),
          token: uid('ord').slice(0, 10),
          confirmation: 'Draft',
        }
        return { ...d, orders: [order, ...d.orders] }
      }),

    setOrderConfirmation: (id, c) =>
      mutate((d) => ({ ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, confirmation: c } : o)) })),

    assignSms: (smsId, input) =>
      mutate((d) => {
        const open = d.rounds.find((r) => r.status === 'Open')
        return {
          ...d,
          sms: d.sms.map((s) =>
            s.id === smsId
              ? {
                  ...s,
                  memberId: input.memberId,
                  parsed: { productId: input.productId, kg: input.kg },
                  status: 'Assigned',
                  note: 'Assigned manually by Karma Wangchuk.',
                }
              : s,
          ),
          rounds: open
            ? d.rounds.map((r) =>
                r.id === open.id
                  ? { ...r, pledges: [...r.pledges, { ...input, source: 'Manual' as const, at: isoDateTime() }] }
                  : r,
              )
            : d.rounds,
        }
      }),
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

/** After a payout changes, close the consignment once every farmer is paid or waived. */
function closeIfFullyPaid(d: DataSnapshot, payouts: DataSnapshot['payouts'], changedId: string): DataSnapshot {
  const changed = payouts.find((p) => p.id === changedId)
  if (!changed) return { ...d, payouts }
  const siblings = payouts.filter((p) => p.consignmentId === changed.consignmentId)
  const done = siblings.every((p) => p.status !== 'Unpaid')
  return {
    ...d,
    payouts,
    consignments: done
      ? d.consignments.map((c) =>
          c.id === changed.consignmentId && c.status === 'Settled'
            ? {
                ...c,
                status: 'Closed' as const,
                timeline: [...c.timeline, { at: isoDateTime(), label: 'All payouts recorded', by: 'Karma Wangchuk' }],
              }
            : c,
        )
      : d.consignments,
  }
}
