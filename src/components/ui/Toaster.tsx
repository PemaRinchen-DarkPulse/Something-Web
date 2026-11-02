import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useStore } from '../../store/DataStore'

const icons = {
  success: <CheckCircle2 size={18} className="shrink-0 text-[#7FD0A0]" />,
  info: <Info size={18} className="shrink-0 text-[#8CC2EA]" />,
  danger: <XCircle size={18} className="shrink-0 text-[#F0908D]" />,
}

export function Toaster() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white"
        >
          {icons[t.tone]}
          <p className="flex-1">{t.text}</p>
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="-mr-1 text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
