import { Check, Minus } from 'lucide-react'
import { useState } from 'react'
import { Notice, PageHeader, Section } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { Checkbox, Field, FormGrid, Input, Textarea } from '../components/ui/Fields'
import { CURRENT_USER } from '../data/mock'
import { fmtDateTime } from '../lib/format'
import { DEFAULT_FEE_PCT } from '../lib/settlement'
import { useStore } from '../store/DataStore'

const ROLES = [
  { role: 'Group Coordinator', view: true, pledges: true, consignments: true, settle: false, payouts: true },
  { role: 'Group Admin', view: true, pledges: true, consignments: true, settle: true, payouts: true },
  { role: 'Driver', view: false, pledges: false, consignments: false, settle: false, payouts: false },
  { role: 'Buyer (link only)', view: false, pledges: false, consignments: false, settle: false, payouts: false },
]

const COLUMNS: [keyof (typeof ROLES)[number], string][] = [
  ['view', 'View dashboard'],
  ['pledges', 'Manage pledges'],
  ['consignments', 'Manage consignments'],
  ['settle', 'Approve settlements'],
  ['payouts', 'Record payouts'],
]

export default function Settings() {
  const store = useStore()
  const [template, setTemplate] = useState(
    'ZhingPool: Pledge round open until Sat 6pm. Reply with product code and kg, e.g. CAB 120. Codes: CAB, CAR, POT, TOM, CHI.',
  )

  return (
    <>
      <PageHeader title="Settings" description="Group details, SMS wording and who is allowed to do what." />

      <Section title="Group">
        <FormGrid>
          <Field label="Group name"><Input value={store.group.name} readOnly /></Field>
          <Field label="Dzongkhag"><Input value={store.group.dzongkhag} readOnly /></Field>
          <Field label="Signed in as"><Input value={`${CURRENT_USER.name} (${CURRENT_USER.role})`} readOnly /></Field>
          <Field label="Default group fee" hint="Applied to each farmer’s gross. Adjustable per settlement."><Input value={`${DEFAULT_FEE_PCT}%`} readOnly /></Field>
        </FormGrid>
      </Section>

      <Section title="Pledge request SMS" description="Sent to every farmer with SMS consent when you open a round.">
        <div className="max-w-2xl space-y-3">
          <Textarea rows={4} value={template} onChange={(e) => setTemplate(e.target.value)} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">{template.length} characters{template.length > 160 ? ` · sent as ${Math.ceil(template.length / 153)} SMS parts` : ''}</p>
            <Button variant="primary" onClick={() => store.toast('Template kept for this session. Saving to the server comes with the backend.', 'info')}>Save template</Button>
          </div>
        </div>
      </Section>

      <Section title="Offline and sync">
        <div className="max-w-2xl space-y-3">
          <Checkbox label="Simulate offline mode" checked={store.simulatedOffline} onChange={store.setSimulatedOffline} />
          <p className="text-[13px] text-muted">
            {store.pendingChanges} pending {store.pendingChanges === 1 ? 'change' : 'changes'} · last synced {fmtDateTime(store.lastSynced)}. While offline, every change you make is counted in the queue shown at the top of the screen.
          </p>
          <Button onClick={store.syncNow} disabled={store.syncing || store.pendingChanges === 0}>Sync now</Button>
        </div>
      </Section>

      <Section title="Roles and permissions" description="What each kind of user can do. Shown for reference; roles are not enforced in the demo.">
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Role</th>
                {COLUMNS.map(([, label]) => (
                  <th key={label} className="px-4 py-2.5 text-center font-medium whitespace-nowrap">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{r.role}</td>
                  {COLUMNS.map(([key]) => (
                    <td key={key} className="px-4 py-3 text-center">
                      {r[key] ? <Check size={16} className="mx-auto text-success" /> : <Minus size={16} className="mx-auto text-line-strong" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-8 max-w-2xl">
        <Notice>
          This build runs on sample data held in your browser tab. Nothing is saved to a server, no SMS are sent and no money moves. Refreshing the page resets everything.
        </Notice>
      </div>
    </>
  )
}
