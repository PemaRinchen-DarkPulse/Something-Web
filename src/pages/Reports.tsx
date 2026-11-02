import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ColumnSeries, ChartLegend, Donut, HorizontalBars, LineSeries, palette } from '../components/charts/Charts'
import { PageHeader, Panel, Section } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, Input, Select } from '../components/ui/Fields'
import type { Consignment } from '../data/types'
import { downloadCsv, fmtDate, fmtKg, fmtNu, fmtNuCompact, fmtPct, isoDate, monthKey, monthLabel } from '../lib/format'
import { acceptedKg, COLLECTED, DELIVERED, revenueOf, totalKg, useLookups } from '../lib/lookups'
import { computeSettlement } from '../lib/settlement'
import { useStore } from '../store/DataStore'

const PRESETS = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '180', label: 'Last 6 months', days: 180 },
  { id: 'all', label: 'All time', days: 0 },
  { id: 'custom', label: 'Custom range', days: 0 },
]

function monthsBetween(min: string, max: string): string[] {
  const out: string[] = []
  let [y, m] = min.split('-').map(Number)
  const [ey, em] = max.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

export default function Reports() {
  const store = useStore()
  const L = useLookups()
  const [preset, setPreset] = useState('180')
  const [from, setFrom] = useState(isoDate(-180))
  const [to, setTo] = useState(isoDate(0))

  const range = useMemo(() => {
    const p = PRESETS.find((x) => x.id === preset)!
    if (preset === 'custom') return { from, to }
    if (preset === 'all') return { from: '0000-00-00', to: '9999-99-99' }
    return { from: isoDate(-p.days), to: isoDate(0) }
  }, [preset, from, to])

  const inRange = store.consignments.filter((c) => c.collectionDate >= range.from && c.collectionDate <= range.to)
  const collected = inRange.filter((c) => COLLECTED.includes(c.status))
  const delivered = inRange.filter((c) => DELIVERED.includes(c.status))

  const data = useMemo(() => {
    const kg = collected.reduce((s, c) => s + totalKg(c), 0)
    const accepted = delivered.reduce((s, c) => s + acceptedKg(c), 0)
    const revenue = delivered.reduce((s, c) => s + revenueOf(c), 0)
    const transport = delivered.reduce((s, c) => s + c.transportCost, 0)

    const productIds = [...new Set(collected.map((c) => c.productId))]
    const byProduct = productIds
      .map((id) => {
        const cs = collected.filter((c) => c.productId === id)
        const ds = cs.filter((c) => DELIVERED.includes(c.status))
        const rev = ds.reduce((s, c) => s + revenueOf(c), 0)
        const acc = ds.reduce((s, c) => s + acceptedKg(c), 0)
        return { name: L.product(id), kg: cs.reduce((s, c) => s + totalKg(c), 0), revenue: rev, perKg: acc ? Math.round((rev / acc) * 100) / 100 : 0 }
      })
      .sort((a, b) => b.kg - a.kg)

    const keys = collected.map((c) => monthKey(c.collectionDate)).sort()
    const months = keys.length ? monthsBetween(keys[0], keys[keys.length - 1]) : []
    const byMonth = months.map((k) => {
      const cs = collected.filter((c) => monthKey(c.collectionDate) === k)
      const ds = cs.filter((c) => DELIVERED.includes(c.status))
      return {
        month: monthLabel(k),
        // Compare like with like: only consignments that buyers have already confirmed.
        dispatched: ds.reduce((s, c) => s + totalKg(c), 0),
        accepted: ds.reduce((s, c) => s + acceptedKg(c), 0),
        transport: ds.reduce((s, c) => s + c.transportCost, 0),
      }
    })

    const farmerKg = new Map<string, number>()
    collected.forEach((c) => c.items.forEach((i) => farmerKg.set(i.memberId, (farmerKg.get(i.memberId) ?? 0) + i.kg)))
    const farmers = [...farmerKg.entries()].map(([id, value]) => ({ name: L.member(id), value })).sort((a, b) => b.value - a.value).slice(0, 8)

    const dests = delivered.flatMap((c) => c.destinations)
    const confirmed = dests.filter((d) => d.confirmation === 'Confirmed').length
    const disputed = dests.filter((d) => d.confirmation === 'Disputed').length
    const rejectedKg = dests.reduce((s, d) => s + (d.rejectedKg ?? 0), 0)
    const plannedKg = dests.reduce((s, d) => s + d.plannedKg, 0)

    return { kg, accepted, revenue, transport, byProduct, byMonth, farmers, confirmed, disputed, rejectedKg, plannedKg }
  }, [collected, delivered, L])

  const perfColumns: Column<Consignment>[] = [
    { key: 'id', header: 'Consignment', sortValue: (c) => c.id, render: (c) => <span className="font-medium">{c.id}</span> },
    { key: 'date', header: 'Collected', sortValue: (c) => c.collectionDate, render: (c) => <span className="whitespace-nowrap">{fmtDate(c.collectionDate)}</span> },
    { key: 'product', header: 'Product', hideBelow: 'sm', render: (c) => L.product(c.productId) },
    { key: 'sent', header: 'Dispatched', align: 'right', render: (c) => fmtKg(totalKg(c)) },
    { key: 'acc', header: 'Accepted', align: 'right', hideBelow: 'md', render: (c) => fmtKg(acceptedKg(c)) },
    { key: 'rate', header: 'Acceptance', align: 'right', sortValue: (c) => acceptedKg(c) / totalKg(c), render: (c) => fmtPct((acceptedKg(c) / totalKg(c)) * 100) },
    { key: 'rev', header: 'Revenue', align: 'right', hideBelow: 'md', sortValue: (c) => revenueOf(c), render: (c) => fmtNu(revenueOf(c)) },
    { key: 'perkg', header: 'Revenue / kg', align: 'right', hideBelow: 'lg', render: (c) => `Nu. ${(revenueOf(c) / (acceptedKg(c) || 1)).toFixed(2)}` },
  ]

  const settlementRows = store.settlements
    .map((s) => {
      const c = store.consignments.find((x) => x.id === s.consignmentId)!
      return { s, c, r: computeSettlement(c, { feePct: s.feePct }) }
    })
    .filter((x) => x.c.collectionDate >= range.from && x.c.collectionDate <= range.to)

  const exportCsv = () => {
    downloadCsv(`zhingpool-consignments-${isoDate(0)}.csv`, [
      ['Consignment', 'Collection date', 'Product', 'Grade', 'Status', 'Farmers', 'Dispatched kg', 'Accepted kg', 'Revenue (Nu.)', 'Transport (Nu.)'],
      ...inRange.map((c) => [c.id, c.collectionDate, L.product(c.productId), c.grade, c.status, c.items.length, totalKg(c), acceptedKg(c), revenueOf(c), c.transportCost]),
    ])
    store.toast(`Exported ${inRange.length} consignments.`)
  }

  const donut = [
    { name: 'Confirmed', value: data.confirmed, color: palette.green },
    { name: 'Disputed', value: data.disputed, color: palette.red },
  ]

  return (
    <>
      <PageHeader
        title="Reports"
        description="Totals for the period you choose. Revenue and costs count only delivered consignments."
        actions={<Button icon={<Download size={16} />} onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end">
        <Field label="Period" className="sm:w-48">
          <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </Field>
        {preset === 'custom' && (
          <>
            <Field label="From" className="sm:w-44">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" className="sm:w-44">
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </>
        )}
        <p className="text-[13px] text-muted sm:ml-auto">{inRange.length} consignments in this period</p>
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 2xl:grid-cols-6">
        {[
          ['Produce collected', fmtKg(data.kg)],
          ['Accepted by buyers', fmtKg(data.accepted)],
          ['Revenue', fmtNuCompact(data.revenue)],
          ['Revenue per kg', data.accepted ? `Nu. ${(data.revenue / data.accepted).toFixed(2)}` : '—'],
          ['Transport costs', fmtNuCompact(data.transport)],
          ['Disputed deliveries', String(data.disputed)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tnum">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Produce volume by product" description="Kg dispatched">
          <ColumnSeries data={data.byProduct} xKey="name" series={[{ key: 'kg', name: 'Dispatched', color: palette.green }]} formatter={(v) => fmtKg(v)} axisFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
        </Panel>
        <Panel title="Revenue by product" description="Nu., delivered consignments only">
          <ColumnSeries data={data.byProduct} xKey="name" series={[{ key: 'revenue', name: 'Revenue', color: palette.lightGreen }]} formatter={(v) => fmtNu(v)} axisFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        </Panel>
        <Panel title="Revenue per kg" description="Average price buyers paid for accepted produce">
          <HorizontalBars data={data.byProduct.filter((p) => p.perKg > 0).map((p) => ({ name: p.name, value: p.perKg }))} formatter={(v) => `Nu. ${v}`} color={palette.blue} valueName="Per kg" />
        </Panel>
        <Panel title="Farmer contribution" description="Top contributors by kg dispatched">
          <HorizontalBars data={data.farmers} formatter={(v) => fmtKg(v)} valueName="Contributed" />
        </Panel>
        <Panel title="Dispatched vs accepted" description="Gap between the two is produce buyers rejected">
          <LineSeries
            data={data.byMonth}
            xKey="month"
            series={[
              { key: 'dispatched', name: 'Dispatched', color: palette.green },
              { key: 'accepted', name: 'Accepted', color: palette.amber },
            ]}
            formatter={(v) => fmtKg(v)}
            axisFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
          />
        </Panel>
        <Panel title="Transport costs" description={data.revenue ? `${fmtPct((data.transport / data.revenue) * 100)} of revenue` : 'Nu. per month'}>
          <ColumnSeries data={data.byMonth} xKey="month" series={[{ key: 'transport', name: 'Transport', color: palette.blue }]} formatter={(v) => fmtNu(v)} axisFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        </Panel>
      </div>

      <div className="mt-8">
        <Section title="Consignment performance" description="Acceptance is the share of dispatched kg that buyers kept">
          <DataTable columns={perfColumns} rows={[...delivered].sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))} rowKey={(c) => c.id} pageSize={8} searchPlaceholder="Search consignments" searchText={(c) => `${c.id} ${L.product(c.productId)}`} />
        </Section>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <Section title="Settlement summaries">
            <div className="overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Consignment</th>
                    <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                    <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Transport</th>
                    <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Group fee</th>
                    <th className="px-4 py-2.5 text-right font-medium">Net to farmers</th>
                    <th className="hidden px-4 py-2.5 font-medium md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementRows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No settlements in this period.</td></tr>
                  )}
                  {settlementRows.map(({ s, c, r }) => (
                    <tr key={c.id} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-3 font-medium">{c.id}</td>
                      <td className="px-4 py-3 text-right tnum">{fmtNu(r.revenue)}</td>
                      <td className="hidden px-4 py-3 text-right tnum sm:table-cell">{fmtNu(r.transport)}</td>
                      <td className="hidden px-4 py-3 text-right tnum sm:table-cell">{fmtNu(r.fee)}</td>
                      <td className="px-4 py-3 text-right font-medium tnum">{fmtNu(r.net)}</td>
                      <td className="hidden px-4 py-3 text-muted md:table-cell">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <Section title="Dispute statistics">
          {data.confirmed + data.disputed === 0 ? (
            <p className="text-[13px] text-muted">No delivered consignments in this period.</p>
          ) : (
            <>
              <Donut data={donut} centerValue={fmtPct((data.disputed / (data.confirmed + data.disputed)) * 100)} centerLabel="disputed" />
              <div className="mt-4">
                <ChartLegend items={donut.map((d) => ({ name: d.name, color: d.color, value: String(d.value) }))} />
              </div>
              <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[13px]">
                <div className="flex justify-between"><dt className="text-muted">Planned for buyers</dt><dd className="tnum font-medium">{fmtKg(data.plannedKg)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Rejected by buyers</dt><dd className="tnum font-medium">{fmtKg(data.rejectedKg)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Rejection rate</dt><dd className="tnum font-medium">{data.plannedKg ? fmtPct((data.rejectedKg / data.plannedKg) * 100) : '—'}</dd></div>
              </dl>
            </>
          )}
        </Section>
      </div>
    </>
  )
}
