/**
 * Demo data. Dates are generated relative to today so the dashboard always
 * looks current. Replace `createInitialData()` with REST calls when the
 * Spring Boot API is available (see src/store/DataStore.tsx).
 */
import { computeSettlement, DEFAULT_FEE_PCT } from '../lib/settlement'
import { isoDate, isoDateTime } from '../lib/format'
import type {
  AppUser,
  Buyer,
  Consignment,
  ConsignmentStatus,
  DeliveryConfirmation,
  Destination,
  Driver,
  Group,
  Member,
  Order,
  Payout,
  PayoutMethod,
  Pledge,
  PledgeRound,
  Product,
  SettlementMeta,
  SmsMessage,
  TimelineEvent,
} from './types'

export interface DataSnapshot {
  members: Member[]
  products: Product[]
  buyers: Buyer[]
  drivers: Driver[]
  consignments: Consignment[]
  rounds: PledgeRound[]
  orders: Order[]
  sms: SmsMessage[]
  payouts: Payout[]
  settlements: SettlementMeta[]
}

export const GROUPS: Group[] = [
  { id: 'g1', name: 'Paro Valley Farmers Group', dzongkhag: 'Paro', available: true },
  { id: 'g2', name: 'Haa Highland Cooperative', dzongkhag: 'Haa', available: false },
  { id: 'g3', name: 'Bumthang Potato Growers', dzongkhag: 'Bumthang', available: false },
]

