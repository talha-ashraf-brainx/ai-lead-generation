import { useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { IconMapPin, IconSearch } from '../ui/icons'

interface KeywordSearchFormProps {
  onSearch: (niche: string, location: string) => void
  isSearching: boolean
}

export function KeywordSearchForm({ onSearch, isSearching }: KeywordSearchFormProps) {
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!niche.trim() || !location.trim()) {
      setError('Enter both a niche/keyword and a location')
      return
    }
    setError(null)
    onSearch(niche.trim(), location.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Describe the businesses you want to reach — for example{' '}
        <span className="text-fog-100">"dental clinics"</span> in{' '}
        <span className="text-fog-100">"London"</span>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Niche / keyword"
          name="niche"
          placeholder="Dental clinics"
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          disabled={isSearching}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="font-mono text-xs tracking-wide text-slate-400 uppercase">
            Location
          </label>
          <div className="relative">
            <IconMapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="location"
              name="location"
              placeholder="London"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isSearching}
              className="w-full rounded-md border border-graphite-600 bg-graphite-900 py-2.5 pr-3 pl-9 text-sm text-fog-50 outline-none transition-colors placeholder:text-slate-500 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-temp-hot">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" isLoading={isSearching} className="gap-2">
          <IconSearch className="h-4 w-4" />
          Find leads
        </Button>
      </div>
    </form>
  )
}
