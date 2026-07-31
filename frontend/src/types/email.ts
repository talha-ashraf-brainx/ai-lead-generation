export type EmailDraftStatus = 'draft' | 'edited' | 'approved'

export interface PersonalizationVariable {
  label: string
  value: string
}

export interface EmailDraft {
  leadId: string
  subject: string
  body: string
  status: EmailDraftStatus
  personalization: PersonalizationVariable[]
  generatedAt: string
  editedAt: string | null
}
