import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  Receipt,
  ShoppingCart,
  Sprout,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/consignments', label: 'Consignments', icon: Boxes },
  { to: '/pledge-rounds', label: 'Pledge Rounds', icon: ClipboardList },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/products', label: 'Products', icon: Sprout },
  { to: '/buyers', label: 'Buyers', icon: Building2 },
  { to: '/drivers', label: 'Drivers', icon: Truck },
  { to: '/deliveries', label: 'Deliveries', icon: PackageCheck },
  { to: '/settlements', label: 'Settlements', icon: Receipt },
  { to: '/payouts', label: 'Payouts', icon: Wallet },
  { to: '/sms-inbox', label: 'SMS Inbox', icon: MessageSquare },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

/** Page titles and parents for the breadcrumb, keyed by first path segment. */
export const sectionTitles: Record<string, string> = {
  '': 'Overview',
  consignments: 'Consignments',
  'pledge-rounds': 'Pledge Rounds',
  orders: 'Orders',
  members: 'Members',
  products: 'Products',
  buyers: 'Buyers',
  drivers: 'Drivers',
  deliveries: 'Deliveries',
  settlements: 'Settlements',
  payouts: 'Payouts',
  'sms-inbox': 'SMS Inbox',
  reports: 'Reports',
  settings: 'Settings',
}
