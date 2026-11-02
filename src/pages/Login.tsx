import { Eye, EyeOff, Sprout } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Notice } from '../components/ui/Blocks'
import { Button } from '../components/ui/Button'
import { Checkbox, Field, Input } from '../components/ui/Fields'
import { useAuth } from '../store/AuthStore'

// Swap this for a real photo (for example /login-bg.jpg in /public) whenever you have one.
const BACKGROUND = '/login-bg.svg'

// Demo sign-in only: draw the password as masked text rather than a real password field, so
// password managers and browser autofill do not recognise a login form and add their own
// icons or overlays to the fields. Browsers without support fall back to a normal password
// field. Switch back to type="password" with proper autocomplete once real login exists.
const CAN_MASK = typeof CSS !== 'undefined' && CSS.supports('-webkit-text-security', 'disc')
// React's style types do not list this non-standard property.
const MASKED = { WebkitTextSecurity: 'disc' } as CSSProperties

export default function Login() {
  const { signedIn, signIn } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [hint, setHint] = useState<'forgot' | 'ndi' | null>(null)
  const [error, setError] = useState('')

  if (signedIn) return <Navigate to={from} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!loginId.trim()) return setError('Enter your login ID.')
    if (!password) return setError('Enter your password.')
    signIn(remember)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#2f5d4a]">
      <img src={BACKGROUND} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative mx-auto flex min-h-dvh max-w-[1280px] flex-col items-center justify-center gap-8 px-5 py-10 lg:flex-row lg:justify-between lg:gap-16 lg:px-16">
        {/* Brand */}
        <div className="flex flex-col items-center text-center text-white lg:items-start lg:text-left">
          <span className="flex size-20 items-center justify-center rounded-full bg-white text-primary lg:size-32">
            <Sprout className="size-9 lg:size-16" strokeWidth={1.6} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight lg:mt-7 lg:text-4xl">ZhingPool Login</h1>
          <p className="mt-2 text-base text-white/90 lg:text-lg">Pool the harvest. Share the return fairly.</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[30rem] rounded-2xl bg-surface p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Welcome back</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">Log in to your account</h2>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <Field label="Login ID">
              <Input
                name="zp-login-id"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                // Demo sign-in: ask browsers and password managers not to inject their own icons here.
                // Switch back to autoComplete="username" once real accounts exist.
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore
                data-bwignore
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                data-form-type="other"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Enter your login ID"
                className="min-h-11 md:min-h-11"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  type={show || CAN_MASK ? 'text' : 'password'}
                  style={CAN_MASK && !show ? MASKED : undefined}
                  name="zp-secret"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                  data-bwignore
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                  spellCheck={false}
                  placeholder="Enter your password"
                  className="min-h-11 pr-12 md:min-h-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between gap-3">
              <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
              <button
                type="button"
                onClick={() => setHint((h) => (h === 'forgot' ? null : 'forgot'))}
                className="text-[13px] text-muted hover:text-primary"
              >
                Forgot password?
              </button>
            </div>

            {hint === 'forgot' && <Notice>Ask your group admin to reset your password. There is no self-service reset yet.</Notice>}
            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="min-h-11 w-full uppercase tracking-wide md:min-h-11">
              Log in
            </Button>
          </form>

          <div className="my-4 flex items-center gap-4 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />
            Or
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => setHint('ndi')}
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-ink text-sm font-medium uppercase tracking-wide text-white hover:bg-black"
          >
            Log in with NDI
          </button>
          {hint === 'ndi' && (
            <div className="mt-3">
              <Notice>Bhutan NDI sign-in needs the backend, which is not connected yet. Use your login ID above.</Notice>
            </div>
          )}

          <p className="mt-5 text-center text-xs text-muted">
            Demo mode: any login ID and password will work.
          </p>
        </div>
      </div>
    </div>
  )
}
