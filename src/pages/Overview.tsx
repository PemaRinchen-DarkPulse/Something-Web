import {
  AlertTriangle,
  Banknote,
  Boxes,
  CalendarDays,
  ClipboardList,
  Eye,
  HandCoins,
  PackageCheck,
  Receipt,
  Scale,
  ShieldAlert,
  Truck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ColumnSeries, ChartLegend, Donut, HorizontalBars, LineSeries, palette } from '../components/charts/Charts'
import { statusColor, StatusBadge } from '../components/ui/Badge'
import { Panel, KpiCard, PageHeader } from '../components/ui/Blocks'
import { LinkButton } from '../components/ui/Button'
import { Countdown } from '../components/ui/Countdown'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Select } from '../components/ui/Fields'
import { CONSIGNMENT_STATUSES } from '../data/types'
import type { Consignment } from '../data/types'
import { fmtDate, fmtKg, fmtNum, fmtNuCompact, isoDate, monthKey, monthLabel, relativeDay } from '../lib/format'
import { COLLECTED, DELIVERED, revenueOf, totalKg, useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

const severityDot = { danger: 'bg-danger', warning: 'bg-[#D99A32]', info: 'bg-info' }

interface Upcoming {
  key: string
  icon: LucideIcon
  title: string
  detail: string
  when: ReactNode
  href: string
}

export default function Overview() {
  const store = useStore()
  const L = useLookups()
  const navigate = useNavigate()
  const { consignments, members, payouts, alerts, rounds, settlements } = store
  const [metric, setMetric] = useState<'count' | 'kg'>('count')
  const [statusFilter, setStatusFilter] = useState('All')

  const collected = consignments.filter((c) => COLLECTED.includes(c.status))
  const kgCollected = collected.reduce((s, c) => s + totalKg(c), 0)
  const revenue = consignments.filter((c) => DELIVERED.includes(c.status)).reduce((s, c) => s + revenueOf(c), 0)
  const unpaid = payouts.filter((p) => p.status === 'Unpaid')
  const unpaidTotal = unpaid.reduce((s, p) => s + p.amount, 0)
  const disputes = consignments.flatMap((c) => c.destinations.map((d) => ({ c, d }))).filter((x) => x.d.confirmation === 'Disputed')
  const inFlight = consignments.filter((c) => ['Planned', 'Dispatched', 'Delivered'].includes(c.status))
  const activeMembers = members.filter((m) => m.status === 'Active').length

  // Activity: last six calendar months.
  const activity = useMemo(() => {
    const keys = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (5 - i))
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    return keys.map((k) => {
      const inMonth = consignments.filter((c) => monthKey(c.collectionDate) === k && c.status !== 'Cancelled' && c.status !== 'Draft')
      return { month: monthLabel(k), count: inMonth.length, kg: inMonth.reduce((s, c) => s + totalKg(c), 0) }
    })
  }, [consignments])

  const byProduct = useMemo(() => {
    const m = new Map<string, number>()
    collected.forEach((c) => m.set(c.productId, (m.get(c.productId) ?? 0) + totalKg(c)))
    return [...m.entries()]
      .map(([id, value]) => ({ name: L.product(id), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [collected, L])

  const statusData = CONSIGNMENT_STATUSES.map((s) => ({
    name: s,
    value: consignments.filter((c) => c.status === s).length,
    color: statusColor[s],
  }))

  const upcoming = useMemo<Upcoming[]>(() => {
    const today = isoDate(0)
    const out: Upcoming[] = []
    consignments
      .filter((c) => (c.status === 'Planned' || c.status === 'Draft') && c.collectionDate >= today)
      .sort((a, b) => a.collectionDate.localeCompare(b.collectionDate))
      .forEach((c) =>
        out.push({ key: `col-${c.id}`, icon: CalendarDays, title: `Collection · ${c.id}`, detail: `${L.product(c.productId)}, ${c.items.length} farmers`, when: relativeDay(c.collectionDate), href: `/consignments/${c.id}` }),
      )
    rounds
      .filter((r) => r.status === 'Open')
      .forEach((r) => out.push({ key: `pr-${r.id}`, icon: ClipboardList, title: `Pledge round ${r.id} closes`, detail: `${r.pledges.length} pledges so far`, when: <Countdown to={r.closesAt} />, href: '/pledge-rounds' }))
    consignments
      .filter((c) => c.status === 'Planned' && !c.driverConfirmed)
      .forEach((c) => out.push({ key: `drv-${c.id}`, icon: Truck, title: `Driver confirmation · ${c.id}`, detail: `${L.driver(c.driverId)} has not confirmed`, when: relativeDay(c.collectionDate), href: `/consignments/${c.id}` }))
    consignments
      .filter((c) => c.status === 'Dispatched')
      .forEach((c) => out.push({ key: `del-${c.id}`, icon: PackageCheck, title: `Delivery to confirm · ${c.id}`, detail: `${c.destinations.filter((d) => d.confirmation === 'Pending').length} destinations pending`, when: 'In transit', href: '/deliveries' }))
    settlements
      .filter((s) => s.status === 'Awaiting approval')
      .forEach((s) => out.push({ key: `set-${s.consignmentId}`, icon: Receipt, title: `Settlement to approve · ${s.consignmentId}`, detail: `Version ${s.versions.length}`, when: 'Needs approval', href: `/settlements/${s.consignmentId}` }))
    const unpaidBy = new Map<string, number>()
    unpaid.forEach((p) => unpaidBy.set(p.consignmentId, (unpaidBy.get(p.consignmentId) ?? 0) + 1))
    unpaidBy.forEach((n, id) => out.push({ key: `pay-${id}`, icon: HandCoins, title: `${n} farmers awaiting payment`, detail: id, when: 'Unpaid', href: '/payouts' }))
    return out
  }, [consignments, rounds, settlements, unpaid, L])

  const rows = consignments
    .filter((c) => statusFilter === 'All' || c.status === statusFilter)
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))

  const columns: Column<Consignment>[] = [
    { key: 'id', header: 'Consignment', sortValue: (c) => c.id, render: (c) => <Link to={`/consignments/${c.id}`} className="font-medium text-primary hover:underline">{c.id}</Link> },
    { key: 'date', header: 'Collection date', sortValue: (c) => c.collectionDate, render: (c) => fmtDate(c.collectionDate) },
    { key: 'farmers', header: 'Farmers', align: 'right', hideBelow: 'md', render: (c) => c.items.length },
    { key: 'kg', header: 'Weight', align: 'right', sortValue: (c) => totalKg(c), render: (c) => fmtKg(totalKg(c)) },
    { key: 'driver', header: 'Driver', hideBelow: 'lg', render: (c) => L.driver(c.driverId) },
    {
      key: 'dest',
      header: 'Destination',
      hideBelow: 'lg',
      render: (c) => (
        <span>
          {L.buyer(c.destinations[0]?.buyerId)}
          {c.destinations.length > 1 && <span className="ml-1 text-muted">+{c.destinations.length - 1}</span>}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'action', header: '', align: 'right', hideBelow: 'sm', render: (c) => <LinkButton to={`/consignments/${c.id}`} size="sm" variant="ghost" icon={<Eye size={15} />}>View</LinkButton> },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        description={`How ${store.group.name} is doing today: produce, deliveries and money owed to farmers.`}
        actions={<LinkButton to="/consignments?new=1" variant="primary">New consignment</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total members" value={fmtNum(members.length)} hint={`${activeMembers} active`} icon={Users} />
        <KpiCard label="Active consignments" value={fmtNum(inFlight.length)} hint={`${consignments.filter((c) => c.status === 'Dispatched').length} on the road`} icon={Boxes} tone="info" />
        <KpiCard label="Produce collected" value={fmtKg(kgCollected)} hint={`${new Set(collected.map((c) => c.productId)).size} products`} icon={Scale} />
        <KpiCard label="Total revenue" value={fmtNuCompact(revenue)} hint="From delivered consignments" icon={Banknote} />
        <KpiCard label="Pending payouts" value={fmtNuCompact(unpaidTotal)} hint={`${unpaid.length} farmers unpaid`} icon={HandCoins} tone="warning" />
        <KpiCard label="Open disputes" value={fmtNum(disputes.length)} hint={disputes.length ? disputes.map((x) => x.c.id).join(', ') : 'None right now'} icon={ShieldAlert} tone={disputes.length ? 'danger' : 'brand'} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Consignment activity"
          description="Last six months, excluding drafts and cancelled consignments"
          action={
            <div className="flex rounded-md border border-line p-0.5 text-xs">
              {(['count', 'kg'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`min-h-8 rounded px-3 font-medium ${metric === m ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink'}`}
                >
                  {m === 'count' ? 'Consignments' : 'Weight'}
                </button>
              ))}
            </div>
          }
        >
          {metric === 'count' ? (
            <LineSeries data={activity} xKey="month" series={[{ key: 'count', name: 'Consignments', color: palette.green }]} />
          ) : (
            <ColumnSeries data={activity} xKey="month" series={[{ key: 'kg', name: 'Weight', color: palette.green }]} formatter={(v) => fmtKg(v)} />
          )}
        </Panel>

        <Panel title="Consignment status" description={`${consignments.length} consignments in total`}>
          <Donut data={statusData} centerValue={String(consignments.length)} centerLabel="consignments" />
          <div className="mt-4">
            <ChartLegend items={statusData.map((s) => ({ name: s.name, color: s.color, value: String(s.value) }))} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Produce collected" description="Top products by weight, dispatched or later">
          <HorizontalBars data={byProduct} formatter={(v) => fmtKg(v)} valueName="Collected" />
        </Panel>

        <Panel title="Upcoming activities" flush>
          <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto border-t border-line">
            {upcoming.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-muted">Nothing scheduled.</li>}
            {upcoming.map((u) => (
              <li key={u.key}>
                <Link to={u.href} className="flex items-start gap-3 px-5 py-3 hover:bg-canvas">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-subtle text-muted">
                    <u.icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{u.title}</span>
                    <span className="block truncate text-xs text-muted">{u.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{u.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Alerts" description="Things that need a decision" flush className="lg:col-span-2 xl:col-span-1">
          <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto border-t border-line">
            {alerts.length === 0 && (
              <li className="flex items-center justify-center gap-2 px-5 py-8 text-[13px] text-muted">
                <AlertTriangle size={15} /> No alerts
              </li>
            )}
            {alerts.map((a) => (
              <li key={a.id}>
                <Link to={a.href} className="flex items-start gap-3 px-5 py-3 hover:bg-canvas">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${severityDot[a.severity]}`} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{a.title}</span>
                    <span className="block text-xs text-muted">{a.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-semibold">Recent consignments</h2>
          <Link to="/consignments" className="text-[13px] font-medium text-primary hover:underline">View all</Link>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          pageSize={6}
          onRowClick={(c) => navigate(`/consignments/${c.id}`)}
          searchPlaceholder="Search consignments"
          searchText={(c) => `${c.id} ${L.product(c.productId)} ${L.driver(c.driverId)} ${c.destinations.map((d) => L.buyer(d.buyerId)).join(' ')}`}
          toolbar={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="w-40">
              <option>All</option>
              {CONSIGNMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          }
        />
      </section>
    </>
  )
}
