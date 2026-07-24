import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { mockRequestPasswordReset } from '../lib/mock/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await mockRequestPasswordReset(email)
      setIsSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-900 p-8">
      <div className="w-full max-w-sm">
        <span className="font-display text-xl font-semibold text-fog-50">Emberline</span>
        <h2 className="mt-8 font-display text-2xl font-medium text-fog-50">Reset your password</h2>

        {isSent ? (
          <div className="mt-6 rounded-md border border-temp-cold/40 bg-temp-cold/10 px-4 py-3 text-sm text-fog-100">
            If an account exists for {email}, a reset link is on its way.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">
              Enter the email on your account and we'll send a link to reset your password.
            </p>
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
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-temp-hot/40 bg-temp-hot/10 px-3 py-2 text-sm text-temp-hot"
                >
                  {error}
                </p>
              )}
              <Button type="submit" isLoading={isSubmitting}>
                Send reset link
              </Button>
            </form>
          </>
        )}

        <Link to="/login" className="mt-6 inline-block text-xs text-slate-400 hover:text-fog-100">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
