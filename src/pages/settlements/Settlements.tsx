import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/ui/Blocks'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { LinkButton } from '../../components/ui/Button'
import type { SettlementMeta } from '../../data/types'
import { fmtDate, fmtNu } from '../../lib/format'
import { useLookups } from '../../lib/lookups'
import { computeSettlement } from '../../lib/settlement'
import { useStore } from '../../store/DataStore'

export default function Settlements() {
  const { settlements, consignments } = useStore()
  const L = useLookups()
  const navigate = useNavigate()

  const detail = (s: SettlementMeta) => {
    const c = consignments.find((x) => x.id === s.consignmentId)!
    return { c, result: computeSettlement(c, { feePct: s.feePct }) }
  }

  const rows = [...settlements].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Awaiting approval' ? -1 : 1
    return detail(b).c.collectionDate.localeCompare(detail(a).c.collectionDate)
  })

  const awaiting = settlements.filter((s) => s.status === 'Awaiting approval')
  const awaitingTotal = awaiting.reduce((sum, s) => sum + detail(s).result.net, 0)

  const columns: Column<SettlementMeta>[] = [
    { key: 'id', header: 'Consignment', render: (s) => <span className="font-medium text-primary">{s.consignmentId}</span> },
    { key: 'product', header: 'Product', hideBelow: 'sm', render: (s) => L.product(detail(s).c.productId) },
    { key: 'date', header: 'Collected', hideBelow: 'md', render: (s) => fmtDate(detail(s).c.collectionDate) },
    { key: 'farmers', header: 'Farmers', align: 'right', hideBelow: 'md', render: (s) => detail(s).c.items.length },
    { key: 'revenue', header: 'Revenue', align: 'right', hideBelow: 'lg', render: (s) => fmtNu(detail(s).result.revenue) },
    { key: 'net', header: 'Net payable', align: 'right', sortValue: (s) => detail(s).result.net, render: (s) => <span className="font-medium">{fmtNu(detail(s).result.net)}</span> },
    { key: 'version', header: 'Version', align: 'right', hideBelow: 'sm', render: (s) => `v${s.versions.length}` },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (s) => (
        <LinkButton to={`/settlements/${s.consignmentId}`} size="sm" variant={s.status === 'Awaiting approval' ? 'primary' : 'ghost'} onClick={(e) => e.stopPropagation()}>
          {s.status === 'Awaiting approval' ? 'Review' : 'View'}
        </LinkButton>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Settlements"
        description="Work out what each farmer is owed once buyers have confirmed delivery. Approving a settlement creates the payouts."
      />
      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line pb-4 sm:max-w-xl sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">Awaiting approval</p>
          <p className="text-lg font-semibold tnum">{awaiting.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Value awaiting approval</p>
          <p className="text-lg font-semibold tnum">{fmtNu(awaitingTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Approved so far</p>
          <p className="text-lg font-semibold tnum">{settlements.length - awaiting.length}</p>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.consignmentId}
        pageSize={10}
        onRowClick={(s) => navigate(`/settlements/${s.consignmentId}`)}
        searchPlaceholder="Search settlements"
        searchText={(s) => `${s.consignmentId} ${L.product(detail(s).c.productId)}`}
        emptyText="Settlements appear after buyers confirm a delivery."
      />
    </>
  )
}
