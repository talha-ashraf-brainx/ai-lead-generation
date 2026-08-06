import { useEffect, useState } from 'react'
import { fetchDebugStatus } from '../lib/api/debug'

export function useDebugMode(): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetchDebugStatus()
      .then((result) => setEnabled(result.enabled))
      .catch(() => setEnabled(false))
  }, [])

  return enabled
}
