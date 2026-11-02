export type ConsignmentStatus =
  | 'Draft'
  | 'Planned'
  | 'Dispatched'
  | 'Delivered'
  | 'Settled'
  | 'Closed'
  | 'Cancelled'

export const CONSIGNMENT_STATUSES: ConsignmentStatus[] = [
  'Draft',
  'Planned',
  'Dispatched',
  'Delivered',
  'Settled',
  'Closed',
  'Cancelled',
]

/** The happy path of a consignment, in order. */
export const LIFECYCLE: ConsignmentStatus[] = [
  'Draft',
  'Planned',
  'Dispatched',
  'Delivered',
  'Settled',
  'Closed',
]

export interface Group {
  id: string
  name: string
  dzongkhag: string
  available: boolean
}

export interface Product {
  id: string
  name: string
  /** Three-letter code farmers use in SMS pledges. */
  code: string
  unit: string
  kgPerUnit: number
  grades: string[]
  active: boolean
}

export type ConsentStatus = 'Granted' | 'Pending' | 'Declined'

export interface Member {
  id: string
  name: string
  phone: string
  village: string
  status: 'Active' | 'Inactive'
  smsConsent: ConsentStatus
  joined: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicle: string
  capacityKg: number
  status: 'Available' | 'On trip' | 'Off duty'
}

export interface Buyer {
  id: string
  name: string
  type: 'Market' | 'Hotel' | 'Wholesaler' | 'Retailer' | 'Institution'
  location: string
  contact: string
  phone: string
}

export type DeliveryConfirmation = 'Pending' | 'Confirmed' | 'Disputed'

export interface Destination {
  id: string
  buyerId: string
  plannedKg: number
  pricePerKg: number
  acceptedKg?: number
  rejectedKg?: number
  confirmation: DeliveryConfirmation
  note?: string
  /** Photo URLs (object URLs for photos added in this session). */
  photos: string[]
  confirmedAt?: string
}

export interface ConsignmentItem {
  memberId: string
  kg: number
}

export interface TimelineEvent {
  at: string
  label: string
  by: string
}

export interface Consignment {
  id: string
  collectionDate: string
  status: ConsignmentStatus
  productId: string
  grade: string
  driverId?: string
  driverConfirmed: boolean
  items: ConsignmentItem[]
  destinations: Destination[]
  transportCost: number
  createdBy: string
  timeline: TimelineEvent[]
  cancelReason?: string
}

export interface Pledge {
  memberId: string
  productId: string
  kg: number
  source: 'SMS' | 'Manual'
  at: string
}

export interface PledgeRound {
  id: string
  title: string
  status: 'Open' | 'Closed'
  opensAt: string
  closesAt: string
  pickupDate: string
  productIds: string[]
  invited: string[]
  pledges: Pledge[]
  smsSent?: { at: string; sent: number; failed: number }
}

export type OrderConfirmation = 'Draft' | 'Awaiting buyer' | 'Confirmed' | 'Declined'

export interface Order {
  id: string
  buyerId: string
  productId: string
  grade: string
  kg: number
  pricePerKg: number
  deliveryDate: string
  confirmation: OrderConfirmation
  token: string
  note?: string
}

export type SmsStatus = 'Parsed' | 'Unreadable' | 'Assigned'

export interface SmsMessage {
  id: string
  from: string
  memberId?: string
  receivedAt: string
  body: string
  parsed?: { productId: string; kg: number }
  status: SmsStatus
  note?: string
}

export type PayoutMethod = 'mBoB' | 'mPay' | 'Cash'
export type PayoutStatus = 'Unpaid' | 'Paid' | 'Waived'

export interface Payout {
  id: string
  memberId: string
  consignmentId: string
  amount: number
  status: PayoutStatus
  method?: PayoutMethod
  reference?: string
  paidOn?: string
  note?: string
}

export interface SettlementVersion {
  version: number
  at: string
  by: string
  note: string
  transportCost: number
  feePct: number
}

export interface SettlementMeta {
  consignmentId: string
  status: 'Awaiting approval' | 'Approved'
  feePct: number
  versions: SettlementVersion[]
  approvedAt?: string
  approvedBy?: string
}

export interface SettlementRow {
  memberId: string
  dispatchedKg: number
  acceptedKg: number
  pricePerKg: number
  gross: number
  transport: number
  fee: number
  net: number
}

export interface SettlementResult {
  rows: SettlementRow[]
  totalDispatched: number
  totalAccepted: number
  revenue: number
  pooledPrice: number
  transport: number
  fee: number
  net: number
}

export interface AppAlert {
  id: string
  severity: 'danger' | 'warning' | 'info'
  title: string
  detail: string
  href: string
}

export interface AppUser {
  name: string
  role: string
  email: string
}
