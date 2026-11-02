import { CloudOff, RefreshCw, Wifi } from 'lucide-react'
import { fmtDateTime } from '../../lib/format'
import { useStore } from '../../store/DataStore'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Fields'
import { Popover } from '../ui/Popover'

/**
 * Always visible, including on phones: coordinators work offline, so the
 * connection state and the number of unsynced changes must never be hidden.
 */
export function SyncIndicator() {
  const { offline, pendingChanges, syncing, lastSynced, syncNow, simulatedOffline, setSimulatedOffline } = useStore()

  const state = offline
    ? { label: 'Offline', tone: 'bg-danger-soft text-danger', icon: <CloudOff size={15} /> }
    : syncing
      ? { label: 'Syncing', tone: 'bg-info-soft text-info', icon: <RefreshCw size={15} className="animate-spin" /> }
      : pendingChanges > 0
        ? { label: 'Online', tone: 'bg-warning-soft text-warning', icon: <Wifi size={15} /> }
        : { label: 'Synced', tone: 'bg-success-soft text-success', icon: <Wifi size={15} /> }

  return (
    <Popover
      width="sm:w-80"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label={`Sync status: ${state.label}, ${pendingChanges} changes pending`}
          className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium ${state.tone}`}
        >
          {state.icon}
          <span className="hidden sm:inline">{state.label}</span>
          {pendingChanges > 0 && (
            <span className="rounded-full bg-white/70 px-1.5 text-xs tnum">
              {pendingChanges}
              <span className="hidden sm:inline"> pending</span>
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <div className="p-4">
          <p className="text-sm font-semibold">{offline ? 'Working offline' : 'Connected'}</p>
          <p className="mt-1 text-[13px] text-muted">
            {offline
              ? 'Changes are saved on this device and sent when you are back online.'
              : pendingChanges > 0
                ? 'Some changes made earlier are still waiting to be sent.'
                : 'Everything on this device is up to date.'}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[13px]">
            <div>
              <dt className="text-xs text-muted">Pending changes</dt>
              <dd className="font-medium tnum">{pendingChanges}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Last synced</dt>
              <dd className="font-medium">{fmtDateTime(lastSynced)}</dd>
            </div>
          </dl>
          <Button variant="primary" className="mt-4 w-full" onClick={syncNow} disabled={syncing || pendingChanges === 0}>
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> Sync now
          </Button>
          <div className="mt-3 border-t border-line pt-2">
            <Checkbox label="Simulate offline mode" checked={simulatedOffline} onChange={setSimulatedOffline} />
            <p className="text-xs text-muted">
              Demo only: no backend is connected, so syncing just clears the queue.
            </p>
          </div>
        </div>
      )}
    </Popover>
  )
}
