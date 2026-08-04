import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { fetchLead } from '../../lib/api/leads'
import { fetchEmailDraft, generateEmail, saveEmailDraft } from '../../lib/api/emailDrafts'
import type { Lead } from '../../types/lead'
import type { EmailDraft } from '../../types/email'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Textarea } from '../../components/ui/Textarea'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmailDraftBadge, StatusBadge } from '../../components/ui/StatusBadge'
import { fadeIn } from '../../lib/motion'
import { IconChevronLeft, IconExternalLink, IconRefresh } from '../../components/ui/icons'

const SUBJECT_GUIDANCE = 60

export function EmailReviewPage() {
  const { leadId = '' } = useParams()
  const navigate = useNavigate()

  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoadingLead, setIsLoadingLead] = useState(true)

  const [draft, setDraft] = useState<EmailDraft | null>(null)
  const [subjectInput, setSubjectInput] = useState('')
  const [bodyInput, setBodyInput] = useState('')

  const [generationState, setGenerationState] = useState<'generating' | 'idle' | 'error'>('generating')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  function applyDraft(next: EmailDraft) {
    setDraft(next)
    setSubjectInput(next.subject)
    setBodyInput(next.body)
  }

  async function runGeneration(fn: () => Promise<EmailDraft>) {
    setGenerationState('generating')
    setGenerationError(null)
    try {
      const result = await fn()
      applyDraft(result)
      setGenerationState('idle')
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Something went wrong generating this email.')
      setGenerationState('error')
    }
  }

  useEffect(() => {
    let cancelled = false
    setIsLoadingLead(true)

    fetchLead(leadId).then((result) => {
      if (!cancelled) {
        setLead(result ?? null)
        setIsLoadingLead(false)
      }
    })

    fetchEmailDraft(leadId).then((existing) => {
      if (cancelled) return
      if (existing) {
        applyDraft(existing)
        setGenerationState('idle')
      } else {
        runGeneration(() => generateEmail(leadId))
      }
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId])

  const isDirty = draft !== null && (subjectInput !== draft.subject || bodyInput !== draft.body)

  function handleRegenerate() {
    if (isDirty && !confirm("Regenerating will discard your unsaved edits. Continue?")) return
    runGeneration(() => generateEmail(leadId))
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const updated = await saveEmailDraft(leadId, { subject: subjectInput, body: bodyInput }, 'edited')
      applyDraft(updated)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApprove() {
    setIsApproving(true)
    try {
      const updated = await saveEmailDraft(leadId, { subject: subjectInput, body: bodyInput }, 'approved')
      applyDraft(updated)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => navigate(-1)}
        className="flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-fog-100"
      >
        <IconChevronLeft className="h-4 w-4" />
        Back to leads
      </button>

      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">
          {isLoadingLead ? 'Loading…' : lead ? `Email for ${lead.company}` : 'Lead not found'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          AI-generated draft, personalized to this lead — edit before sending.
        </p>
      </div>

      {isLoadingLead ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : !lead ? (
        <ErrorState description="This lead couldn't be found. It may have been deleted." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr] lg:items-start">
          <div className="flex flex-col gap-4 rounded-lg border border-graphite-700 bg-graphite-900 p-5 lg:sticky lg:top-4">
            <StatusBadge status={lead.status} />
            <div>
              <p className="font-display text-base font-medium text-fog-50">{lead.company}</p>
              <p className="text-sm text-slate-400">{lead.contactName}</p>
            </div>
            <dl className="flex flex-col gap-3">
              <ContextField label="Industry">{lead.industry}</ContextField>
              <ContextField label="Email">{lead.email ?? '—'}</ContextField>
              <ContextField label="Website">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {lead.website.replace(/^https?:\/\//, '')}
                    <IconExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  '—'
                )}
              </ContextField>
              <ContextField label="Pain point">{lead.painPoint ?? 'Not detected'}</ContextField>
            </dl>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-graphite-700 bg-graphite-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {draft ? (
                <EmailDraftBadge status={draft.status} />
              ) : (
                <span className="font-mono text-xs text-slate-500 uppercase">No draft yet</span>
              )}
              <Button
                variant="ghost"
                onClick={handleRegenerate}
                disabled={generationState === 'generating'}
                className="gap-1.5"
              >
                <IconRefresh className={`h-4 w-4 ${generationState === 'generating' ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>

            {generationState === 'generating' ? (
              <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-56 w-full" />
                <p className="font-mono text-xs text-slate-500">Generating a personalized draft…</p>
              </motion.div>
            ) : generationState === 'error' ? (
              <ErrorState
                title="Couldn't generate this email"
                description={generationError ?? 'Something went wrong.'}
                onRetry={() => runGeneration(() => generateEmail(leadId))}
              />
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <TextField
                    id="email-subject"
                    label="Subject"
                    value={subjectInput}
                    onChange={(event) => setSubjectInput(event.target.value)}
                  />
                  <p
                    className={`self-end font-mono text-xs ${
                      subjectInput.length > SUBJECT_GUIDANCE ? 'font-medium text-fog-50' : 'text-slate-500'
                    }`}
                  >
                    {subjectInput.length} / {SUBJECT_GUIDANCE} characters
                    {subjectInput.length > SUBJECT_GUIDANCE ? ' — longer than recommended' : ''}
                  </p>
                </div>

                <Textarea
                  id="email-body"
                  label="Body"
                  rows={12}
                  value={bodyInput}
                  onChange={(event) => setBodyInput(event.target.value)}
                  className="resize-y font-mono leading-relaxed"
                />

                {draft && draft.personalization.length > 0 && (
                  <div>
                    <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Personalization used</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {draft.personalization.map((variable) => (
                        <span
                          key={variable.label}
                          className="rounded-md border border-graphite-600 bg-graphite-800 px-2.5 py-1 font-mono text-xs text-slate-300"
                        >
                          <span className="text-slate-500">{variable.label}:</span> {variable.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-graphite-700 pt-4">
                  <Button variant="ghost" onClick={handleSave} disabled={!isDirty || isSaving} isLoading={isSaving}>
                    Save changes
                  </Button>
                  <Button onClick={handleApprove} disabled={isApproving} isLoading={isApproving}>
                    Approve
                  </Button>
                  {draft?.status === 'approved' && !isDirty && (
                    <span className="font-mono text-xs text-slate-500">Ready to include in a campaign send.</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ContextField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-xs tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-fog-100">{children}</dd>
    </div>
  )
}
