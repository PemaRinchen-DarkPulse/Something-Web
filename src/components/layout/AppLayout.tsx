import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '../ui/Toaster'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()

  // Return to the top on navigation. The drawer closes from the nav links themselves.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh bg-backdrop">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {/* Sidebar and header are flush white bars. Only the content is a white panel,
          with the soft background showing as space around it. */}
      <div className="lg:pl-64">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="mx-auto min-h-[calc(100dvh-6.25rem)] w-full max-w-[1400px] rounded-xl border border-line bg-surface px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
