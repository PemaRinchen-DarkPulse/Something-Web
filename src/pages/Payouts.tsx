import { Download, Wallet } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState, Notice, PageHeader, Tabs } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, FormGrid, Input, Select, Textarea } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Payout, PayoutMethod, PayoutStatus } from '../data/types'
import { downloadCsv, fmtDate, fmtNu, isoDate } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

function RecordModal({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  const store = useStore()
  const L = useLookups()
  const [method, setMethod] = useState<PayoutMethod>('mBoB')
  const [reference, setReference] = useState('')
  const [paidOn, setPaidOn] = useState(isoDate(0))
  const [error, setError] = useState('')

  const save = () => {
    if (method !== 'Cash' && !reference.trim()) return setError(`Enter the ${method} transaction reference.`)
    store.recordPayout(payout.id, { method, reference: reference.trim() || `CASH-${payout.id.slice(-4)}`, paidOn })
    store.toast(`Payment of ${fmtNu(payout.amount)} to ${L.member(payout.memberId)} recorded.`)
    onClose()
  }

  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Record payment"
      description={`${L.member(payout.memberId)} · ${payout.consignmentId}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Record as paid</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md bg-primary-soft px-4 py-3">
          <p className="text-xs text-primary">Amount payable</p>
          <p className="text-xl font-semibold text-primary tnum">{fmtNu(payout.amount)}</p>
        </div>
        <Notice>ZhingPool does not send money. Pay the farmer first, then record it here.</Notice>
        <FormGrid>
          <Field label="Paid by">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PayoutMethod)}>
              <option>mBoB</option>
              <option>mPay</option>
              <option>Cash</option>
            </Select>
          </Field>
          <Field label="Date paid">
            <Input type="date" max={isoDate(0)} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
        </FormGrid>
        <Field label={method === 'Cash' ? 'Receipt number (optional)' : 'Transaction reference'}>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === 'Cash' ? 'e.g. R-0231' : 'e.g. TXN48210123'} />
        </Field>
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

function WaiveModal({ payout, onClose }: { payout: Payout; onClose: () => void }) {
  const store = useStore()
  const L = useLookups()
  const [reason, setReason] = useState('')
  return (
    <Modal
      open
      size="sm"
      onClose={onClose}
      title="Waive payout"
      description={`${L.member(payout.memberId)} · ${fmtNu(payout.amount)}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            onClick={() => {
              store.waivePayout(payout.id, reason.trim())
              store.toast('Payout waived.', 'info')
              onClose()
            }}
          >
            Waive payout
          </Button>
        </>
      }
    >
      <Field label="Reason" hint="For example, the farmer asked to donate the amount to the group fund.">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
    </Modal>
  )
}

export default function Payouts() {
  const { payouts } = useStore()
  const L = useLookups()
  const [tab, setTab] = useState<'Unpaid' | 'Paid' | 'Waived' | 'All'>('Unpaid')
  const [recording, setRecording] = useState<Payout | null>(null)
  const [waiving, setWaiving] = useState<Payout | null>(null)

  const sum = (s: PayoutStatus) => payouts.filter((p) => p.status === s).reduce((t, p) => t + p.amount, 0)
  const count = (s: PayoutStatus) => payouts.filter((p) => p.status === s).length
  const rows = payouts.filter((p) => tab === 'All' || p.status === tab)

  const columns: Column<Payout>[] = [
    { key: 'farmer', header: 'Farmer', sortValue: (p) => L.member(p.memberId), render: (p) => <span className="font-medium">{L.member(p.memberId)}</span> },
    { key: 'consignment', header: 'Consignment', hideBelow: 'sm', render: (p) => p.consignmentId },
    { key: 'amount', header: 'Amount payable', align: 'right', sortValue: (p) => p.amount, render: (p) => <span className="font-medium">{fmtNu(p.amount)}</span> },
    { key: 'method', header: 'Method', hideBelow: 'md', render: (p) => p.method ?? <span className="text-muted">—</span> },
    { key: 'ref', header: 'Reference', hideBelow: 'lg', render: (p) => (p.reference ? <span className="tnum">{p.reference}</span> : <span className="text-muted">—</span>) },
    { key: 'date', header: 'Date paid', hideBelow: 'md', sortValue: (p) => p.paidOn ?? '', render: (p) => (p.paidOn ? fmtDate(p.paidOn) : <span className="text-muted">—</span>) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (p) =>
        p.status === 'Unpaid' ? (
          <span className="flex justify-end gap-1">
            <Button size="sm" variant="primary" onClick={() => setRecording(p)}>Record</Button>
            <Button size="sm" variant="ghost" onClick={() => setWaiving(p)}>Waive</Button>
          </span>
        ) : null,
    },
  ]

  const exportCsv = () => {
    downloadCsv('zhingpool-payouts.csv', [
      ['Payout', 'Farmer', 'Consignment', 'Amount (Nu.)', 'Status', 'Method', 'Reference', 'Date paid'],
      ...rows.map((p) => [p.id, L.member(p.memberId), p.consignmentId, p.amount, p.status, p.method ?? '', p.reference ?? '', p.paidOn ?? '']),
    ])
  }

  return (
    <>
      <PageHeader
        title="Payouts"
        description="Money owed to farmers after settlement. ZhingPool only records payments: it never moves money."
        actions={<Button icon={<Download size={16} />} onClick={exportCsv}>Export CSV</Button>}
      />

      <div className="mb-4 grid grid-cols-3 gap-x-6 gap-y-3 border-b border-line pb-4 sm:max-w-2xl">
        <div>
          <p className="text-xs text-muted">Awaiting payment</p>
          <p className="text-lg font-semibold tnum">{fmtNu(sum('Unpaid'))}</p>
          <p className="text-xs text-muted">{count('Unpaid')} farmers</p>
        </div>
        <div>
          <p className="text-xs text-muted">Paid</p>
          <p className="text-lg font-semibold tnum">{fmtNu(sum('Paid'))}</p>
          <p className="text-xs text-muted">{count('Paid')} payments</p>
        </div>
        <div>
          <p className="text-xs text-muted">Waived</p>
          <p className="text-lg font-semibold tnum">{fmtNu(sum('Waived'))}</p>
          <p className="text-xs text-muted">{count('Waived')} {count('Waived') === 1 ? 'farmer' : 'farmers'}</p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'Unpaid', label: 'Awaiting payment', count: count('Unpaid') },
          { id: 'Paid', label: 'Paid', count: count('Paid') },
          { id: 'Waived', label: 'Waived', count: count('Waived') },
          { id: 'All', label: 'All', count: payouts.length },
        ]}
      />
      <div className="mt-4">
        {rows.length === 0 && tab === 'Unpaid' ? (
          <EmptyState icon={Wallet} title="Everyone has been paid" text="New payouts appear here when you approve a settlement." />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(p) => p.id}
            pageSize={10}
            searchPlaceholder="Search farmer, consignment or reference"
            searchText={(p) => `${L.member(p.memberId)} ${p.consignmentId} ${p.reference ?? ''}`}
          />
        )}
      </div>

      {recording && <RecordModal payout={recording} onClose={() => setRecording(null)} />}
      {waiving && <WaiveModal payout={waiving} onClose={() => setWaiving(null)} />}
    </>
  )
}
