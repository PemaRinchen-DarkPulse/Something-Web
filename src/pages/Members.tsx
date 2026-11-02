import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../components/ui/Badge'
import { Detail, DetailGrid, PageHeader, Section } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, FormGrid, Input, Select } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { ConsentStatus, Member } from '../data/types'
import { fmtDate, fmtKg, fmtNu } from '../lib/format'
import { COLLECTED, useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

function useContribution() {
  const { consignments } = useStore()
  const kgOf = (memberId: string) =>
    consignments
      .filter((c) => COLLECTED.includes(c.status))
      .reduce((s, c) => s + (c.items.find((i) => i.memberId === memberId)?.kg ?? 0), 0)
  return kgOf
}

function MemberForm({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const villages = [...new Set(store.members.map((m) => m.village))].sort()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+975 ')
  const [village, setVillage] = useState(villages[0] ?? '')
  const [consent, setConsent] = useState<ConsentStatus>('Pending')
  const [error, setError] = useState('')

  const save = () => {
    if (!name.trim()) return setError('Enter the farmer’s name.')
    if (!/^\+975\s?\d{8}$/.test(phone.trim())) return setError('Use a Bhutan mobile number like +975 17123456.')
    if (store.members.some((m) => m.phone.replace(/\s/g, '') === phone.replace(/\s/g, ''))) return setError('A member with this phone number already exists.')
    store.addMember({ name: name.trim(), phone: phone.trim(), village, status: 'Active', smsConsent: consent })
    store.toast(`${name.trim()} added to the group.`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add member"
      description="SMS consent decides whether this farmer receives pledge requests."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add member</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <FormGrid>
          <Field label="Phone number">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Village">
            <Input list="villages" value={village} onChange={(e) => setVillage(e.target.value)} />
            <datalist id="villages">
              {villages.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
        </FormGrid>
        <Field label="SMS consent" hint="Choose Granted only if the farmer has agreed to receive SMS from the group.">
          <Select value={consent} onChange={(e) => setConsent(e.target.value as ConsentStatus)}>
            <option>Pending</option>
            <option>Granted</option>
            <option>Declined</option>
          </Select>
        </Field>
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

function MemberDetail({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const store = useStore()
  const L = useLookups()
  const kgOf = useContribution()
  const m = store.members.find((x) => x.id === memberId)
  if (!m) return null

  const history = store.consignments
    .filter((c) => c.items.some((i) => i.memberId === m.id))
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))
  const earned = store.payouts.filter((p) => p.memberId === m.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const owed = store.payouts.filter((p) => p.memberId === m.id && p.status === 'Unpaid').reduce((s, p) => s + p.amount, 0)

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={m.name}
      description={`${m.village} · joined ${fmtDate(m.joined)}`}
      footer={
        <>
          <Button
            variant={m.status === 'Active' ? 'danger' : 'secondary'}
            onClick={() => {
              store.updateMember(m.id, { status: m.status === 'Active' ? 'Inactive' : 'Active' })
              store.toast(`${m.name} is now ${m.status === 'Active' ? 'inactive' : 'active'}.`)
            }}
          >
            {m.status === 'Active' ? 'Mark inactive' : 'Mark active'}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <DetailGrid>
        <Detail label="Phone">{m.phone}</Detail>
        <Detail label="Status"><StatusBadge status={m.status} /></Detail>
        <Detail label="SMS consent"><StatusBadge status={m.smsConsent} /></Detail>
        <Detail label="Total contributed">{fmtKg(kgOf(m.id))}</Detail>
        <Detail label="Paid so far">{fmtNu(earned)}</Detail>
        <Detail label="Waiting to be paid">{fmtNu(owed)}</Detail>
      </DetailGrid>

      <div className="mt-6">
        <Section title="Consignment history">
          {history.length === 0 ? (
            <p className="text-[13px] text-muted">No consignments yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {history.map((c) => {
                const kg = c.items.find((i) => i.memberId === m.id)?.kg ?? 0
                const payout = store.payouts.find((p) => p.consignmentId === c.id && p.memberId === m.id)
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-[13px]">
                    <span>
                      <span className="font-medium">{c.id}</span>
                      <span className="ml-2 text-muted">{L.product(c.productId)} · {fmtDate(c.collectionDate)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="tnum">{fmtKg(kg)}</span>
                      {payout && <span className="tnum text-muted">{fmtNu(payout.amount)}</span>}
                      <StatusBadge status={payout ? payout.status : c.status} />
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>
    </Modal>
  )
}

export default function Members() {
  const { members } = useStore()
  const kgOf = useContribution()
  const [params] = useSearchParams()
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [status, setStatus] = useState('All')
  const [consent, setConsent] = useState('All')
  const [village, setVillage] = useState('All')

  const villages = [...new Set(members.map((m) => m.village))].sort()
  const rows = members.filter(
    (m) => (status === 'All' || m.status === status) && (consent === 'All' || m.smsConsent === consent) && (village === 'All' || m.village === village),
  )

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Farmer',
      sortValue: (m) => m.name,
      render: (m) => (
        <span>
          <span className="block font-medium">{m.name}</span>
          <span className="block text-xs text-muted sm:hidden">{m.village}</span>
        </span>
      ),
    },
    { key: 'phone', header: 'Phone', hideBelow: 'md', render: (m) => <span className="tnum">{m.phone}</span> },
    { key: 'village', header: 'Village', hideBelow: 'sm', sortValue: (m) => m.village, render: (m) => m.village },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'consent', header: 'SMS consent', hideBelow: 'md', render: (m) => <StatusBadge status={m.smsConsent} /> },
    { key: 'kg', header: 'Contributed', align: 'right', sortValue: (m) => kgOf(m.id), render: (m) => fmtKg(kgOf(m.id)) },
  ]

  return (
    <>
      <PageHeader
        title="Members"
        description="Farmers in your group, their SMS consent and how much they have contributed."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add member</Button>}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(m) => m.id}
        pageSize={10}
        defaultQuery={params.get('q') ?? ''}
        onRowClick={(m) => setOpenId(m.id)}
        searchPlaceholder="Search name, phone or village"
        searchText={(m) => `${m.name} ${m.phone} ${m.village}`}
        toolbar={
          <>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="w-32">
              <option value="All">All status</option>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
            <Select value={consent} onChange={(e) => setConsent(e.target.value)} aria-label="SMS consent" className="w-36">
              <option value="All">All consent</option>
              <option>Granted</option>
              <option>Pending</option>
              <option>Declined</option>
            </Select>
            <Select value={village} onChange={(e) => setVillage(e.target.value)} aria-label="Village" className="w-36">
              <option value="All">All villages</option>
              {villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </>
        }
      />
      {adding && <MemberForm onClose={() => setAdding(false)} />}
      {openId && <MemberDetail memberId={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
