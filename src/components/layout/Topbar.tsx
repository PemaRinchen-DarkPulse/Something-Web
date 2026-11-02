import { Check, ChevronDown, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CURRENT_USER } from '../../data/mock'
import { useStore } from '../../store/DataStore'
import { Popover } from '../ui/Popover'
import { GlobalSearch } from './GlobalSearch'
import { Notifications } from './Notifications'
import { sectionTitles } from './nav'
import { initials } from './Sidebar'
import { SyncIndicator } from './SyncIndicator'

function GroupSelector({ className = '' }: { className?: string }) {
  const { group, groups, setGroupId, toast } = useStore()
  return (
    <Popover
      align="left"
      width="sm:w-72"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className={`flex min-h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[13px] font-medium hover:bg-subtle ${className}`}
        >
          <span className="max-w-40 truncate">{group.name}</span>
          <ChevronDown size={14} className="shrink-0 text-muted" />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1">
          <p className="px-4 py-2 text-xs text-muted">Farmer group</p>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                if (!g.available) {
                  toast(`${g.name} has no demo data. Only Paro Valley is populated.`, 'info')
                  return
                }
                setGroupId(g.id)
                close()
              }}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-canvas"
            >
              <span>
                <span className={`block text-[13px] font-medium ${g.available ? '' : 'text-muted'}`}>{g.name}</span>
                <span className="block text-xs text-muted">{g.available ? g.dzongkhag : `${g.dzongkhag} · not in demo`}</span>
              </span>
              {g.id === group.id && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  const [section = '', detail] = pathname.split('/').filter(Boolean)
  const sectionTitle = sectionTitles[section] ?? 'Not found'

  return (
    // The strip below the header is part of the sticky block, so the gap above the
    // content panel stays put while the panel scrolls underneath it.
    <div className="sticky top-0 z-20 bg-backdrop pb-3 sm:pb-4">
    <header className="border-b border-line bg-surface">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted hover:bg-subtle lg:hidden"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 lg:flex-none lg:shrink-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li className="hidden text-muted md:block">ZhingPool</li>
            <li className="hidden text-muted md:block">/</li>
            <li className={detail ? 'hidden md:block' : ''}>
              {detail ? (
                <Link to={`/${section}`} className="text-muted hover:text-ink">
                  {sectionTitle}
                </Link>
              ) : (
                <span className="truncate text-[15px] font-semibold md:text-[13px] md:font-medium">{sectionTitle}</span>
              )}
            </li>
            {detail && (
              <>
                <li className="hidden text-muted md:block">/</li>
                <li className="truncate text-[15px] font-semibold md:text-[13px] md:font-medium">{detail}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
          <div className="w-full max-w-md">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <GroupSelector className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink lg:hidden"
          >
            <Search size={19} />
          </button>
          <SyncIndicator />
          <Notifications />
          <div className="ml-1 hidden items-center gap-2.5 border-l border-line pl-3 xl:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {initials(CURRENT_USER.name)}
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-medium">{CURRENT_USER.name}</p>
              <p className="text-xs text-muted">{CURRENT_USER.role}</p>
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="flex flex-col gap-2 border-t border-line px-3 py-2 sm:px-5 lg:hidden">
          <GlobalSearch autoFocus onDone={() => setSearchOpen(false)} />
          <GroupSelector className="sm:hidden" />
        </div>
      )}
    </header>
    </div>
  )
}
