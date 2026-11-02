import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/DataStore'
import { Popover } from '../ui/Popover'

const dot = { danger: 'bg-danger', warning: 'bg-[#D99A32]', info: 'bg-info' }

export function Notifications() {
  const { alerts, unreadAlerts, markAlertsRead } = useStore()
  const navigate = useNavigate()

  return (
    <Popover
      width="sm:w-96"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Notifications, ${unreadAlerts} unread`}
          className="relative flex size-10 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
        >
          <Bell size={19} />
          {unreadAlerts > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white tnum">
              {unreadAlerts}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button type="button" onClick={markAlertsRead} disabled={unreadAlerts === 0} className="text-[13px] font-medium text-primary disabled:text-muted">
              Mark all read
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">Nothing needs your attention.</p>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li key={a.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      navigate(a.href)
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-canvas"
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot[a.severity]}`} />
                    <span>
                      <span className="block text-[13px] font-medium">{a.title}</span>
                      <span className="block text-xs text-muted">{a.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Popover>
  )
}
