import { Check, ChevronLeft, Package, Truck, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { Detail, DetailGrid, EmptyState, Notice, Section } from '../../components/ui/Blocks'
import { Button, LinkButton } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { Field, Select } from '../../components/ui/Fields'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { LIFECYCLE } from '../../data/types'
import type { Destination, Member } from '../../data/types'
import { fmtDate, fmtDateTime, fmtKg, fmtNu, fmtPct } from '../../lib/format'
import { acceptedKg, totalKg, useLookups } from '../../lib/lookups'
import { useStore } from '../../store/DataStore'

export default function ConsignmentDetail() {
  const { id } = useParams()
  const store = useStore()
  const L = useLookups()
  const c = store.consignments.find((x) => x.id === id)
  const [driverModal, setDriverModal] = useState(false)
  const [driverChoice, setDriverChoice] = useState('')
  const [confirm, setConfirm] = useState<'plan' | 'dispatch' | 'cancel' | 'driver' | null>(null)

  if (!c) {
    return (
      <EmptyState
        icon={Package}
        title="Consignment not found"
        text={`There is no consignment called ${id}.`}
        action={<LinkButton to="/consignments">Back to consignments</LinkButton>}
      />
    )
  }

  const total = totalKg(c)
  const driver = store.drivers.find((d) => d.id === c.driverId)
  const stepIndex = LIFECYCLE.indexOf(c.status)
  const hasSettlement = store.settlements.some((s) => s.consignmentId === c.id)
  const canCancel = ['Draft', 'Planned', 'Dispatched'].includes(c.status)

  const farmerCols: Column<{ memberId: string; kg: number }>[] = [
    { key: 'name', header: 'Farmer', render: (r) => <span className="font-medium">{L.member(r.memberId)}</span> },
    { key: 'village', header: 'Village', hideBelow: 'sm', render: (r) => store.members.find((m: Member) => m.id === r.memberId)?.village ?? '—' },
    { key: 'kg', header: 'Dispatched', align: 'right', render: (r) => fmtKg(r.kg) },
    { key: 'share', header: 'Share', align: 'right', hideBelow: 'sm', render: (r) => fmtPct((r.kg / total) * 100) },
  ]

  const destCols: Column<Destination>[] = [
    {
      key: 'buyer',
      header: 'Buyer',
      render: (d) => (
        <span>
          <span className="block font-medium">{L.buyer(d.buyerId)}</span>
          <span className="block text-xs text-muted">{store.buyers.find((b) => b.id === d.buyerId)?.location}</span>
        </span>
      ),
    },
    { key: 'planned', header: 'Planned', align: 'right', render: (d) => fmtKg(d.plannedKg) },
    { key: 'price', header: 'Price / kg', align: 'right', hideBelow: 'sm', render: (d) => fmtNu(d.pricePerKg) },
    { key: 'accepted', header: 'Accepted', align: 'right', hideBelow: 'md', render: (d) => (d.acceptedKg === undefined ? '—' : fmtKg(d.acceptedKg)) },
    { key: 'rejected', header: 'Rejected', align: 'right', hideBelow: 'md', render: (d) => (d.rejectedKg === undefined ? '—' : fmtKg(d.rejectedKg)) },
    { key: 'status', header: 'Buyer confirmation', render: (d) => <StatusBadge status={d.confirmation} /> },
  ]

  return (
    <>
      <Link to="/consignments" className="mb-4 inline-flex min-h-10 items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ChevronLeft size={16} /> All consignments
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{c.id}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {L.product(c.productId)}, grade {c.grade} · collected {fmtDate(c.collectionDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {c.status === 'Draft' && (
            <Button variant="primary" disabled={!c.driverId} onClick={() => setConfirm('plan')} title={c.driverId ? '' : 'Assign a driver first'}>
              Mark as planned
            </Button>
          )}
          {c.status === 'Planned' && !c.driverConfirmed && (
            <Button variant="primary" icon={<UserCheck size={16} />} onClick={() => setConfirm('driver')}>
              Record driver confirmation
            </Button>
          )}
          {c.status === 'Planned' && c.driverConfirmed && (
            <Button variant="primary" icon={<Truck size={16} />} onClick={() => setConfirm('dispatch')}>
              Mark dispatched
            </Button>
          )}
          {c.status === 'Dispatched' && <LinkButton to="/deliveries" variant="primary">Record deliveries</LinkButton>}
          {hasSettlement && <LinkButton to={`/settlements/${c.id}`} variant={c.status === 'Delivered' ? 'primary' : 'secondary'}>{c.status === 'Delivered' ? 'Review settlement' : 'View settlement'}</LinkButton>}
          {['Draft', 'Planned'].includes(c.status) && <Button onClick={() => { setDriverChoice(c.driverId ?? ''); setDriverModal(true) }}>{c.driverId ? 'Change driver' : 'Assign driver'}</Button>}
          {canCancel && <Button variant="danger" onClick={() => setConfirm('cancel')}>Cancel</Button>}
        </div>
      </div>

      {c.status === 'Cancelled' ? (
        <Notice tone="warning">This consignment was cancelled. {c.cancelReason}</Notice>
      ) : (
        <ol className="grid min-w-0 grid-cols-6 gap-1 overflow-x-auto" aria-label="Consignment progress">
          {LIFECYCLE.map((s, i) => {
            const done = i < stepIndex
            const current = i === stepIndex
            return (
              <li key={s} className="min-w-14">
                <div className={`h-1 rounded-full ${done || current ? 'bg-primary' : 'bg-line'}`} />
                <p className={`mt-2 flex items-center gap-1 text-[11px] sm:text-xs ${current ? 'font-semibold text-primary' : done ? 'text-ink' : 'text-muted'}`}>
                  {done && <Check size={12} />}
                  {s}
                </p>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-8 border-y border-line py-5">
        <DetailGrid>
          <Detail label="Total weight">{fmtKg(total)}</Detail>
          <Detail label="Farmers">{c.items.length}</Detail>
          <Detail label="Accepted by buyers">{c.destinations.some((d) => d.acceptedKg !== undefined) ? fmtKg(acceptedKg(c)) : 'Awaiting delivery'}</Detail>
          <Detail label="Transport cost">{c.transportCost ? fmtNu(c.transportCost) : 'Not set'}</Detail>
        </DetailGrid>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <Section title="Farmers and produce" description="What each farmer put on the truck">
            <DataTable columns={farmerCols} rows={c.items} rowKey={(r) => r.memberId} pageSize={8} />
          </Section>

          <Section title="Delivery destinations" description="One consignment can serve several buyers">
            <DataTable columns={destCols} rows={c.destinations} rowKey={(d) => d.id} pageSize={8} />
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Driver and transport">
            {driver ? (
              <dl className="space-y-3 text-sm">
                <Detail label="Driver">{driver.name}</Detail>
                <Detail label="Vehicle">{driver.vehicle} · up to {fmtKg(driver.capacityKg)}</Detail>
                <Detail label="Phone">{driver.phone}</Detail>
                <Detail label="Booking">
                  {c.driverConfirmed ? <span className="text-success">Confirmed</span> : <span className="text-warning">Waiting for the driver to confirm</span>}
                </Detail>
                <Detail label="Load vs capacity">{fmtPct((total / driver.capacityKg) * 100)} full</Detail>
              </dl>
            ) : (
              <p className="text-[13px] text-muted">No driver assigned yet.</p>
            )}
          </Section>

          <Section title="Timeline">
            <ol className="relative space-y-5 border-l border-line pl-5">
              {[...c.timeline].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[25px] top-1.5 size-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-line-strong'}`} />
                  <p className="text-[13px] font-medium">{e.label}</p>
                  <p className="text-xs text-muted">{fmtDateTime(e.at)} · {e.by}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>

      <Modal
        open={driverModal}
        size="sm"
        title={c.driverId ? 'Change driver' : 'Assign driver'}
        description="The driver must confirm the booking before dispatch."
        onClose={() => setDriverModal(false)}
        footer={
          <>
            <Button onClick={() => setDriverModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!driverChoice}
              onClick={() => {
                store.assignDriver(c.id, driverChoice)
                store.toast(`${L.driver(driverChoice)} assigned to ${c.id}.`)
                setDriverModal(false)
              }}
            >
              Assign
            </Button>
          </>
        }
      >
        <Field label="Driver">
          <Select value={driverChoice} onChange={(e) => setDriverChoice(e.target.value)}>
            <option value="">Choose a driver</option>
            {store.drivers.map((d) => (
              <option key={d.id} value={d.id} disabled={d.capacityKg < total}>
                {d.name} · {d.vehicle} · {fmtKg(d.capacityKg)}{d.capacityKg < total ? ' (too small)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirm === 'plan'}
        title="Mark as planned?"
        message="The collection is locked in and the driver is asked to confirm."
        onClose={() => setConfirm(null)}
        onConfirm={() => store.advanceConsignment(c.id, 'Planned', 'Planned and driver booked')}
      />
      <ConfirmDialog
        open={confirm === 'driver'}
        title="Record driver confirmation?"
        message={`Only do this after ${L.driver(c.driverId)} has agreed to the booking (for example by phone or SMS).`}
        onClose={() => setConfirm(null)}
        onConfirm={() => store.confirmDriver(c.id)}
      />
      <ConfirmDialog
        open={confirm === 'dispatch'}
        title="Mark as dispatched?"
        message="The truck has left the collection point. Buyers can now confirm what they receive."
        confirmLabel="Mark dispatched"
        onClose={() => setConfirm(null)}
        onConfirm={() => store.advanceConsignment(c.id, 'Dispatched', 'Dispatched from collection point')}
      />
      <ConfirmDialog
        open={confirm === 'cancel'}
        title={`Cancel ${c.id}?`}
        message="Cancelled consignments cannot be reopened. Create a new one if plans change."
        confirmLabel="Cancel consignment"
        tone="danger"
        onClose={() => setConfirm(null)}
        onConfirm={() => store.cancelConsignment(c.id, 'Cancelled by coordinator')}
      />
    </>
  )
}
