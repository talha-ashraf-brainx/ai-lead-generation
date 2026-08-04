import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../hooks/useAuth'
import { useCountUp } from '../hooks/useCountUp'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { SignalGauge } from '../components/ui/SignalGauge'

type LocationState = { from?: { pathname: string } }

const TEMPERATURE_STAGES = [
  { label: 'Contacted', count: 20, color: 'var(--color-temp-cold)' },
  { label: 'Opened', count: 8, color: 'var(--color-temp-cool)' },
  { label: 'Replied', count: 3, color: 'var(--color-temp-warm)' },
  { label: 'Converted', count: 1, color: 'var(--color-temp-hot)' },
]

const STAGE_REVEAL_DELAY_MS = 550
const STAGE_STAGGER_MS = 160
const STAGE_DURATION_MS = 700

function TemperatureBarSegment({ color, delayMs }: { color: string; delayMs: number }) {
  return (
    <div className="h-full flex-1 overflow-hidden">
      <motion.div
        className="h-full w-full"
        style={{ background: color, transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: STAGE_DURATION_MS / 1000, delay: delayMs / 1000, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

function TemperatureStat({
  label,
  count,
  delayMs,
}: {
  label: string
  count: number
  delayMs: number
}) {
  const value = useCountUp(count, STAGE_DURATION_MS, delayMs)
  return (
    <motion.div
      className="flex flex-col gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: delayMs / 1000 }}
    >
      <span className="font-mono text-lg text-fog-50">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </motion.div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/leads'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-graphite-950 p-12 lg:flex">
        <div
          className="signal-glow pointer-events-none absolute -top-24 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-temp-hot), transparent 70%)' }}
        />
        <motion.div
          className="pointer-events-none absolute top-16 right-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SignalGauge size={240} animated />
        </motion.div>

        <span className="relative flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-fog-50">
          <SignalGauge size={26} />
          Ember<span className="font-normal text-slate-400">line</span>
        </span>

        <div className="relative flex flex-col gap-8">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase"
          >
            Outreach console
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md font-display text-4xl leading-tight font-medium text-fog-50"
          >
            Watch cold turn into conversion.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-sm text-sm leading-relaxed text-slate-400"
          >
            Emberline tracks every lead from first send to signed deal, so you always know who's
            warming up.
          </motion.p>

          <div className="mt-4">
            <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-graphite-800">
              {TEMPERATURE_STAGES.map((stage, index) => (
                <TemperatureBarSegment
                  key={stage.label}
                  color={stage.color}
                  delayMs={STAGE_REVEAL_DELAY_MS + index * STAGE_STAGGER_MS}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {TEMPERATURE_STAGES.map((stage, index) => (
                <TemperatureStat
                  key={stage.label}
                  label={stage.label}
                  count={stage.count}
                  delayMs={STAGE_REVEAL_DELAY_MS + index * STAGE_STAGGER_MS}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          Demo run — 20 dental clinics in London, day one.
        </p>
      </div>

      <div className="flex items-center justify-center bg-graphite-900 p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <span className="mb-8 flex items-center gap-2.5 font-display text-xl font-semibold text-fog-50 lg:hidden">
            <SignalGauge size={26} />
            Ember<span className="font-normal text-slate-400">line</span>
          </span>

          <h2 className="font-display text-2xl font-medium text-fog-50">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">Sign in with your Emberline account.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && (
              <p
                role="alert"
                className="rounded-md border border-temp-hot/40 bg-temp-hot/10 px-3 py-2 text-sm text-temp-hot"
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-fog-100">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
