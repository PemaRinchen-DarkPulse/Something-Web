import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/Button'

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That address does not exist in ZhingPool.</p>
      <Link to="/" className={`${buttonClass('secondary')} mt-6`}>Go to overview</Link>
    </div>
  )
}
