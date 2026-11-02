import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Field, FormGrid, Input, Select } from '../../components/ui/Fields'
import { Modal } from '../../components/ui/Modal'
import { fmtKg, isoDate } from '../../lib/format'
import { useLookups } from '../../lib/lookups'
import { useStore } from '../../store/DataStore'

interface DestRow {
  buyerId: string
  kg: string
  price: string
}

export function ConsignmentForm({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const store = useStore()
  const L = useLookups()
  const products = store.products.filter((p) => p.active)
  const members = store.members.filter((m) => m.status === 'Active')

  const [date, setDate] = useState(isoDate(7))
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [grade, setGrade] = useState('A')
  const [driverId, setDriverId] = useState('')
  const [transport, setTransport] = useState('')
  const [kgByMember, setKgByMember] = useState<Record<string, string>>({})
  const [dests, setDests] = useState<DestRow[]>([{ buyerId: store.buyers[0]?.id ?? '', kg: '', price: '' }])
  const [error, setError] = useState('')

  const product = products.find((p) => p.id === productId)
  const farmerTotal = Object.values(kgByMember).reduce((s, v) => s + (Number(v) || 0), 0)
  const destTotal = dests.reduce((s, d) => s + (Number(d.kg) || 0), 0)

  const setDest = (i: number, patch: Partial<DestRow>) => setDests((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const submit = () => {
    const items = Object.entries(kgByMember)
      .map(([memberId, v]) => ({ memberId, kg: Number(v) || 0 }))
      .filter((i) => i.kg > 0)
    if (!date) return setError('Choose a collection date.')
    if (items.length === 0) return setError('Add at least one farmer with a quantity.')
    if (dests.some((d) => !d.buyerId || !(Number(d.kg) > 0) || !(Number(d.price) > 0))) {
      return setError('Every destination needs a buyer, a quantity and a price per kg.')
    }
    if (destTotal !== farmerTotal) {
      return setError(`Destinations total ${fmtKg(destTotal)} but farmers contribute ${fmtKg(farmerTotal)}. They must match.`)
    }
    const id = store.addConsignment({
      collectionDate: date,
      productId,
      grade,
      driverId: driverId || undefined,
      items,
      destinations: dests.map((d) => ({ buyerId: d.buyerId, plannedKg: Number(d.kg), pricePerKg: Number(d.price) })),
      transportCost: Number(transport) || 0,
    })
    store.toast(`${id} created as a draft.`)
    onCreated(id)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New consignment"
      description="Pool produce from several farmers into one truck. It starts as a draft."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create draft</Button>
        </>
      }
    >
      <div className="space-y-6">
        <FormGrid>
          <Field label="Collection date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Driver" hint="You can assign one later.">
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Not assigned yet</option>
              {store.drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.vehicle}</option>
              ))}
            </Select>
          </Field>
          <Field label="Product">
            <Select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setGrade(products.find((p) => p.id === e.target.value)?.grades[0] ?? 'A')
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {(product?.grades ?? ['A']).map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label="Transport cost (Nu.)" hint="Shared between farmers by weight at settlement.">
            <Input type="number" min={0} inputMode="numeric" value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="0" />
          </Field>
        </FormGrid>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-sm font-semibold">Farmers and produce</h3>
            <span className="text-xs text-muted">Total <span className="font-medium text-ink tnum">{fmtKg(farmerTotal)}</span></span>
          </div>
          <ul className="max-h-60 divide-y divide-line overflow-y-auto rounded-md border border-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{m.name}</span>
                  <span className="block text-xs text-muted">{m.village}</span>
                </span>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label={`Kg from ${m.name}`}
                  placeholder="kg"
                  className="w-24 text-right"
                  value={kgByMember[m.id] ?? ''}
                  onChange={(e) => setKgByMember((k) => ({ ...k, [m.id]: e.target.value }))}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-sm font-semibold">Delivery destinations</h3>
            <span className="text-xs text-muted">Total <span className="font-medium text-ink tnum">{fmtKg(destTotal)}</span></span>
          </div>
          <div className="space-y-3">
            {dests.map((d, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-line p-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                <Field label="Buyer" className="col-span-2 sm:col-span-1">
                  <Select value={d.buyerId} onChange={(e) => setDest(i, { buyerId: e.target.value })}>
                    {store.buyers.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Kg">
                  <Input type="number" min={0} inputMode="numeric" value={d.kg} onChange={(e) => setDest(i, { kg: e.target.value })} />
                </Field>
                <Field label="Price / kg (Nu.)">
                  <Input type="number" min={0} inputMode="decimal" value={d.price} onChange={(e) => setDest(i, { price: e.target.value })} />
                </Field>
                <Button
                  variant="ghost"
                  aria-label="Remove destination"
                  disabled={dests.length === 1}
                  onClick={() => setDests((rows) => rows.filter((_, idx) => idx !== i))}
                  icon={<Trash2 size={16} />}
                  className="self-end"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={<Plus size={15} />} onClick={() => setDests((r) => [...r, { buyerId: store.buyers[0]?.id ?? '', kg: '', price: '' }])}>
              Add destination
            </Button>
            {farmerTotal > 0 && destTotal !== farmerTotal && dests.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDest(dests.length - 1, { kg: String(Math.max(0, farmerTotal - (destTotal - (Number(dests[dests.length - 1].kg) || 0)))) })}
              >
                Give the remainder to the last destination
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            Price per kg is what that buyer pays for accepted {L.product(productId).toLowerCase()}. Destination weights must add up to the farmers’ total.
          </p>
        </div>

        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
