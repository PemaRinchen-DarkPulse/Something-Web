import { ChevronLeft, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, Notice, PageHeader, Tabs } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { Field, FormGrid, Input, Select } from '../components/ui/Fields'
import type { SmsMessage, SmsStatus } from '../data/types'
import { fmtDateTime, fmtKg } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

function Detail({ msg, onBack }: { msg: SmsMessage; onBack: () => void }) {
  const store = useStore()
  const L = useLookups()
  const open = store.rounds.find((r) => r.status === 'Open')
  const [memberId, setMemberId] = useState(msg.memberId ?? '')
  const [productId, setProductId] = useState(msg.parsed?.productId ?? open?.productIds[0] ?? store.products[0].id)
  const [kg, setKg] = useState(msg.parsed ? String(msg.parsed.kg) : '')

  const history = store.sms.filter((m) => m.from === msg.from && m.id !== msg.id)
  const canAssign = msg.status === 'Unreadable' && !!open

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-10 items-center gap-1 text-[13px] text-muted hover:text-ink lg:hidden">
        <ChevronLeft size={16} /> Back to messages
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{msg.memberId ? L.member(msg.memberId) : 'Unknown sender'}</p>
          <p className="text-[13px] text-muted tnum">{msg.from} · {fmtDateTime(msg.receivedAt)}</p>
        </div>
        <StatusBadge status={msg.status} />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">Message received</p>
        <p className="mt-1 whitespace-pre-wrap font-mono text-sm">{msg.body}</p>
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted">How ZhingPool read it</p>
        {msg.parsed ? (
          <p className="mt-1 text-sm font-medium">
            {L.product(msg.parsed.productId)} · {fmtKg(msg.parsed.kg)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-danger">Could not be read. {msg.note}</p>
        )}
        {msg.parsed && msg.note && <p className="mt-0.5 text-xs text-muted">{msg.note}</p>}
      </div>

      {canAssign && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold">Assign manually</h3>
          <p className="mb-3 mt-0.5 text-xs text-muted">Turn this into a pledge in {open!.id} ({open!.title}).</p>
          <div className="space-y-4">
            <Field label="Farmer">
              <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">Choose a farmer</option>
                {store.members.filter((m) => m.status === 'Active').map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.phone}</option>
                ))}
              </Select>
            </Field>
            <FormGrid>
              <Field label="Product">
                <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {open!.productIds.map((id) => (
                    <option key={id} value={id}>{L.product(id)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity (kg)">
                <Input type="number" min={1} inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value)} />
              </Field>
            </FormGrid>
            <Button
              variant="primary"
              disabled={!memberId || !(Number(kg) > 0)}
              onClick={() => {
                store.assignSms(msg.id, { memberId, productId, kg: Number(kg) })
                store.toast(`Pledge of ${fmtKg(Number(kg))} added for ${L.member(memberId)}.`)
              }}
            >
              Add pledge
            </Button>
          </div>
        </div>
      )}
      {msg.status === 'Unreadable' && !open && (
        <div className="mt-6">
          <Notice tone="warning">No pledge round is open, so this message cannot be assigned. Open a round first.</Notice>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-semibold">Message history</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">No other messages from this number.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {history.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <span>
                  <span className="font-mono">{m.body}</span>
                  <span className="ml-2 text-xs text-muted">{fmtDateTime(m.receivedAt)}</span>
                </span>
                <StatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function SmsInbox() {
  const { sms } = useStore()
  const L = useLookups()
  const [tab, setTab] = useState<'All' | SmsStatus>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = [...sms].filter((m) => tab === 'All' || m.status === tab).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const selected = sms.find((m) => m.id === selectedId)
  const count = (s: SmsStatus) => sms.filter((m) => m.status === s).length

  return (
    <>
      <PageHeader
        title="SMS inbox"
        description="Replies from farmers to pledge requests. Messages that cannot be read need a person to assign them."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'All', label: 'All', count: sms.length },
          { id: 'Unreadable', label: 'Unreadable', count: count('Unreadable') },
          { id: 'Parsed', label: 'Parsed', count: count('Parsed') },
          { id: 'Assigned', label: 'Assigned', count: count('Assigned') },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className={`lg:col-span-2 ${selected ? 'hidden lg:block' : ''}`}>
          {rows.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages here" />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`block w-full px-4 py-3 text-left hover:bg-canvas ${m.id === selectedId ? 'bg-primary-soft/60' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{m.memberId ? L.member(m.memberId) : m.from}</span>
                      <span className="shrink-0 text-xs text-muted">{fmtDateTime(m.receivedAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-muted">{m.body}</span>
                    <span className="mt-1.5 block"><StatusBadge status={m.status} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`lg:col-span-3 ${selected ? '' : 'hidden lg:block'}`}>
          {selected ? (
            <Detail key={selected.id + selected.status} msg={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <EmptyState icon={MessageSquare} title="Select a message" text="Choose one from the list to see how it was read and to assign it." />
          )}
        </div>
      </div>
    </>
  )
}
