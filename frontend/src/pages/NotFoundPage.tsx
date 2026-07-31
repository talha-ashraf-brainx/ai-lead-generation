import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-graphite-950 px-6 text-center">
      <p className="font-mono text-sm tracking-wide text-slate-500 uppercase">404</p>
      <div>
        <p className="font-display text-xl font-medium text-fog-50">Page not found</p>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          The page you're looking for doesn't exist or may have moved.
        </p>
      </div>
      <Link to="/">
        <Button>Back to Emberline</Button>
      </Link>
    </div>
  )
}
