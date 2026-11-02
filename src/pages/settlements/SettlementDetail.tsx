import { CheckCircle2, ChevronLeft, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { EmptyState, Notice, Section } from '../../components/ui/Blocks'
import { Button, LinkButton } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { Field, FormGrid, Input, Textarea } from '../../components/ui/Fields'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import type { SettlementRow } from '../../data/types'
import { fmtDate, fmtDateTime, fmtKg, fmtNu } from '../../lib/format'
import { useLookups } from '../../lib/lookups'
import { computeSettlement } from '../../lib/settlement'
import { useStore } from '../../store/DataStore'

function Figure({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 tnum ${strong ? 'text-xl font-semibold text-primary' : 'text-lg font-semibold'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export default function SettlementDetail() {
  const { id } = useParams()
  const store = useStore()
  const L = useLookups()
  const meta = store.settlements.find((s) => s.consignmentId === id)
  const c = store.consignments.find((x) => x.id === id)
  const [adjusting, setAdjusting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [transport, setTransport] = useState('')
  const [feePct, setFeePct] = useState('')
  const [note, setNote] = useState('')

  const result = useMemo(() => (c && meta ? computeSettlement(c, { feePct: meta.feePct }) : null), [c, meta])

  if (!c || !meta || !result) {
    return (
      <EmptyState
        icon={Receipt}
        title="No settlement yet"
        text="A settlement is created once every buyer has confirmed the delivery."
        action={<LinkButton to="/settlements">Back to settlements</LinkButton>}
      />
    )
  }

  const approved = meta.status === 'Approved'
  const disputes = c.destinations.filter((d) => d.confirmation === 'Disputed')
  const payoutFor = (memberId: string) => store.payouts.find((p) => p.consignmentId === c.id && p.memberId === memberId)
  const sample = result.rows[0]

  const preview = computeSettlement(c, {
    transportCost: Number(transport) >= 0 && transport !== '' ? Number(transport) : c.transportCost,
    feePct: Number(feePct) >= 0 && feePct !== '' ? Number(feePct) : meta.feePct,
  })

  const columns: Column<SettlementRow>[] = [
    { key: 'name', header: 'Farmer', sortValue: (r) => L.member(r.memberId), render: (r) => <span className="font-medium">{L.member(r.memberId)}</span> },
    { key: 'dispatched', header: 'Dispatched', align: 'right', hideBelow: 'sm', render: (r) => fmtKg(r.dispatchedKg) },
    { key: 'accepted', header: 'Accepted', align: 'right', render: (r) => fmtKg(r.acceptedKg) },
    { key: 'price', header: 'Pooled price / kg', align: 'right', hideBelow: 'lg', render: (r) => `Nu. ${r.pricePerKg.toFixed(2)}` },
    { key: 'gross', header: 'Gross', align: 'right', hideBelow: 'md', render: (r) => fmtNu(r.gross) },
    { key: 'transport', header: 'Transport share', align: 'right', hideBelow: 'md', render: (r) => <span className="text-muted">− {fmtNu(r.transport).replace('Nu. ', '')}</span> },
    { key: 'fee', header: `Group fee (${meta.feePct}%)`, align: 'right', hideBelow: 'md', render: (r) => <span className="text-muted">− {fmtNu(r.fee).replace('Nu. ', '')}</span> },
    { key: 'net', header: 'Net payable', align: 'right', sortValue: (r) => r.net, render: (r) => <span className="font-semibold">{fmtNu(r.net)}</span> },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'sm',
      render: (r) => {
        const p = payoutFor(r.memberId)
        return <StatusBadge status={p ? p.status : approved ? 'Approved' : 'Awaiting approval'} />
      },
    },
  ]

  return (
    <>
      <Link to="/settlements" className="mb-4 inline-flex min-h-10 items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ChevronLeft size={16} /> All settlements
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Settlement for {c.id}</h1>
            <StatusBadge status={meta.status} />
            <span className="rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted">Version {meta.versions.length}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {L.product(c.productId)}, grade {c.grade} · collected {fmtDate(c.collectionDate)} · {c.items.length} farmers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to={`/consignments/${c.id}`}>View consignment</LinkButton>
          {!approved && (
            <>
              <Button
                onClick={() => {
                  setTransport(String(c.transportCost))
                  setFeePct(String(meta.feePct))
                  setNote('')
                  setAdjusting(true)
                }}
              >
                Adjust costs
              </Button>
              <Button variant="primary" icon={<CheckCircle2 size={16} />} disabled={disputes.length > 0} onClick={() => setApproving(true)}>
                Approve settlement
              </Button>
            </>
          )}
          {approved && <LinkButton to="/payouts" variant="primary">Go to payouts</LinkButton>}
        </div>
      </div>

      {disputes.length > 0 && !approved && (
        <div className="mb-6">
          <Notice tone="warning">
            {disputes.length} {disputes.length === 1 ? 'delivery is' : 'deliveries are'} still disputed. Resolve {disputes.length === 1 ? 'it' : 'them'} on the <Link to="/deliveries" className="font-medium underline">Deliveries</Link> page before approving.
          </Notice>
        </div>
      )}
      {approved && (
        <div className="mb-6">
          <Notice>Approved by {meta.approvedBy} on {fmtDateTime(meta.approvedAt)}. Amounts are locked. Payouts were created for each farmer.</Notice>
        </div>
      )}

      {/* Financial summary */}
      <div className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-5 md:divide-y-0">
        <Figure label="Revenue from buyers" value={fmtNu(result.revenue)} sub={`${fmtKg(result.totalAccepted)} accepted`} />
        <Figure label="Pooled price per kg" value={`Nu. ${result.pooledPrice.toFixed(2)}`} sub="Same for every farmer" />
        <Figure label="Transport costs" value={`− ${fmtNu(result.transport)}`} sub="Shared by dispatched kg" />
        <Figure label={`Group fee (${meta.feePct}%)`} value={`− ${fmtNu(result.fee)}`} sub="Of each farmer’s gross" />
        <Figure label="Total net payable" value={fmtNu(result.net)} sub={`To ${c.items.length} farmers`} strong />
      </div>

      <div className="mt-8">
        <div>
          <Section title="Payment per farmer" description="Gross minus transport share minus group fee">
            <DataTable
              columns={columns}
              rows={result.rows}
              rowKey={(r) => r.memberId}
              pageSize={10}
              searchPlaceholder="Search farmers"
              searchText={(r) => L.member(r.memberId)}
              totals={{
                name: 'Total',
                dispatched: fmtKg(result.totalDispatched),
                accepted: fmtKg(result.totalAccepted),
                gross: fmtNu(result.revenue),
                transport: `− ${fmtNu(result.transport).replace('Nu. ', '')}`,
                fee: `− ${fmtNu(result.fee).replace('Nu. ', '')}`,
                net: fmtNu(result.net),
              }}
            />
          </Section>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div>
          <Section title="Where the revenue comes from" description="Buyers pay only for the kg they accepted">
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface text-[13px]">
              {c.destinations.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <span>
                    <span className="block font-medium">{L.buyer(d.buyerId)}</span>
                    <span className="block text-xs text-muted">
                      {fmtKg(d.acceptedKg ?? 0)} accepted of {fmtKg(d.plannedKg)} × {fmtNu(d.pricePerKg)} per kg
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={d.confirmation} />
                    <span className="font-medium tnum">{fmtNu((d.acceptedKg ?? 0) * d.pricePerKg)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div>
          <Section title="How a payment is calculated">
            <ol className="space-y-4 text-[13px]">
              <Step n={1} title="Pool the revenue">
                {fmtNu(result.revenue)} ÷ {fmtKg(result.totalAccepted)} accepted = <b>Nu. {result.pooledPrice.toFixed(2)}</b> per kg for everyone.
              </Step>
              <Step n={2} title="Gross for each farmer">
                Accepted kg × pooled price. Accepted kg follows each farmer’s share of what was dispatched.
              </Step>
              <Step n={3} title="Share the transport">
                {fmtNu(result.transport)} split by dispatched kg ({fmtKg(result.totalDispatched)} in total).
              </Step>
              <Step n={4} title="Take the group fee">
                {meta.feePct}% of each farmer’s gross.
              </Step>
              <Step n={5} title="Net payable">
                Gross − transport share − group fee.
              </Step>
            </ol>
            {sample && (
              <div className="mt-4 rounded-md bg-primary-soft px-4 py-3 text-[13px]">
                <p className="mb-1 text-xs font-medium text-primary">Example: {L.member(sample.memberId)}</p>
                <p className="tnum">
                  {fmtNu(sample.gross)} − {fmtNu(sample.transport).replace('Nu. ', '')} − {fmtNu(sample.fee).replace('Nu. ', '')} = <b>{fmtNu(sample.net)}</b>
                </p>
              </div>
            )}
          </Section>
        </div>

        <div className="lg:col-span-2 xl:col-span-1">
          <Section title="Version history" description="Every change to costs creates a new version">
            <ol className="space-y-4">
              {[...meta.versions].reverse().map((v, i) => {
                const net = computeSettlement(c, { transportCost: v.transportCost, feePct: v.feePct }).net
                return (
                  <li key={v.version} className="text-[13px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Version {v.version}{i === 0 && <span className="ml-2 text-xs font-normal text-primary">Current</span>}</span>
                      <span className="tnum font-medium">{fmtNu(net)}</span>
                    </div>
                    <p className="text-xs text-muted">{fmtDateTime(v.at)} · {v.by}</p>
                    <p className="mt-0.5 text-muted">{v.note}</p>
                    <p className="mt-0.5 text-xs text-muted">Transport {fmtNu(v.transportCost)} · fee {v.feePct}%</p>
                  </li>
                )
              })}
            </ol>
          </Section>
        </div>
      </div>

      <Modal
        open={adjusting}
        onClose={() => setAdjusting(false)}
        title="Adjust costs"
        description="This creates a new settlement version. Earlier versions are kept for the record."
        footer={
          <>
            <Button onClick={() => setAdjusting(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!note.trim() || transport === '' || feePct === ''}
              onClick={() => {
                store.adjustSettlement(c.id, { transportCost: Number(transport), feePct: Number(feePct), note: note.trim() })
                store.toast(`Settlement updated to version ${meta.versions.length + 1}.`)
                setAdjusting(false)
              }}
            >
              Save as new version
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormGrid>
            <Field label="Transport cost (Nu.)">
              <Input type="number" min={0} inputMode="numeric" value={transport} onChange={(e) => setTransport(e.target.value)} />
            </Field>
            <Field label="Group fee (%)">
              <Input type="number" min={0} max={100} step="0.5" inputMode="decimal" value={feePct} onChange={(e) => setFeePct(e.target.value)} />
            </Field>
          </FormGrid>
          <Field label="Reason for the change" hint="Shown in the version history.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="rounded-md bg-subtle px-4 py-3 text-[13px]">
            <p className="text-xs text-muted">Total net payable would be</p>
            <p className="tnum font-semibold">
              {fmtNu(preview.net)}
              <span className="ml-2 text-xs font-normal text-muted">currently {fmtNu(result.net)}</span>
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={approving}
        title="Approve this settlement?"
        message={`Net payable of ${fmtNu(result.net)} to ${c.items.length} farmers will be locked and payouts created. Costs can no longer be changed.`}
        confirmLabel="Approve settlement"
        onClose={() => setApproving(false)}
        onConfirm={() => {
          store.approveSettlement(c.id)
          store.toast(`Settlement for ${c.id} approved. ${c.items.length} payouts created.`)
        }}
      />
    </>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">{n}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-muted tnum">{children}</span>
      </span>
    </li>
  )
}
