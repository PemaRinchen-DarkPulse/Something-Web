import { Copy, ExternalLink, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from '../components/ui/Badge'
import { PageHeader, Notice } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Field, FormGrid, Input, Select, Textarea } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Order, OrderConfirmation } from '../data/types'
import { fmtDate, fmtKg, fmtNu, isoDate } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

const confirmUrl = (token: string) => `${window.location.origin}/confirm/${token}`

function OrderForm({ order, onClose }: { order?: Order; onClose: () => void }) {
  const store = useStore()
  const L = useLookups()
  const products = store.products.filter((p) => p.active)
  const [buyerId, setBuyerId] = useState(order?.buyerId ?? store.buyers[0]?.id ?? '')
  const [productId, setProductId] = useState(order?.productId ?? products[0]?.id ?? '')
  const [grade, setGrade] = useState(order?.grade ?? 'A')
  const [kg, setKg] = useState(String(order?.kg ?? ''))
  const [price, setPrice] = useState(String(order?.pricePerKg ?? ''))
  const [date, setDate] = useState(order?.deliveryDate ?? isoDate(7))
  const [note, setNote] = useState(order?.note ?? '')
  const [error, setError] = useState('')

  const copy = async () => {
    if (!order) return
    try {
      await navigator.clipboard.writeText(confirmUrl(order.token))
      store.toast('Buyer link copied.')
    } catch {
      store.toast('Could not copy. Select the link and copy it by hand.', 'danger')
    }
  }

  const save = () => {
    if (!(Number(kg) > 0) || !(Number(price) > 0)) return setError('Enter a quantity and a price per kg.')
    store.saveOrder({
      id: order?.id,
      buyerId,
      productId,
      grade,
      kg: Number(kg),
      pricePerKg: Number(price),
      deliveryDate: date,
      note: note || undefined,
    })
    store.toast(order ? `${order.id} updated.` : 'Order saved as a draft.')
    onClose()
  }

  const product = products.find((p) => p.id === productId)

  return (
    <Modal
      open
      size="md"
      onClose={onClose}
      title={order ? `Edit ${order.id}` : 'New buyer order'}
      description={order ? `${L.buyer(order.buyerId)}` : 'Orders start as drafts. Send them to the buyer to confirm.'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          {order?.confirmation === 'Draft' && (
            <Button
              onClick={() => {
                store.setOrderConfirmation(order.id, 'Awaiting buyer')
                store.toast('Marked as sent to buyer. Share the link with them.', 'info')
                onClose()
              }}
            >
              Mark as sent to buyer
            </Button>
          )}
          <Button variant="primary" onClick={save}>Save order</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="Buyer">
            <Select value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
              {store.buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Delivery date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <Field label="Quantity (kg)">
            <Input type="number" min={1} inputMode="numeric" value={kg} onChange={(e) => setKg(e.target.value)} />
          </Field>
          <Field label="Price per kg (Nu.)">
            <Input type="number" min={1} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Note for the team" hint="Not shown to the buyer.">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {order && (
          <div className="border-t border-line pt-4">
            <p className="mb-1.5 text-[13px] font-medium">Buyer confirmation link</p>
            <div className="flex gap-2">
              <Input readOnly value={confirmUrl(order.token)} onFocus={(e) => e.currentTarget.select()} />
              <Button icon={<Copy size={15} />} onClick={copy} aria-label="Copy link" />
              <a
                href={`/confirm/${order.token}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open buyer page"
                className="inline-flex min-h-11 items-center rounded-md border border-line-strong px-3 text-muted hover:bg-subtle hover:text-ink md:min-h-9"
              >
                <ExternalLink size={15} />
              </a>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Demo mode: the link only works in this browser tab because orders are not stored on a server yet.
            </p>
          </div>
        )}
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Orders() {
  const { orders, toast } = useStore()
  const L = useLookups()
  const [editing, setEditing] = useState<Order | 'new' | null>(null)
  const [status, setStatus] = useState<'All' | OrderConfirmation>('All')

  const rows = orders.filter((o) => status === 'All' || o.confirmation === status)
  const confirmedKg = orders.filter((o) => o.confirmation === 'Confirmed').reduce((s, o) => s + o.kg, 0)
  const confirmedValue = orders.filter((o) => o.confirmation === 'Confirmed').reduce((s, o) => s + o.kg * o.pricePerKg, 0)

  const copyLink = async (o: Order) => {
    try {
      await navigator.clipboard.writeText(confirmUrl(o.token))
      toast(`Link for ${o.id} copied.`)
    } catch {
      toast('Could not copy the link.', 'danger')
    }
  }

  const columns: Column<Order>[] = [
    { key: 'id', header: 'Order', sortValue: (o) => o.id, render: (o) => <span className="font-medium">{o.id}</span> },
    { key: 'buyer', header: 'Buyer', render: (o) => L.buyer(o.buyerId) },
    { key: 'product', header: 'Product', render: (o) => `${L.product(o.productId)} · ${o.grade}` },
    { key: 'kg', header: 'Quantity', align: 'right', sortValue: (o) => o.kg, render: (o) => fmtKg(o.kg) },
    { key: 'price', header: 'Price / kg', align: 'right', hideBelow: 'md', render: (o) => fmtNu(o.pricePerKg) },
    { key: 'value', header: 'Value', align: 'right', hideBelow: 'lg', sortValue: (o) => o.kg * o.pricePerKg, render: (o) => fmtNu(o.kg * o.pricePerKg) },
    { key: 'date', header: 'Delivery', hideBelow: 'lg', sortValue: (o) => o.deliveryDate, render: (o) => fmtDate(o.deliveryDate) },
    { key: 'status', header: 'Buyer confirmation', render: (o) => <StatusBadge status={o.confirmation} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <span className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" aria-label={`Copy link for ${o.id}`} icon={<Copy size={15} />} onClick={(e) => { e.stopPropagation(); copyLink(o) }} />
          <Button size="sm" variant="ghost" aria-label={`Edit ${o.id}`} icon={<Pencil size={15} />} onClick={(e) => { e.stopPropagation(); setEditing(o) }} />
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        description="What buyers want, at what price. Confirmed orders tell you how much to collect."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>New order</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line pb-4 sm:max-w-xl sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Confirmed demand</p>
          <p className="text-lg font-semibold tnum">{fmtKg(confirmedKg)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Confirmed value</p>
          <p className="text-lg font-semibold tnum">{fmtNu(confirmedValue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Waiting for buyers</p>
          <p className="text-lg font-semibold tnum">{orders.filter((o) => o.confirmation === 'Awaiting buyer').length}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        pageSize={8}
        onRowClick={(o) => setEditing(o)}
        searchPlaceholder="Search orders"
        searchText={(o) => `${o.id} ${L.buyer(o.buyerId)} ${L.product(o.productId)}`}
        toolbar={
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by confirmation" className="w-48">
            <option>All</option>
            <option>Draft</option>
            <option>Awaiting buyer</option>
            <option>Confirmed</option>
            <option>Declined</option>
          </Select>
        }
      />
      <div className="mt-4">
        <Notice>Buyers confirm through a shareable link, so they do not need an account. Use the copy icon on any row to get it.</Notice>
      </div>

      {editing && <OrderForm order={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
