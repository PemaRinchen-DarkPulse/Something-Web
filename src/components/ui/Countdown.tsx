import { useEffect, useState } from 'react'
import { formatCountdown } from '../../lib/format'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function Countdown({ to, className = '' }: { to: string; className?: string }) {
  const now = useNow()
  return <span className={`tnum ${className}`}>{formatCountdown(new Date(to).getTime() - now)}</span>
}
