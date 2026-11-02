import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { SearchInput } from './Fields'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Hide this column on narrower screens (keeps tables usable on phones). */
  hideBelow?: 'sm' | 'md' | 'lg'
  sortValue?: (row: T) => string | number
  className?: string
}

const hide = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  searchPlaceholder?: string
  /** Enables the search box; return the text a row can be found by. */
  searchText?: (row: T) => string
  /** Extra controls (filters, buttons) shown beside the search box. */
  toolbar?: ReactNode
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyText?: string
  /** Render without the outer border (when inside another panel). */
  bare?: boolean
  /** Pre-fill the search box (e.g. from a global search link). */
  defaultQuery?: string
  /** Totals row keyed by column key, shown under the last row on every page. */
  totals?: Record<string, ReactNode>
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = 'Search',
  searchText,
  toolbar,
  pageSize = 8,
  onRowClick,
  emptyText = 'Nothing to show yet.',
  bare = false,
  defaultQuery = '',
  totals,
}: DataTableProps<T>) {
  const [query, setQuery] = useState(defaultQuery)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sortValue) {
        const get = col.sortValue
        out = [...out].sort((a, b) => {
          const x = get(a)
          const y = get(b)
          const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
          return sort.dir === 'asc' ? cmp : -cmp
        })
      }
    }
    return out
  }, [rows, query, searchText, sort, columns])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)
  const from = filtered.length === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, filtered.length)

  const toggleSort = (key: string) => {
    setPage(1)
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))
  }
  const changeQuery = (q: string) => {
    setPage(1)
    setQuery(q)
  }

  return (
    <div className={bare ? '' : 'overflow-hidden rounded-lg border border-line bg-surface'}>
      {(searchText || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          {searchText && (
            <SearchInput value={query} onChange={changeQuery} placeholder={searchPlaceholder} className="sm:w-72" />
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-primary-soft">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-4 py-3 text-[11px] font-semibold tracking-wide whitespace-nowrap text-ink uppercase ${c.align === 'right' ? 'text-right' : ''} ${c.hideBelow ? hide[c.hideBelow] : ''}`}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-primary ${c.align === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {c.header}
                      {sort?.key === c.key &&
                        (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-line last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-canvas' : ''}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${c.align === 'right' ? 'whitespace-nowrap text-right tnum' : ''} ${c.hideBelow ? hide[c.hideBelow] : ''} ${c.className ?? ''}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted">
                  {query ? `No results for “${query}”.` : emptyText}
                </td>
              </tr>
            )}
          </tbody>
          {totals && filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-line-strong bg-canvas font-semibold">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 ${c.align === 'right' ? 'whitespace-nowrap text-right tnum' : ''} ${c.hideBelow ? hide[c.hideBelow] : ''}`}
                  >
                    {totals[c.key] ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted">
          <span>
            {from}–{to} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} icon={<ChevronLeft size={16} />} />
            <span className="px-2 tnum">
              {current} / {pages}
            </span>
            <Button size="sm" variant="ghost" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)} icon={<ChevronRight size={16} />} />
          </div>
        </div>
      )}
    </div>
  )
}
