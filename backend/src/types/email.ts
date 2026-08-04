export const EMAIL_DRAFT_STATUSES = ["draft", "edited", "approved"] as const;
export type EmailDraftStatus = (typeof EMAIL_DRAFT_STATUSES)[number];

export interface PersonalizationVariable {
  label: string;
  value: string;
}