export const CURRENT_USER: AppUser = {
  name: 'Karma Wangchuk',
  role: 'Group Coordinator',
  email: 'karma.wangchuk@example.bt',
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const products: Product[] = [
  { id: 'cab', name: 'Cabbage', code: 'CAB', unit: 'Sack', kgPerUnit: 25, grades: ['A', 'B', 'C'], active: true },
  { id: 'car', name: 'Carrot', code: 'CAR', unit: 'Sack', kgPerUnit: 25, grades: ['A', 'B'], active: true },
  { id: 'pot', name: 'Potato', code: 'POT', unit: 'Sack', kgPerUnit: 50, grades: ['A', 'B', 'C'], active: true },
  { id: 'tom', name: 'Tomato', code: 'TOM', unit: 'Crate', kgPerUnit: 20, grades: ['A', 'B'], active: true },
  { id: 'chi', name: 'Chilli', code: 'CHI', unit: 'Kg', kgPerUnit: 1, grades: ['A', 'B'], active: true },
  { id: 'cau', name: 'Cauliflower', code: 'CAU', unit: 'Crate', kgPerUnit: 15, grades: ['A', 'B'], active: true },
  { id: 'pea', name: 'Green peas', code: 'PEA', unit: 'Bag', kgPerUnit: 10, grades: ['A'], active: false },
]

const memberSeed: [string, string][] = [
  ['Karma Dorji', 'Dopshari'],
  ['Pema Choden', 'Shaba'],
  ['Tshering Wangmo', 'Lamgong'],
  ['Sonam Tenzin', 'Wangchang'],
  ['Dawa Penjor', 'Bondey'],
  ['Yeshey Lhamo', 'Drukgyel'],
  ['Ugyen Dorji', 'Tsento'],
  ['Kinley Zangmo', 'Doteng'],
  ['Tandin Wangchuk', 'Dopshari'],
  ['Dechen Pelden', 'Shaba'],
  ['Namgay Om', 'Lamgong'],
  ['Jigme Norbu', 'Wangchang'],
  ['Chimi Dema', 'Bondey'],
  ['Rinchen Tobgay', 'Drukgyel'],
  ['Passang Lham', 'Tsento'],
  ['Sangay Choden', 'Doteng'],
  ['Lhaki Wangmo', 'Dopshari'],
  ['Thinley Gyeltshen', 'Shaba'],
  ['Kezang Dolma', 'Lamgong'],
  ['Phub Tshering', 'Wangchang'],
  ['Ngawang Zam', 'Bondey'],
  ['Rigzin Dorji', 'Drukgyel'],
  ['Sither Pema', 'Tsento'],
  ['Choki Wangdi', 'Doteng'],
]

const buyers: Buyer[] = [
  { id: 'b1', name: 'Thimphu Vegetable Traders Assoc.', type: 'Market', location: 'Thimphu', contact: 'Jambay Dorji', phone: '+975 17811204' },
  { id: 'b2', name: 'Druk Hospitality Procurement', type: 'Hotel', location: 'Thimphu', contact: 'Rinzin Lhamo', phone: '+975 17655432' },
  { id: 'b3', name: 'Paro Town Fresh Mart', type: 'Retailer', location: 'Paro', contact: 'Tashi Dendup', phone: '+975 77304518' },
  { id: 'b4', name: 'Phuentsholing Wholesale Vendors', type: 'Wholesaler', location: 'Phuentsholing', contact: 'Pema Yangzom', phone: '+975 17902267' },
  { id: 'b5', name: 'Rural School Feeding Programme', type: 'Institution', location: 'Wangdue Phodrang', contact: 'Tenzin Norbu', phone: '+975 17445590' },
]

const drivers: Driver[] = [
  { id: 'd1', name: 'Dorji Wangdi', phone: '+975 17233410', vehicle: 'BP-1-A2345', capacityKg: 3000, status: 'Available' },
  { id: 'd2', name: 'Ugyen Tshering', phone: '+975 17788120', vehicle: 'BP-2-B7712', capacityKg: 2500, status: 'On trip' },
  { id: 'd3', name: 'Nima Dorji', phone: '+975 77120945', vehicle: 'BP-1-A9081', capacityKg: 1500, status: 'Available' },
  { id: 'd4', name: 'Tashi Penjor', phone: '+975 17509872', vehicle: 'BP-3-C1156', capacityKg: 4000, status: 'Available' },
  { id: 'd5', name: 'Sangay Lhendup', phone: '+975 17361778', vehicle: 'BP-2-B3390', capacityKg: 2000, status: 'On trip' },
]

const BASE_PRICE: Record<string, number> = { cab: 38, car: 55, pot: 32, tom: 70, chi: 180, cau: 60, pea: 90 }
const BUYER_ADJUST: Record<string, number> = { b1: 0, b2: 3, b3: -2, b4: 5, b5: -1 }
const KG_RANGE: Record<string, [number, number]> = {
  cab: [120, 400],
  car: [60, 200],
  pot: [150, 480],
  tom: [40, 140],
  chi: [15, 60],
}

type DestSpec = [buyerId: string, share: number, acceptRatio: number]

interface Spec {
  n: number
  day: number
  status: ConsignmentStatus
  product: string
  grade: string
  driver?: string
  dests: DestSpec[]
  farmers: number
  transport: number
  driverConfirmed?: boolean
  disputedBuyer?: string
}

const specs: Spec[] = [
  { n: 1, day: -168, status: 'Closed', product: 'cab', grade: 'A', driver: 'd1', dests: [['b1', 0.6, 0.97], ['b2', 0.4, 0.95]], farmers: 9, transport: 5200 },
  { n: 2, day: -154, status: 'Closed', product: 'pot', grade: 'A', driver: 'd2', dests: [['b1', 1, 0.98]], farmers: 11, transport: 6100 },
  { n: 3, day: -140, status: 'Closed', product: 'car', grade: 'A', driver: 'd3', dests: [['b2', 0.55, 0.96], ['b3', 0.45, 0.94]], farmers: 8, transport: 5600 },
  { n: 4, day: -126, status: 'Closed', product: 'tom', grade: 'A', driver: 'd1', dests: [['b3', 1, 0.92]], farmers: 6, transport: 4300 },
  { n: 5, day: -112, status: 'Closed', product: 'cab', grade: 'B', driver: 'd2', dests: [['b1', 0.5, 0.96], ['b4', 0.5, 0.9]], farmers: 12, transport: 9800 },
  { n: 6, day: -98, status: 'Closed', product: 'chi', grade: 'A', driver: 'd4', dests: [['b2', 1, 0.97]], farmers: 7, transport: 3900 },
  { n: 7, day: -84, status: 'Closed', product: 'pot', grade: 'A', driver: 'd3', dests: [['b1', 0.7, 0.98], ['b5', 0.3, 0.95]], farmers: 13, transport: 6400 },
  { n: 8, day: -70, status: 'Closed', product: 'cab', grade: 'A', driver: 'd1', dests: [['b1', 1, 0.97]], farmers: 10, transport: 5300 },
  { n: 9, day: -56, status: 'Settled', product: 'car', grade: 'B', driver: 'd2', dests: [['b2', 0.6, 0.95], ['b3', 0.4, 0.93]], farmers: 9, transport: 5000 },
  { n: 10, day: -45, status: 'Settled', product: 'pot', grade: 'A', driver: 'd5', dests: [['b1', 1, 0.96]], farmers: 12, transport: 6200 },
  { n: 11, day: -33, status: 'Cancelled', product: 'cab', grade: 'A', driver: 'd3', dests: [['b1', 1, 0]], farmers: 7, transport: 0 },
  { n: 12, day: -27, status: 'Settled', product: 'tom', grade: 'A', driver: 'd1', dests: [['b3', 0.5, 0.94], ['b2', 0.5, 0.96]], farmers: 8, transport: 4800 },
  { n: 13, day: -19, status: 'Delivered', product: 'cab', grade: 'A', driver: 'd2', dests: [['b1', 0.65, 0.97], ['b4', 0.35, 0.91]], farmers: 11, transport: 8800 },
  { n: 14, day: -12, status: 'Delivered', product: 'chi', grade: 'A', driver: 'd4', dests: [['b2', 1, 0.9]], farmers: 6, transport: 4100, disputedBuyer: 'b2' },
  { n: 15, day: -6, status: 'Delivered', product: 'pot', grade: 'B', driver: 'd3', dests: [['b1', 0.5, 0.95], ['b5', 0.5, 0.88]], farmers: 10, transport: 6000, disputedBuyer: 'b5' },
  { n: 16, day: -1, status: 'Dispatched', product: 'cab', grade: 'A', driver: 'd2', dests: [['b1', 0.7, 0], ['b2', 0.3, 0]], farmers: 9, transport: 5400, driverConfirmed: true },
  { n: 17, day: 0, status: 'Dispatched', product: 'car', grade: 'A', driver: 'd5', dests: [['b2', 1, 0]], farmers: 7, transport: 4600, driverConfirmed: true },
  { n: 18, day: 2, status: 'Planned', product: 'pot', grade: 'A', driver: 'd1', dests: [['b1', 1, 0]], farmers: 8, transport: 5800, driverConfirmed: false },
  { n: 19, day: 5, status: 'Planned', product: 'cab', grade: 'B', driver: 'd4', dests: [['b1', 0.5, 0], ['b4', 0.5, 0]], farmers: 10, transport: 9600, driverConfirmed: true },
  { n: 20, day: 9, status: 'Draft', product: 'tom', grade: 'A', dests: [['b3', 1, 0]], farmers: 5, transport: 0 },
]

const STAFF = 'Karma Wangchuk'

function buildTimeline(status: ConsignmentStatus, day: number, confirmed: boolean): TimelineEvent[] {
  const at = (off: number, hourBack = 0) => isoDateTime((off) * 24 - hourBack)
  const created = Math.min(day - 6, -1)
  const events: TimelineEvent[] = [{ at: at(created), label: 'Consignment created', by: STAFF }]
  if (status === 'Cancelled') {
    events.push({ at: at(day - 3), label: 'Consignment cancelled', by: STAFF })
    return events
  }
  const idx = ['Draft', 'Planned', 'Dispatched', 'Delivered', 'Settled', 'Closed'].indexOf(status)
  if (idx >= 1) {
    events.push({ at: at(Math.min(day - 4, -1)), label: 'Planned and driver booked', by: STAFF })
    if (confirmed) events.push({ at: at(Math.min(day - 3, -1)), label: 'Driver confirmed booking', by: 'Driver (SMS)' })
  }
  if (idx >= 2) events.push({ at: at(day, 2), label: 'Dispatched from collection point', by: STAFF })
  if (idx >= 3) events.push({ at: at(day + 1), label: 'Delivery confirmed by buyers', by: 'Buyer' })
  if (idx >= 4) events.push({ at: at(day + 5), label: 'Settlement approved', by: STAFF })
  if (idx >= 5) events.push({ at: at(day + 10), label: 'All payouts recorded', by: STAFF })
  return events
}

function buildConsignments(members: Member[]): Consignment[] {
  const rand = mulberry32(42)
  const activeMembers = members.filter((m) => m.status === 'Active')

  return specs.map((s) => {
    const [lo, hi] = KG_RANGE[s.product] ?? [50, 150]
    const items = Array.from({ length: s.farmers }, (_, k) => {
      const member = activeMembers[(s.n * 3 + k) % activeMembers.length]
      const kg = Math.round((lo + rand() * (hi - lo)) / 5) * 5
      return { memberId: member.id, kg }
    })
    const total = items.reduce((sum, i) => sum + i.kg, 0)
    const delivered = ['Delivered', 'Settled', 'Closed'].includes(s.status)

    let kgLeft = total
    const destinations: Destination[] = s.dests.map(([buyerId, share, ratio], i) => {
      const last = i === s.dests.length - 1
      const plannedKg = last ? kgLeft : Math.round((total * share) / 5) * 5
      kgLeft -= plannedKg
      const acceptedKg = delivered ? Math.round(plannedKg * ratio) : undefined
      const disputed = s.disputedBuyer === buyerId
      const confirmation: DeliveryConfirmation = delivered ? (disputed ? 'Disputed' : 'Confirmed') : 'Pending'
      return {
        id: `dst-${s.n}-${i + 1}`,
        buyerId,
        plannedKg,
        pricePerKg: BASE_PRICE[s.product] + BUYER_ADJUST[buyerId],
        acceptedKg,
        rejectedKg: acceptedKg === undefined ? undefined : plannedKg - acceptedKg,
        confirmation,
        note: disputed ? 'Buyer reports part of the load was wilted on arrival.' : undefined,
        photos: delivered ? Array.from({ length: 1 + (i % 2) }, (_, p) => `photo-${s.n}-${i}-${p}`) : [],
        confirmedAt: delivered ? isoDateTime((s.day + 1) * 24) : undefined,
      }
    })

    return {
      id: `CSG-${String(100 + s.n)}`,
      collectionDate: isoDate(s.day),
      status: s.status,
      productId: s.product,
      grade: s.grade,
      driverId: s.driver,
      driverConfirmed: s.driverConfirmed ?? (s.status !== 'Draft' && s.status !== 'Planned'),
      items,
      destinations,
      transportCost: s.transport,
      createdBy: STAFF,
      timeline: buildTimeline(s.status, s.day, s.driverConfirmed ?? (s.status !== 'Draft' && s.status !== 'Planned')),
      cancelReason: s.status === 'Cancelled' ? 'Road closure near Chuzom — load could not be moved.' : undefined,
    }
  })
}

function buildSettlementsAndPayouts(consignments: Consignment[], members: Member[]) {
  const settlements: SettlementMeta[] = []
  const payouts: Payout[] = []
  const methods: PayoutMethod[] = ['mBoB', 'mPay', 'Cash', 'mBoB']
  let payoutNo = 1

  consignments.forEach((c, ci) => {
    const day = specs[ci].day
    if (c.status === 'Delivered') {
      settlements.push({
        consignmentId: c.id,
        status: 'Awaiting approval',
        feePct: DEFAULT_FEE_PCT,
        versions: [
          {
            version: 1,
            at: isoDateTime((day + 1) * 24),
            by: 'System',
            note: 'Calculated from buyer-confirmed quantities.',
            transportCost: c.transportCost,
            feePct: DEFAULT_FEE_PCT,
          },
        ],
      })
      return
    }
    if (c.status !== 'Settled' && c.status !== 'Closed') return

    const hasV2 = ci % 2 === 0
    const versions = [
      {
        version: 1,
        at: isoDateTime((day + 1) * 24),
        by: 'System',
        note: 'Calculated from buyer-confirmed quantities.',
        transportCost: hasV2 ? c.transportCost + 400 : c.transportCost,
        feePct: DEFAULT_FEE_PCT,
      },
    ]
    if (hasV2) {
      versions.push({
        version: 2,
        at: isoDateTime((day + 3) * 24),
        by: STAFF,
        note: 'Transport cost corrected to match the fuel receipt.',
        transportCost: c.transportCost,
        feePct: DEFAULT_FEE_PCT,
      })
    }
    settlements.push({
      consignmentId: c.id,
      status: 'Approved',
      feePct: DEFAULT_FEE_PCT,
      versions,
      approvedAt: isoDateTime((day + 5) * 24),
      approvedBy: STAFF,
    })

    const result = computeSettlement(c)
    result.rows.forEach((row, ri) => {
      const base = { id: `PAY-${String(payoutNo++).padStart(4, '0')}`, memberId: row.memberId, consignmentId: c.id, amount: row.net }
      const paid = c.status === 'Closed' || (c.id === 'CSG-109' && ri < result.rows.length - 2) || (c.id === 'CSG-110' && ri < 5)
      const waived = c.id === 'CSG-112' && ri === 0
      if (waived) {
        payouts.push({ ...base, status: 'Waived', note: 'Farmer waived payout; amount returned to group fund.' })
      } else if (paid) {
        const method = methods[(ri + ci) % methods.length]
        payouts.push({
          ...base,
          status: 'Paid',
          method,
          reference: method === 'Cash' ? `CASH-${1000 + payoutNo}` : `TXN${String(48210000 + payoutNo * 37)}`,
          paidOn: isoDate(day + 8 + (ri % 3)),
        })
      } else {
        payouts.push({ ...base, status: 'Unpaid' })
      }
    })
  })

  // Keep the member list referenced so unknown ids surface during development.
  void members
  return { settlements, payouts }
}

function buildRounds(members: Member[]): PledgeRound[] {
  const rand = mulberry32(11)
  const invited = members.filter((m) => m.status === 'Active' && m.smsConsent === 'Granted').map((m) => m.id)

  const makePledges = (ids: string[], productIds: string[], responseRate: number, startHours: number): Pledge[] => {
    const out: Pledge[] = []
    ids.forEach((memberId, i) => {
      if (rand() > responseRate) return
      const productId = productIds[i % productIds.length]
      const [lo, hi] = KG_RANGE[productId] ?? [50, 150]
      out.push({
        memberId,
        productId,
        kg: Math.round((lo + rand() * (hi - lo)) / 5) * 5,
        source: 'SMS',
        at: isoDateTime(startHours + rand() * 16),
      })
      if (rand() > 0.75) {
        const second = productIds[(i + 1) % productIds.length]
        const [l2, h2] = KG_RANGE[second] ?? [50, 150]
        out.push({
          memberId,
          productId: second,
          kg: Math.round((l2 + rand() * (h2 - l2)) / 5) * 5,
          source: 'SMS',
          at: isoDateTime(startHours + rand() * 16),
        })
      }
    })
    return out
  }

  const openPledges = makePledges(invited, ['cab', 'car', 'pot'], 0.62, -18)
  const lastNotResponded = invited.find((id) => !openPledges.some((p) => p.memberId === id))
  if (lastNotResponded) {
    openPledges.push({ memberId: lastNotResponded, productId: 'pot', kg: 90, source: 'Manual', at: isoDateTime(-2) })
  }

  const rounds: PledgeRound[] = [
    {
      id: 'PR-014',
      title: 'Weekly pledge — cabbage, carrot, potato',
      status: 'Open',
      opensAt: isoDateTime(-18),
      closesAt: isoDateTime(5.3),
      pickupDate: isoDate(6),
      productIds: ['cab', 'car', 'pot'],
      invited,
      pledges: openPledges,
      smsSent: { at: isoDateTime(-18), sent: invited.length - 2, failed: 2 },
    },
  ]
  ;[
    { id: 'PR-013', off: -7, products: ['cab', 'pot'], rate: 0.85, title: 'Weekly pledge — cabbage, potato' },
    { id: 'PR-012', off: -14, products: ['car', 'tom', 'chi'], rate: 0.8, title: 'Weekly pledge — carrot, tomato, chilli' },
    { id: 'PR-011', off: -21, products: ['cab', 'car'], rate: 0.9, title: 'Weekly pledge — cabbage, carrot' },
  ].forEach((r) => {
    rounds.push({
      id: r.id,
      title: r.title,
      status: 'Closed',
      opensAt: isoDateTime(r.off * 24 - 40),
      closesAt: isoDateTime(r.off * 24 - 4),
      pickupDate: isoDate(r.off + 2),
      productIds: r.products,
      invited,
      pledges: makePledges(invited, r.products, r.rate, r.off * 24 - 38),
      smsSent: { at: isoDateTime(r.off * 24 - 40), sent: invited.length, failed: 0 },
    })
  })
  return rounds
}

const orders: Order[] = [
  { id: 'ORD-101', buyerId: 'b1', productId: 'cab', grade: 'A', kg: 800, pricePerKg: 38, deliveryDate: isoDate(6), confirmation: 'Confirmed', token: 'ord-7f3a9c' },
  { id: 'ORD-102', buyerId: 'b2', productId: 'car', grade: 'A', kg: 350, pricePerKg: 58, deliveryDate: isoDate(6), confirmation: 'Awaiting buyer', token: 'ord-2b81de' },
  { id: 'ORD-103', buyerId: 'b1', productId: 'pot', grade: 'A', kg: 600, pricePerKg: 32, deliveryDate: isoDate(6), confirmation: 'Confirmed', token: 'ord-90c4aa' },
  { id: 'ORD-104', buyerId: 'b3', productId: 'tom', grade: 'A', kg: 250, pricePerKg: 68, deliveryDate: isoDate(9), confirmation: 'Awaiting buyer', token: 'ord-5de217' },
  { id: 'ORD-105', buyerId: 'b4', productId: 'cab', grade: 'B', kg: 1000, pricePerKg: 43, deliveryDate: isoDate(12), confirmation: 'Draft', token: 'ord-a13f68' },
  { id: 'ORD-106', buyerId: 'b5', productId: 'pot', grade: 'B', kg: 400, pricePerKg: 31, deliveryDate: isoDate(6), confirmation: 'Declined', token: 'ord-c0e9b2', note: 'Buyer reduced weekly budget.' },
  { id: 'ORD-107', buyerId: 'b2', productId: 'chi', grade: 'A', kg: 120, pricePerKg: 183, deliveryDate: isoDate(9), confirmation: 'Confirmed', token: 'ord-48b6f1' },
  { id: 'ORD-108', buyerId: 'b3', productId: 'car', grade: 'B', kg: 300, pricePerKg: 50, deliveryDate: isoDate(13), confirmation: 'Awaiting buyer', token: 'ord-e72a05' },
]

function buildSms(members: Member[]): SmsMessage[] {
  const phone = (id: string) => members.find((m) => m.id === id)!.phone
  return [
    { id: 'SMS-1', from: phone('m3'), memberId: 'm3', receivedAt: isoDateTime(-2.5), body: 'CAB 150', parsed: { productId: 'cab', kg: 150 }, status: 'Parsed' },
    { id: 'SMS-2', from: phone('m7'), memberId: 'm7', receivedAt: isoDateTime(-3.1), body: 'POT 2 sack', parsed: { productId: 'pot', kg: 100 }, status: 'Parsed' },
    { id: 'SMS-3', from: '+975 17998812', receivedAt: isoDateTime(-4), body: 'Hello when is next pickup?', status: 'Unreadable', note: 'Number is not registered to any member.' },
    { id: 'SMS-4', from: phone('m11'), memberId: 'm11', receivedAt: isoDateTime(-5.2), body: 'kabbage 80 kilo', status: 'Unreadable', note: 'Product code not recognised.' },
    { id: 'SMS-5', from: phone('m5'), memberId: 'm5', receivedAt: isoDateTime(-7), body: 'CAR 60', parsed: { productId: 'car', kg: 60 }, status: 'Parsed' },
    { id: 'SMS-6', from: phone('m14'), memberId: 'm14', receivedAt: isoDateTime(-9), body: 'CAB 2o0', status: 'Unreadable', note: 'Quantity could not be read.' },
    { id: 'SMS-7', from: phone('m2'), memberId: 'm2', receivedAt: isoDateTime(-12), body: 'POT120', parsed: { productId: 'pot', kg: 120 }, status: 'Assigned', note: 'Assigned manually by Karma Wangchuk.' },
    { id: 'SMS-8', from: phone('m9'), memberId: 'm9', receivedAt: isoDateTime(-52), body: 'TOM 40', parsed: { productId: 'tom', kg: 40 }, status: 'Parsed' },
    { id: 'SMS-9', from: phone('m16'), memberId: 'm16', receivedAt: isoDateTime(-60), body: 'CHI 25', parsed: { productId: 'chi', kg: 25 }, status: 'Parsed' },
    { id: 'SMS-10', from: phone('m20'), memberId: 'm20', receivedAt: isoDateTime(-75), body: 'STOP', status: 'Unreadable', note: 'Looks like an opt-out request. Review consent status.' },
  ]
}

export function createInitialData(): DataSnapshot {
  const rand = mulberry32(5)
  const members: Member[] = memberSeed.map(([name, village], i) => ({
    id: `m${i + 1}`,
    name,
    village,
    phone: `+975 ${rand() > 0.35 ? '17' : '77'}${String(100000 + Math.floor(rand() * 899999))}`,
    status: i === 5 || i === 21 ? 'Inactive' : 'Active',
    smsConsent: i === 10 || i === 19 ? 'Pending' : i === 13 ? 'Declined' : 'Granted',
    joined: isoDate(-(120 + i * 23)),
  }))

  const consignments = buildConsignments(members)
  const { settlements, payouts } = buildSettlementsAndPayouts(consignments, members)

  return {
    members,
    products: products.map((p) => ({ ...p })),
    buyers: buyers.map((b) => ({ ...b })),
    drivers: drivers.map((d) => ({ ...d })),
    consignments,
    rounds: buildRounds(members),
    orders: orders.map((o) => ({ ...o })),
    sms: buildSms(members),
    payouts,
    settlements,
  }
}
