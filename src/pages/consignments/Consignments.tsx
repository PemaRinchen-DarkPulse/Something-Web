import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/Badge'
import { PageHeader, Tabs } from '../../components/ui/Blocks'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import type { Column } from '../../components/ui/DataTable'
import { CONSIGNMENT_STATUSES } from '../../data/types'
import type { Consignment, ConsignmentStatus } from '../../data/types'
import { fmtDate, fmtKg } from '../../lib/format'
import { totalKg, useLookups } from '../../lib/lookups'
import { useStore } from '../../store/DataStore'
import { ConsignmentForm } from './ConsignmentForm'

export default function Consignments() {
  const { consignments } = useStore()
  const L = useLookups()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'All' | ConsignmentStatus>('All')
  const creating = params.get('new') === '1'

  const rows = consignments
    .filter((c) => tab === 'All' || c.status === tab)
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))

  const columns: Column<Consignment>[] = [
    { key: 'id', header: 'Consignment', sortValue: (c) => c.id, render: (c) => <span className="font-medium text-primary">{c.id}</span> },
    { key: 'product', header: 'Product', render: (c) => `${L.product(c.productId)} · Grade ${c.grade}` },
    { key: 'date', header: 'Collection date', sortValue: (c) => c.collectionDate, render: (c) => fmtDate(c.collectionDate) },
    { key: 'farmers', header: 'Farmers', align: 'right', hideBelow: 'md', render: (c) => c.items.length },
    { key: 'kg', header: 'Weight', align: 'right', sortValue: (c) => totalKg(c), render: (c) => fmtKg(totalKg(c)) },
    {
      key: 'driver',
      header: 'Driver',
      hideBelow: 'lg',
      render: (c) => (
        <span>
          {L.driver(c.driverId)}
          {c.driverId && !c.driverConfirmed && c.status !== 'Cancelled' && <span className="ml-1.5 text-xs text-warning">unconfirmed</span>}
        </span>
      ),
    },
    {
      key: 'dest',
      header: 'Destinations',
      hideBelow: 'lg',
      render: (c) => (
        <span>
          {L.buyer(c.destinations[0]?.buyerId)}
          {c.destinations.length > 1 && <span className="ml-1 text-muted">+{c.destinations.length - 1}</span>}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="Consignments"
        description="Each consignment pools one product from several farmers into a single truck."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setParams({ new: '1' })}>
            New consignment
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'All', label: 'All', count: consignments.length },
            ...CONSIGNMENT_STATUSES.map((s) => ({ id: s, label: s, count: consignments.filter((c) => c.status === s).length })),
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        pageSize={10}
        onRowClick={(c) => navigate(`/consignments/${c.id}`)}
        searchPlaceholder="Search by ID, product, driver or buyer"
        searchText={(c) => `${c.id} ${L.product(c.productId)} ${L.driver(c.driverId)} ${c.destinations.map((d) => L.buyer(d.buyerId)).join(' ')}`}
        emptyText="No consignments with this status."
      />
      <p className="mt-3 text-xs text-muted">
        Open a row to see farmers, destinations and the timeline. <Link to="/pledge-rounds" className="text-primary hover:underline">Check pledges</Link> before planning a collection.
      </p>

      {creating && (
        <ConsignmentForm
          open
          onClose={() => setParams({})}
          onCreated={(id) => {
            setParams({})
            navigate(`/consignments/${id}`)
          }}
        />
      )}
    </>
  )
}
