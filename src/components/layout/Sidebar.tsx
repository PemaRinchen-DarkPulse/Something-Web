import { LogOut, Sprout } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CURRENT_USER } from '../../data/mock'
import { useAuth } from '../../store/AuthStore'
import { ConfirmDialog } from '../ui/Modal'
import { mainNav } from './nav'
import type { NavItem } from './nav'

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors lg:min-h-9 ${
          isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-subtle hover:text-ink'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {item.label}
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 65px = the 64px header plus its 1px bottom border, so the two lines line up and cross. */}
        <div className="flex h-[65px] shrink-0 items-center gap-3 border-b border-line px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <Sprout size={18} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">ZhingPool</p>
            <p className="text-[11px] text-muted">Coordinator console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main">
          {mainNav.map((item) => (
            <NavItemLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-line px-3 py-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {initials(CURRENT_USER.name)}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium">{CURRENT_USER.name}</p>
              <p className="truncate text-xs text-muted">{CURRENT_USER.role}</p>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={() => setConfirmLogout(true)}
              className="flex size-10 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink lg:size-8"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out of ZhingPool?"
        message="You will need to sign in again. Changes still waiting to sync stay on this device until you do."
        confirmLabel="Log out"
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          signOut()
          navigate('/login')
        }}
      />
    </>
  )
}
