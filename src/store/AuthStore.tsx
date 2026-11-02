/**
 * Demo authentication.
 *
 * There is no backend yet, so `signIn` does not check credentials: it only
 * records that someone went through the sign-in screen. Replace it with a call
 * to the Spring Boot auth endpoint (and keep the token) when the API exists.
 *
 * "Remember me" keeps the flag in localStorage (survives closing the browser);
 * otherwise it lives in sessionStorage (this tab only).
 */
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const KEY = 'zhingpool.demo-session'

const read = () => {
  try {
    return sessionStorage.getItem(KEY) === '1' || localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

const write = (signedIn: boolean, remember = false) => {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
    if (signedIn) (remember ? localStorage : sessionStorage).setItem(KEY, '1')
  } catch {
    // Storage can be blocked (private windows); the in-memory flag still works.
  }
}

interface Auth {
  signedIn: boolean
  signIn: (remember?: boolean) => void
  signOut: () => void
}

const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(read)

  const value: Auth = {
    signedIn,
    signIn: (remember = false) => {
      write(true, remember)
      setSignedIn(true)
    },
    signOut: () => {
      write(false)
      setSignedIn(false)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
