import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, FormGrid, Input, Select } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Buyer } from '../data/types'
import { fmtKg } from '../lib/format'
import { useStore } from '../store/DataStore'

function BuyerForm({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<Buyer['type']>('Retailer')
  const [location, setLocation] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('+975 ')
  const [error, setError] = useState('')

  const save = () => {
    if (!name.trim() || !location.trim()) return setError('Enter the buyer’s name and location.')
    store.addBuyer({ name: name.trim(), type, location: location.trim(), contact: contact.trim(), phone: phone.trim() })
    store.toast(`${name.trim()} added.`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add buyer"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add buyer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Business name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <FormGrid>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as Buyer['type'])}>
              {['Market', 'Hotel', 'Wholesaler', 'Retailer', 'Institution'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Contact person">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
        </FormGrid>
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Buyers() {
  const { buyers, consignments, orders } = useStore()
  const [adding, setAdding] = useState(false)

  const deliveredKg = (id: string) =>
    consignments.flatMap((c) => c.destinations).filter((d) => d.buyerId === id).reduce((s, d) => s + (d.acceptedKg ?? 0), 0)

  const columns: Column<Buyer>[] = [
    {
      key: 'name',
      header: 'Buyer',
      sortValue: (b) => b.name,
      render: (b) => (
        <span>
          <span className="block font-medium">{b.name}</span>
          <span className="block text-xs text-muted sm:hidden">{b.location}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Type', hideBelow: 'md', render: (b) => <Badge tone="neutral" dot={false}>{b.type}</Badge> },
    { key: 'location', header: 'Location', hideBelow: 'sm', render: (b) => b.location },
    { key: 'contact', header: 'Contact', hideBelow: 'lg', render: (b) => (<span><span className="block">{b.contact || '—'}</span><span className="block text-xs text-muted tnum">{b.phone}</span></span>) },
    { key: 'orders', header: 'Open orders', align: 'right', hideBelow: 'md', render: (b) => orders.filter((o) => o.buyerId === b.id && ['Draft', 'Awaiting buyer', 'Confirmed'].includes(o.confirmation)).length },
    { key: 'kg', header: 'Accepted to date', align: 'right', sortValue: (b) => deliveredKg(b.id), render: (b) => fmtKg(deliveredKg(b.id)) },
  ]

  return (
    <>
      <PageHeader
        title="Buyers"
        description="Markets, hotels and traders who purchase pooled produce."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add buyer</Button>}
      />
      <DataTable
        columns={columns}
        rows={buyers}
        rowKey={(b) => b.id}
        pageSize={10}
        searchPlaceholder="Search buyers"
        searchText={(b) => `${b.name} ${b.location} ${b.contact} ${b.type}`}
      />
      {adding && <BuyerForm onClose={() => setAdding(false)} />}
    </>
  )
}
