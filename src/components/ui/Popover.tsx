import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface PopoverProps {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  /** Tailwind width classes for the panel on screens from `sm` up. */
  width?: string
}

/**
 * Click-outside / Escape dismissible panel.
 * On phones the panel is pinned to the screen edges so it never overflows.
 */
export function Popover({ trigger, children, align = 'right', width = 'sm:w-80' }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={`fixed inset-x-3 top-16 z-40 max-h-[75dvh] overflow-y-auto rounded-lg border border-line bg-surface sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 ${width} ${align === 'right' ? 'sm:right-0' : 'sm:left-0'}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
