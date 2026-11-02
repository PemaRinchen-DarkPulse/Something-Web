import { CheckCircle2, Sprout, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { StatusBadge } from '../components/ui/Badge'
import { Detail, DetailGrid, Notice } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { Toaster } from '../components/ui/Toaster'
import { fmtDate, fmtKg, fmtNu } from '../lib/format'
import { useLookups } from '../lib/lookups'
import { useStore } from '../store/DataStore'

/** Public page a buyer opens from a shared link. No sign-in, no sidebar. */
export default function BuyerConfirm() {
  const { token } = useParams()
  const store = useStore()
  const L = useLookups()
  const order = store.orders.find((o) => o.token === token)

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <Sprout size={18} />
          </span>
          <p className="text-[15px] font-semibold tracking-tight">ZhingPool</p>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {!order ? (
          <div className="rounded-lg border border-line bg-surface p-6 text-center">
            <h1 className="text-lg font-semibold">Order not found</h1>
            <p className="mt-2 text-sm text-muted">
              This link is not valid, or it was opened in a different browser tab from the one that created it. In demo mode orders are not stored on a server.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Order {order.id}</p>
                <h1 className="text-xl font-semibold tracking-tight">Please confirm your order</h1>
                <p className="mt-1 text-sm text-muted">From {store.group.name}</p>
              </div>
              <StatusBadge status={order.confirmation} />
            </div>

            <div className="mt-6 border-y border-line py-5">
              <DetailGrid>
                <Detail label="Buyer">{L.buyer(order.buyerId)}</Detail>
                <Detail label="Product">{L.product(order.productId)}, grade {order.grade}</Detail>
                <Detail label="Quantity">{fmtKg(order.kg)}</Detail>
                <Detail label="Price per kg">{fmtNu(order.pricePerKg)}</Detail>
                <Detail label="Delivery date">{fmtDate(order.deliveryDate)}</Detail>
                <Detail label="Estimated value">{fmtNu(order.kg * order.pricePerKg)}</Detail>
              </DetailGrid>
            </div>

            {order.confirmation === 'Awaiting buyer' ? (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="primary"
                  className="flex-1"
                  icon={<CheckCircle2 size={17} />}
                  onClick={() => {
                    store.setOrderConfirmation(order.id, 'Confirmed')
                    store.toast('Order confirmed. Thank you.')
                  }}
                >
                  Confirm order
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  icon={<XCircle size={17} />}
                  onClick={() => {
                    store.setOrderConfirmation(order.id, 'Declined')
                    store.toast('Order declined.', 'info')
                  }}
                >
                  Decline
                </Button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">
                {order.confirmation === 'Draft'
                  ? 'This order has not been sent to you yet. The coordinator will share it when it is ready.'
                  : `You have already responded: this order is ${order.confirmation.toLowerCase()}.`}
              </p>
            )}
            <div className="mt-6">
              <Notice>Demo preview: your answer is kept in this browser tab only and is not sent to anyone.</Notice>
            </div>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  )
}
