import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Lead } from '../../types/lead'
import type { EmailDraft } from '../../types/email'
import { fetchLead, updateLeadDebugFields } from '../../lib/api/leads'
import { fetchEmailDraft } from '../../lib/api/emailDrafts'
import { useDebugMode } from '../../hooks/useDebugMode'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { EmailDraftBadge, EnrichmentBadge, StatusBadge } from '../ui/StatusBadge'
import { IconBug, IconCheck, IconExternalLink, IconMail } from '../ui/icons'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function LeadDetailDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const navigate = useNavigate()
  const debugEnabled = useDebugMode()
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [websiteInput, setWebsiteInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!leadId) return
    let cancelled = false
    setIsLoading(true)
    setLead(null)
    setEmailDraft(null)
    fetchLead(leadId).then((result) => {
      if (!cancelled) {
        setLead(result ?? null)
        setEmailInput(result?.email ?? '')
        setWebsiteInput(result?.website ?? '')
        setIsLoading(false)
      }
    })
    fetchEmailDraft(leadId).then((result) => {
      if (!cancelled) setEmailDraft(result ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [leadId])

  const hasUnsavedChanges = lead !== null && (emailInput !== (lead.email ?? '') || websiteInput !== lead.website)

  async function handleSaveDebugFields() {
    if (!leadId) return
    setIsSaving(true)
    try {
      const updated = await updateLeadDebugFields(leadId, { email: emailInput, website: websiteInput })
      setLead(updated)
      setEmailInput(updated.email ?? '')
      setWebsiteInput(updated.website)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer open={leadId !== null} onClose={onClose} title={lead?.company ?? 'Lead detail'}>
      {isLoading || !lead ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={lead.status} />
            <EnrichmentBadge status={lead.enrichment} />
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact">{lead.contactName}</Field>
            <Field label="Industry">{lead.industry}</Field>
            <Field label="Email">
              {debugEnabled ? (
                <input
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="No email"
                  className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-2.5 py-1.5 text-sm text-fog-50 outline-none transition-colors focus:border-primary"
                />
              ) : (
                lead.email ?? '—'
              )}
            </Field>
            <Field label="Website">
              {debugEnabled ? (
                <input
                  value={websiteInput}
                  onChange={(event) => setWebsiteInput(event.target.value)}
                  placeholder="No website"
                  className="w-full rounded-md border border-graphite-600 bg-graphite-900 px-2.5 py-1.5 text-sm text-fog-50 outline-none transition-colors focus:border-primary"
                />
              ) : lead.website ? (
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
            </Field>
            <Field label="Campaign">{lead.campaignName ?? 'Not assigned'}</Field>
            <Field label="Source">{lead.source === 'csv' ? 'CSV import' : 'Keyword search'}</Field>
            <Field label="Added">{formatDate(lead.createdAt)}</Field>
          </dl>

          {debugEnabled && (
            <div className="flex items-center gap-3 rounded-md border border-temp-warm/40 bg-temp-warm/10 px-3 py-2.5">
              <IconBug className="h-4 w-4 shrink-0 text-temp-warm" />
              <p className="flex-1 text-xs text-slate-300">Debug mode — edit email/website by hand, bypassing enrichment.</p>
              <Button variant="ghost" onClick={handleSaveDebugFields} disabled={!hasUnsavedChanges || isSaving} className="gap-1.5">
                {justSaved ? (
                  <>
                    <IconCheck className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          )}

          {lead.painPoint && (
            <div>
              <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">
                Likely pain point
              </p>
              <p className="mt-1.5 rounded-md border border-graphite-700 bg-graphite-800 px-3 py-2.5 text-sm text-fog-100">
                {lead.painPoint}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-md border border-graphite-700 bg-graphite-800 px-3 py-3">
            <div>
              <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Outreach email</p>
              {emailDraft && <div className="mt-1.5"><EmailDraftBadge status={emailDraft.status} /></div>}
            </div>
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={() => navigate(`/leads/${leadId}/email`)}
            >
              <IconMail className="h-4 w-4" />
              {emailDraft ? 'Review email' : 'Generate email'}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-xs tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-fog-100">{children}</dd>
    </div>
  )
}
