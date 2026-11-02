import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/DataStore'

interface Hit {
  key: string
  group: string
  title: string
  sub: string
  href: string
}

export function GlobalSearch({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const store = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const productName = (id: string) => store.products.find((p) => p.id === id)?.name ?? id
    const buyerName = (id: string) => store.buyers.find((b) => b.id === id)?.name ?? id
    const out: Hit[] = []
    store.consignments
      .filter((c) => `${c.id} ${productName(c.productId)} ${c.status}`.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) => out.push({ key: c.id, group: 'Consignments', title: c.id, sub: `${productName(c.productId)} · ${c.status}`, href: `/consignments/${c.id}` }))
    store.members
      .filter((m) => `${m.name} ${m.phone} ${m.village}`.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((m) => out.push({ key: m.id, group: 'Members', title: m.name, sub: `${m.village} · ${m.phone}`, href: `/members?q=${encodeURIComponent(m.name)}` }))
    store.buyers
      .filter((b) => `${b.name} ${b.location}`.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((b) => out.push({ key: b.id, group: 'Buyers', title: b.name, sub: b.location, href: '/buyers' }))
    store.orders
      .filter((o) => `${o.id} ${buyerName(o.buyerId)} ${productName(o.productId)}`.toLowerCase().includes(q))
      .slice(0, 2)
      .forEach((o) => out.push({ key: o.id, group: 'Orders', title: o.id, sub: `${buyerName(o.buyerId)} · ${productName(o.productId)}`, href: '/orders' }))
    return out
  }, [query, store.consignments, store.members, store.buyers, store.orders, store.products])

  const go = (href: string) => {
    navigate(href)
    setQuery('')
    setOpen(false)
    onDone?.()
  }

  return (
    <div ref={ref} className="relative w-full">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hits[0]) go(hits[0].href)
          if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Search members, consignments, orders"
        aria-label="Search"
        className="min-h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-lg border border-line bg-surface">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted">No matches for “{query}”.</p>
          ) : (
            hits.map((h, i) => (
              <button key={h.key} type="button" onClick={() => go(h.href)} className="block w-full px-4 py-2.5 text-left hover:bg-canvas">
                {(i === 0 || hits[i - 1].group !== h.group) && (
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">{h.group}</span>
                )}
                <span className="block text-[13px] font-medium">{h.title}</span>
                <span className="block text-xs text-muted">{h.sub}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
