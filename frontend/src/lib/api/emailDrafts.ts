import { apiFetch, isNotFound } from './client'
import type { EmailDraft, EmailDraftStatus } from '../../types/email'

export async function fetchEmailDraft(leadId: string): Promise<EmailDraft | undefined> {
  try {
    return await apiFetch<EmailDraft>(`/api/email-drafts/${leadId}`)
  } catch (err) {
    if (isNotFound(err)) return undefined
    throw err
  }
}

export async function generateEmail(leadId: string): Promise<EmailDraft> {
  return apiFetch<EmailDraft>(`/api/email-drafts/${leadId}/generate`, { method: 'POST' })
}

export async function saveEmailDraft(
  leadId: string,
  edits: { subject: string; body: string },
  status: EmailDraftStatus = 'edited',
): Promise<EmailDraft> {
  return apiFetch<EmailDraft>(`/api/email-drafts/${leadId}`, {
    method: 'PATCH',
    body: JSON.stringify({ subject: edits.subject, body: edits.body, status }),
  })
}

export async function bulkGenerateEmails(leadIds: string[]): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/api/email-drafts/bulk-generate', {
    method: 'POST',
    body: JSON.stringify({ leadIds }),
  })
}
