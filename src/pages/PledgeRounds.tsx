import { ClipboardList, Hand, Plus, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { HorizontalBars } from '../components/charts/Charts'
import { StatusBadge } from '../components/ui/Badge'
import { Detail, DetailGrid, EmptyState, Notice, PageHeader, Panel, ProgressBar, Section, Tabs } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { Countdown } from '../components/ui/Countdown'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Checkbox, Field, FormGrid, Input, Select } from '../components/ui/Fields'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import type { PledgeRound } from '../data/types'
import { shortfalls } from '../lib/alerts'
import { fmtDate, fmtDateTime, fmtKg, fmtPct, isoDate } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

interface ResponseRow {
  memberId: string
  pledges: { productId: string; kg: number; source: string }[]
}

function RoundDetail({ round, editable }: { round: PledgeRound; editable: boolean }) {
  const store = useStore()
  const L = useLookups()
  const [filter, setFilter] = useState<'all' | 'responded' | 'waiting'>('all')
  const [manualFor, setManualFor] = useState<string | null>(null)
  const [manualProduct, setManualProduct] = useState(round.productIds[0])
  const [manualKg, setManualKg] = useState('')
  const [confirm, setConfirm] = useState<'sms' | 'close' | null>(null)

  const rows = useMemo<ResponseRow[]>(
    () =>
      round.invited.map((memberId) => ({
        memberId,
        pledges: round.pledges.filter((p) => p.memberId === memberId),
      })),
    [round],
  )
  const responded = rows.filter((r) => r.pledges.length > 0).length
  const byProduct = round.productIds.map((id) => ({
    id,
    name: L.product(id),
    value: round.pledges.filter((p) => p.productId === id).reduce((s, p) => s + p.kg, 0),
  }))
  const totalPledged = byProduct.reduce((s, p) => s + p.value, 0)
  const gaps = shortfalls(store)
  const manualCount = round.pledges.filter((p) => p.source === 'Manual').length

  const visible = rows.filter((r) => (filter === 'all' ? true : filter === 'responded' ? r.pledges.length > 0 : r.pledges.length === 0))

  const columns: Column<ResponseRow>[] = [
    {
      key: 'farmer',
      header: 'Farmer',
      sortValue: (r) => L.member(r.memberId),
      render: (r) => (
        <span>
          <span className="block font-medium">{L.member(r.memberId)}</span>
          <span className="block text-xs text-muted">{store.members.find((m) => m.id === r.memberId)?.phone}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Response', render: (r) => <StatusBadge status={r.pledges.length ? 'Responded' : 'No response'} /> },
    {
      key: 'pledged',
      header: 'Pledged',
      render: (r) =>
        r.pledges.length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="flex flex-wrap gap-x-3 gap-y-0.5">
            {r.pledges.map((p, i) => (
              <span key={i} className="whitespace-nowrap tnum">
                {L.product(p.productId)} {fmtKg(p.kg)}
                {p.source === 'Manual' && <span className="ml-1 text-xs text-muted">(manual)</span>}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (r) =>
        editable ? (
          <Button size="sm" variant="ghost" icon={<Hand size={15} />} onClick={() => setManualFor(r.memberId)}>
            Enter pledge
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{round.title}</h2>
            <StatusBadge status={round.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {round.id} · opened {fmtDateTime(round.opensAt)} · collection on {fmtDate(round.pickupDate)}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button icon={<Send size={15} />} onClick={() => setConfirm('sms')}>
              Send SMS requests
            </Button>
            <Button icon={<Hand size={15} />} onClick={() => setManualFor('')}>
              Manual entry
            </Button>
            <Button variant="danger" onClick={() => setConfirm('close')}>
              Close round
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5 border-y border-line py-5">
        <DetailGrid>
          <Detail label={editable ? 'Closes in' : 'Closed'}>
            {editable ? <Countdown to={round.closesAt} className="text-base" /> : fmtDateTime(round.closesAt)}
          </Detail>
          <Detail label="Farmers responded">
            {responded} of {round.invited.length}
            <div className="mt-1.5 max-w-32">
              <ProgressBar value={responded} max={round.invited.length} />
            </div>
          </Detail>
          <Detail label="Total pledged">{fmtKg(totalPledged)}</Detail>
          <Detail label="SMS requests">
            {round.smsSent ? (
              <span>
                {round.smsSent.sent} sent
                {round.smsSent.failed > 0 && <span className="text-danger"> · {round.smsSent.failed} failed</span>}
              </span>
            ) : (
              <span className="text-warning">Not sent yet</span>
            )}
          </Detail>
        </DetailGrid>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Pledges by product" description={manualCount ? `${manualCount} entered manually` : 'All received by SMS'} className="lg:col-span-1">
          <HorizontalBars data={byProduct.map((p) => ({ name: p.name, value: p.value }))} formatter={(v) => fmtKg(v)} valueName="Pledged" height={Math.max(140, byProduct.length * 52)} />
          {editable && gaps.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {gaps.map((g) => (
                <div key={g.productId} className="rounded-md bg-warning-soft px-3 py-2 text-xs text-[#7a520c]">
                  <span className="font-medium">{L.product(g.productId)}</span> is {fmtKg(g.ordered - g.pledged)} short of confirmed orders ({fmtKg(g.pledged)} of {fmtKg(g.ordered)}, {fmtPct((g.pledged / g.ordered) * 100)}).
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            rows={visible}
            rowKey={(r) => r.memberId}
            pageSize={8}
            searchPlaceholder="Search farmers"
            searchText={(r) => `${L.member(r.memberId)} ${store.members.find((m) => m.id === r.memberId)?.phone ?? ''}`}
            toolbar={
              <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter responses" className="w-48">
                <option value="all">All invited ({rows.length})</option>
                <option value="responded">Responded ({responded})</option>
                <option value="waiting">Not responded ({rows.length - responded})</option>
              </Select>
            }
          />
        </div>
      </div>

      <Modal
        open={manualFor !== null}
        size="sm"
        title="Manual pledge entry"
        description="Use this when a farmer phones in or their SMS could not be read."
        onClose={() => setManualFor(null)}
        footer={
          <>
            <Button onClick={() => setManualFor(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!manualFor || !(Number(manualKg) > 0)}
              onClick={() => {
                store.addManualPledge(round.id, { memberId: manualFor!, productId: manualProduct, kg: Number(manualKg) })
                store.toast(`Pledge of ${fmtKg(Number(manualKg))} recorded for ${L.member(manualFor!)}.`)
                setManualFor(null)
                setManualKg('')
              }}
            >
              Save pledge
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Farmer">
            <Select value={manualFor ?? ''} onChange={(e) => setManualFor(e.target.value)}>
              <option value="">Choose a farmer</option>
              {round.invited.map((id) => (
                <option key={id} value={id}>{L.member(id)}</option>
              ))}
            </Select>
          </Field>
          <FormGrid>
            <Field label="Product">
              <Select value={manualProduct} onChange={(e) => setManualProduct(e.target.value)}>
                {round.productIds.map((id) => (
                  <option key={id} value={id}>{L.product(id)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Quantity (kg)">
              <Input type="number" min={1} inputMode="numeric" value={manualKg} onChange={(e) => setManualKg(e.target.value)} />
            </Field>
          </FormGrid>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm === 'sms'}
        title="Send pledge requests?"
        message={
          <>
            One SMS goes to each of the {round.invited.length} farmers who agreed to SMS. <strong>Demo mode:</strong> no real messages are sent.
          </>
        }
        confirmLabel="Send requests"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          store.sendRoundSms(round.id)
          store.toast('Marked as sent. Demo mode: no SMS were actually delivered.', 'info')
        }}
      />
      <ConfirmDialog
        open={confirm === 'close'}
        title="Close this round now?"
        message="Farmers can no longer pledge. Replies that arrive later land in the SMS inbox."
        confirmLabel="Close round"
        tone="danger"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          store.closeRound(round.id)
          store.toast(`${round.id} closed.`)
        }}
      />
    </div>
  )
}

function NewRoundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore()
  const products = store.products.filter((p) => p.active)
  const hasOpen = store.rounds.some((r) => r.status === 'Open')
  const [title, setTitle] = useState('Weekly pledge round')
  const [closes, setCloses] = useState(() => toLocalInput(new Date(Date.now() + 36 * 3_600_000)))
  const [pickup, setPickup] = useState(isoDate(6))
  const [selected, setSelected] = useState<string[]>(['cab', 'car', 'pot'])

  const eligible = store.members.filter((m) => m.status === 'Active' && m.smsConsent === 'Granted').length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open a pledge round"
      description={`${eligible} active farmers with SMS consent will be invited.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={selected.length === 0 || !title.trim()}
            onClick={() => {
              store.openRound({ title: title.trim(), closesAt: new Date(closes).toISOString(), pickupDate: pickup, productIds: selected })
              store.toast('Pledge round opened. Send the SMS requests when you are ready.')
              onClose()
            }}
          >
            Open round
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {hasOpen && <Notice tone="warning">Only one round can be open. Opening a new one closes the current round.</Notice>}
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <FormGrid>
          <Field label="Pledges close at">
            <Input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
          </Field>
          <Field label="Collection date">
            <Input type="date" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </Field>
        </FormGrid>
        <fieldset>
          <legend className="mb-1 text-[13px] font-medium">Products farmers can pledge</legend>
          <div className="grid grid-cols-2 gap-x-4">
            {products.map((p) => (
              <Checkbox
                key={p.id}
                label={`${p.name} (${p.code})`}
                checked={selected.includes(p.id)}
                onChange={(v) => setSelected((s) => (v ? [...s, p.id] : s.filter((x) => x !== p.id)))}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}

export default function PledgeRounds() {
  const { rounds } = useStore()
  const [tab, setTab] = useState<'active' | 'previous'>('active')
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const open = rounds.find((r) => r.status === 'Open')
  const previous = rounds.filter((r) => r.status === 'Closed')
  const selected = previous.find((r) => r.id === selectedId) ?? previous[0]

  const L = useLookups()
  const columns: Column<PledgeRound>[] = [
    { key: 'id', header: 'Round', render: (r) => <span className="font-medium text-primary">{r.id}</span> },
    { key: 'title', header: 'Title', hideBelow: 'md', render: (r) => r.title },
    { key: 'closed', header: 'Closed', render: (r) => fmtDate(r.closesAt) },
    { key: 'pickup', header: 'Collection', hideBelow: 'sm', render: (r) => fmtDate(r.pickupDate) },
    { key: 'resp', header: 'Responded', align: 'right', render: (r) => `${new Set(r.pledges.map((p) => p.memberId)).size} / ${r.invited.length}` },
    { key: 'kg', header: 'Pledged', align: 'right', render: (r) => fmtKg(r.pledges.reduce((s, p) => s + p.kg, 0)) },
    { key: 'products', header: 'Products', hideBelow: 'lg', render: (r) => r.productIds.map((id) => L.product(id)).join(', ') },
  ]

  return (
    <>
      <PageHeader
        title="Pledge rounds"
        description="Ask farmers by SMS what they can supply, then plan collections around what they promise."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            Open new round
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'active', label: 'Active', count: open ? 1 : 0 },
          { id: 'previous', label: 'Previous', count: previous.length },
        ]}
      />

      <div className="mt-6">
        {tab === 'active' &&
          (open ? (
            <RoundDetail key={open.id} round={open} editable />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No round is open"
              text="Open a round to send SMS pledge requests to your farmers."
              action={<Button variant="primary" onClick={() => setCreating(true)}>Open new round</Button>}
            />
          ))}

        {tab === 'previous' && (
          <>
            <DataTable columns={columns} rows={previous} rowKey={(r) => r.id} pageSize={6} onRowClick={(r) => setSelectedId(r.id)} />
            {selected && (
              <Section title={`Round ${selected.id}`} description="Selected from the list above">
                <RoundDetail key={selected.id} round={selected} editable={false} />
              </Section>
            )}
          </>
        )}
      </div>

      {creating && <NewRoundModal open onClose={() => setCreating(false)} />}
    </>
  )
}
