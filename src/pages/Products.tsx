import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { DataTable } from '../components/ui/DataTable'
import type { Column } from '../components/ui/DataTable'
import { Checkbox, Field, FormGrid, Input, Select } from '../components/ui/Fields'
import { Modal } from '../components/ui/Modal'
import type { Product } from '../data/types'
import { useStore } from '../store/DataStore'

const UNITS = ['Kg', 'Sack', 'Crate', 'Bag', 'Bunch']

function ProductForm({ product, onClose }: { product?: Product; onClose: () => void }) {
  const store = useStore()
  const [name, setName] = useState(product?.name ?? '')
  const [code, setCode] = useState(product?.code ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'Sack')
  const [kgPerUnit, setKgPerUnit] = useState(String(product?.kgPerUnit ?? ''))
  const [grades, setGrades] = useState(product?.grades.join(', ') ?? 'A, B')
  const [active, setActive] = useState(product?.active ?? true)
  const [error, setError] = useState('')

  const save = () => {
    const parsedGrades = grades.split(',').map((g) => g.trim().toUpperCase()).filter(Boolean)
    if (!name.trim()) return setError('Enter a product name.')
    if (!/^[A-Z]{3}$/.test(code)) return setError('The SMS code must be exactly three letters, like CAB.')
    if (store.products.some((p) => p.code === code && p.id !== product?.id)) return setError(`The code ${code} is already used by another product.`)
    if (!(Number(kgPerUnit) > 0)) return setError('Enter how many kg one unit weighs.')
    if (parsedGrades.length === 0) return setError('Add at least one grade, for example A.')
    store.saveProduct({ id: product?.id, name: name.trim(), code, unit, kgPerUnit: Number(kgPerUnit), grades: parsedGrades, active })
    store.toast(product ? `${name.trim()} updated.` : `${name.trim()} added.`)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'Add product'}
      description="Farmers use the three-letter code when they pledge by SMS."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save product</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="SMS code" hint="Three letters, e.g. CAB">
            <Input value={code} maxLength={3} onChange={(e) => setCode(e.target.value.toUpperCase())} className="uppercase tracking-wide" />
          </Field>
          <Field label="Unit">
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kg per unit">
            <Input type="number" min={1} inputMode="decimal" value={kgPerUnit} onChange={(e) => setKgPerUnit(e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="Grades" hint="Separate with commas.">
          <Input value={grades} onChange={(e) => setGrades(e.target.value)} />
        </Field>
        <Checkbox label="Active (farmers can pledge this product)" checked={active} onChange={setActive} />
        {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

export default function Products() {
  const { products, saveProduct, toast } = useStore()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const columns: Column<Product>[] = [
    { key: 'name', header: 'Product', sortValue: (p) => p.name, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'code', header: 'SMS code', render: (p) => <code className="rounded bg-subtle px-1.5 py-0.5 text-xs font-medium tracking-wide">{p.code}</code> },
    { key: 'unit', header: 'Unit', hideBelow: 'sm', render: (p) => p.unit },
    { key: 'kg', header: 'Kg per unit', align: 'right', hideBelow: 'sm', render: (p) => p.kgPerUnit },
    {
      key: 'grades',
      header: 'Grades',
      hideBelow: 'md',
      render: (p) => (
        <span className="flex gap-1">
          {p.grades.map((g) => (
            <Badge key={g} dot={false} tone="brand">{g}</Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (p) => (
        <button
          type="button"
          role="switch"
          aria-checked={p.active}
          aria-label={`${p.name} is ${p.active ? 'active' : 'inactive'}`}
          onClick={(e) => {
            e.stopPropagation()
            saveProduct({ ...p, active: !p.active })
            toast(`${p.name} is now ${p.active ? 'inactive' : 'active'}.`)
          }}
          className="flex min-h-10 items-center gap-2 text-[13px]"
        >
          <span className={`relative h-5 w-9 rounded-full transition-colors ${p.active ? 'bg-primary' : 'bg-line-strong'}`}>
            <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${p.active ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
          <span className="hidden text-muted sm:inline">{p.active ? 'Active' : 'Inactive'}</span>
        </button>
      ),
    },
    { key: 'edit', header: '', align: 'right', render: (p) => <Button size="sm" variant="ghost" aria-label={`Edit ${p.name}`} icon={<Pencil size={15} />} onClick={(e) => { e.stopPropagation(); setEditing(p) }} /> },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        description="The produce your group trades. Codes are what farmers type into their SMS pledges."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditing('new')}>Add product</Button>}
      />
      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        pageSize={10}
        onRowClick={(p) => setEditing(p)}
        searchPlaceholder="Search products"
        searchText={(p) => `${p.name} ${p.code}`}
      />
      {editing && <ProductForm product={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
