import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, FormGrid, Input } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Consignment, Driver } from '../data/types'
import { fmtDate, fmtKg } from '../lib/format'
import { useStore } from '../store/DataStore'

function DriverForm({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+975 ')
  const [vehicle, setVehicle] = useState('')
  const [capacity, setCapacity] = useState('')
  const [error, setError] = useState('')

  const save = () => {
    if (!name.trim() || !vehicle.trim()) return setError('Enter the driver’s name and vehicle number.')
    if (!(Number(capacity) > 0)) return setError('Enter the vehicle capacity in kg.')
    store.addDriver({ name: name.trim(), phone: phone.trim(), vehicle: vehicle.trim().toUpperCase(), capacityKg: Number(capacity), status: 'Available' })
    store.toast(`${name.trim()} added as a driver.`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add driver"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Add driver</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <FormGrid>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Vehicle number" hint="e.g. BP-1-A2345">
            <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="uppercase" />
          </Field>
          <Field label="Capacity (kg)">
            <Input type="number" min={1} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
        </FormGrid>
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Drivers() {
  const { drivers, consignments, confirmDriver, toast } = useStore()
  const [adding, setAdding] = useState(false)

  const bookings = (d: Driver): Consignment[] =>
    consignments.filter((c) => c.driverId === d.id && ['Draft', 'Planned', 'Dispatched'].includes(c.status))

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      sortValue: (d) => d.name,
      render: (d) => (
        <span>
          <span className="block font-medium">{d.name}</span>
          <span className="block text-xs text-muted tnum">{d.phone}</span>
        </span>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (d) => d.vehicle },
    { key: 'cap', header: 'Capacity', align: 'right', hideBelow: 'sm', render: (d) => fmtKg(d.capacityKg) },
    { key: 'status', header: 'Status', hideBelow: 'sm', render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'bookings',
      header: 'Upcoming bookings',
      render: (d) => {
        const list = bookings(d)
        if (list.length === 0) return <span className="text-muted">None</span>
        return (
          <ul className="space-y-1.5">
            {list.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                <Link to={`/consignments/${c.id}`} className="font-medium text-primary hover:underline">{c.id}</Link>
                <span className="text-muted">{fmtDate(c.collectionDate)}</span>
                {c.status === 'Planned' && !c.driverConfirmed ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      confirmDriver(c.id)
                      toast(`${d.name}’s booking for ${c.id} recorded as confirmed.`)
                    }}
                  >
                    Record confirmation
                  </Button>
                ) : (
                  c.status === 'Planned' && <span className="text-xs text-success">Confirmed</span>
                )}
              </li>
            ))}
          </ul>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Transporters you book for collections. A booking must be confirmed before the truck is dispatched."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setAdding(true)}>Add driver</Button>}
      />
      <DataTable
        columns={columns}
        rows={drivers}
        rowKey={(d) => d.id}
        pageSize={10}
        searchPlaceholder="Search drivers"
        searchText={(d) => `${d.name} ${d.vehicle} ${d.phone}`}
      />
      {adding && <DriverForm onClose={() => setAdding(false)} />}
    </>
  )
}
