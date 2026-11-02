import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthStore'

/** Sends signed-out visitors to the sign-in screen and brings them back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth()
  const location = useLocation()
  if (!signedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
