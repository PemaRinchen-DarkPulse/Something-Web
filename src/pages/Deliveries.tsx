import { Camera, ImageIcon, PackageCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/ui/Badge'
import { Detail, DetailGrid, EmptyState, Notice, PageHeader, Tabs } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, Input, Textarea } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Consignment, Destination } from '../data/types'
import { fmtDate, fmtDateTime, fmtKg } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

interface Row {
  c: Consignment
  d: Destination
  status: string
}

function deliveryStatus(c: Consignment, d: Destination): string {
  if (d.confirmation === 'Confirmed') return 'Confirmed'
  if (d.confirmation === 'Disputed') return 'Disputed'
  return c.status === 'Dispatched' ? 'In transit' : 'Awaiting dispatch'
}

function PhotoTile({ src, label }: { src: string; label: string }) {
  if (src.startsWith('blob:')) {
    return <img src={src} alt={label} className="size-20 rounded-md border border-line object-cover" />
  }
  return (
    <div className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-line bg-subtle text-muted" title="Sample photo (demo data)">
      <ImageIcon size={18} />
      <span className="text-[10px]">{label}</span>
    </div>
  )
}

function DeliveryModal({ row, onClose }: { row: Row; onClose: () => void }) {
  const store = useStore()
  const L = useLookups()
  const { c, d } = row
  const pending = d.confirmation === 'Pending'
  const [accepted, setAccepted] = useState(String(d.acceptedKg ?? d.plannedKg))
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [resolution, setResolution] = useState('')
  const [error, setError] = useState('')

  const acceptedNum = Number(accepted)
  const rejected = Math.max(d.plannedKg - (Number.isFinite(acceptedNum) ? acceptedNum : 0), 0)

  const save = () => {
    if (!Number.isFinite(acceptedNum) || acceptedNum < 0 || acceptedNum > d.plannedKg) {
      return setError(`Accepted weight must be between 0 and ${fmtKg(d.plannedKg)}.`)
    }
    store.confirmDelivery(c.id, d.id, { acceptedKg: acceptedNum, note: note || undefined, photos })
    store.toast(rejected > 0 ? 'Delivery recorded with rejected produce. It is marked as disputed.' : 'Delivery confirmed.', rejected > 0 ? 'info' : 'success')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={pending ? 'Confirm delivery' : 'Delivery details'}
      description={`${c.id} · ${L.buyer(d.buyerId)}`}
      footer={
        pending ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>{rejected > 0 ? 'Record with rejection' : 'Confirm delivery'}</Button>
          </>
        ) : d.confirmation === 'Disputed' ? (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button
              variant="primary"
              disabled={!resolution.trim()}
              onClick={() => {
                store.resolveDispute(c.id, d.id, resolution.trim())
                store.toast('Dispute marked as resolved.')
                onClose()
              }}
            >
              Mark resolved
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="space-y-5">
        <DetailGrid>
          <Detail label="Product">{L.product(c.productId)}, grade {c.grade}</Detail>
          <Detail label="Planned">{fmtKg(d.plannedKg)}</Detail>
          <Detail label="Accepted">{d.acceptedKg === undefined ? '—' : fmtKg(d.acceptedKg)}</Detail>
          <Detail label="Rejected">{d.rejectedKg === undefined ? '—' : fmtKg(d.rejectedKg)}</Detail>
        </DetailGrid>

        {pending ? (
          <>
            <Field label="Accepted by buyer (kg)" hint={rejected > 0 ? `${fmtKg(rejected)} will be recorded as rejected and the delivery marked disputed.` : 'Enter less than the planned weight if the buyer rejected part of the load.'}>
              <Input type="number" min={0} max={d.plannedKg} inputMode="numeric" value={accepted} onChange={(e) => setAccepted(e.target.value)} />
            </Field>
            <Field label="Note" hint="Why was produce rejected, or anything the buyer said.">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium">Delivery photos</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <PhotoTile key={p} src={p} label={`Photo ${i + 1}`} />
                ))}
                <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-muted hover:bg-subtle">
                  <Camera size={18} />
                  <span className="text-[11px]">Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? [])
                      setPhotos((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-muted">Photos stay in this browser tab for now. Uploading to storage comes with the backend.</p>
            </div>
          </>
        ) : (
          <>
            {d.note && <Notice tone={d.confirmation === 'Disputed' ? 'warning' : 'info'}>{d.note}</Notice>}
            <div>
              <p className="mb-1.5 text-[13px] font-medium">Photos ({d.photos.length})</p>
              {d.photos.length === 0 ? (
                <p className="text-[13px] text-muted">No photos were added.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {d.photos.map((p, i) => (
                    <PhotoTile key={p} src={p} label={`Photo ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted">Confirmed {fmtDateTime(d.confirmedAt)}</p>
            {d.confirmation === 'Disputed' && (
              <Field label="How was the dispute resolved?" hint="Resolving it lets the settlement be approved. Adjust transport or fees on the settlement if needed.">
                <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="e.g. Buyer accepted the remaining crates at a lower grade." />
              </Field>
            )}
          </>
        )}
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Deliveries() {
  const { consignments } = useStore()
  const L = useLookups()
  const [tab, setTab] = useState<'attention' | 'confirmed' | 'upcoming' | 'all'>('attention')
  const [open, setOpen] = useState<Row | null>(null)

  const all: Row[] = consignments
    .filter((c) => !['Draft', 'Cancelled'].includes(c.status))
    .flatMap((c) => c.destinations.map((d) => ({ c, d, status: deliveryStatus(c, d) })))
    .sort((a, b) => b.c.collectionDate.localeCompare(a.c.collectionDate))

  const attention = all.filter((r) => r.status === 'In transit' || r.status === 'Disputed')
  const confirmed = all.filter((r) => r.status === 'Confirmed')
  const upcoming = all.filter((r) => r.status === 'Awaiting dispatch')
  const rows = { attention, confirmed, upcoming, all }[tab]

  // The open modal should reflect store updates, so look the row up again.
  const live = open ? all.find((r) => r.d.id === open.d.id) : undefined

  const columns: Column<Row>[] = [
    { key: 'c', header: 'Consignment', render: (r) => <Link to={`/consignments/${r.c.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline">{r.c.id}</Link> },
    {
      key: 'buyer',
      header: 'Destination',
      render: (r) => (
        <span>
          <span className="block font-medium">{L.buyer(r.d.buyerId)}</span>
          <span className="block text-xs text-muted">{fmtDate(r.c.collectionDate)} · {L.product(r.c.productId)}</span>
        </span>
      ),
    },
    { key: 'planned', header: 'Planned', align: 'right', hideBelow: 'sm', render: (r) => fmtKg(r.d.plannedKg) },
    { key: 'acc', header: 'Accepted', align: 'right', hideBelow: 'md', render: (r) => (r.d.acceptedKg === undefined ? '—' : fmtKg(r.d.acceptedKg)) },
    { key: 'rej', header: 'Rejected', align: 'right', hideBelow: 'md', render: (r) => (r.d.rejectedKg === undefined ? '—' : r.d.rejectedKg > 0 ? <span className="text-danger">{fmtKg(r.d.rejectedKg)}</span> : fmtKg(0)) },
    { key: 'photos', header: 'Photos', align: 'right', hideBelow: 'lg', render: (r) => <span className="inline-flex items-center gap-1 text-muted"><ImageIcon size={14} />{r.d.photos.length}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (r) =>
        r.status === 'In transit' ? (
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); setOpen(r) }}>Confirm</Button>
        ) : r.status === 'Disputed' ? (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); setOpen(r) }}>Resolve</Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Deliveries"
        description="Record what each buyer accepted and rejected. Settlements are built from these numbers."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'attention', label: 'Needs action', count: attention.length },
          { id: 'confirmed', label: 'Confirmed', count: confirmed.length },
          { id: 'upcoming', label: 'Not dispatched', count: upcoming.length },
          { id: 'all', label: 'All', count: all.length },
        ]}
      />
      <div className="mt-4">
        {rows.length === 0 && tab === 'attention' ? (
          <EmptyState icon={PackageCheck} title="No deliveries need action" text="Deliveries show up here once a truck is dispatched." />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.d.id}
            pageSize={10}
            onRowClick={(r) => setOpen(r)}
            searchPlaceholder="Search buyer or consignment"
            searchText={(r) => `${r.c.id} ${L.buyer(r.d.buyerId)} ${L.product(r.c.productId)}`}
          />
        )}
      </div>
      {live && <DeliveryModal key={live.d.id + live.d.confirmation} row={live} onClose={() => setOpen(null)} />}
    </>
  )
}
