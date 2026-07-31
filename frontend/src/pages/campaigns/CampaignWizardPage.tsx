import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StepIndicator } from '../../components/campaigns/StepIndicator'
import { LeadPickerStep } from '../../components/campaigns/LeadPickerStep'
import { EmailReviewStep } from '../../components/campaigns/EmailReviewStep'
import { FollowUpStep } from '../../components/campaigns/FollowUpStep'
import { ConfirmStep } from '../../components/campaigns/ConfirmStep'
import { Button } from '../../components/ui/Button'
import { IconChevronLeft } from '../../components/ui/icons'
import { DEFAULT_FOLLOW_UPS, createCampaign } from '../../lib/mock/campaigns'
import { fetchEmailDraft } from '../../lib/mock/emailDrafts'
import type { CampaignSchedule, FollowUpConfig } from '../../types/campaign'

const STEPS = ['Select leads', 'Review emails', 'Follow-ups', 'Confirm & send']

export function CampaignWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [campaignName, setCampaignName] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [followUps, setFollowUps] = useState<FollowUpConfig>(DEFAULT_FOLLOW_UPS)
  const [schedule, setSchedule] = useState<CampaignSchedule>('immediate')
  const [scheduledAt, setScheduledAt] = useState('')
  const [approvedCount, setApprovedCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const leadIds = Array.from(selectedIds)

  function toggleLead(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canAdvance = step === 1 ? selectedIds.size > 0 && campaignName.trim().length > 0 : true

  async function goToConfirm() {
    const drafts = await Promise.all(leadIds.map((id) => fetchEmailDraft(id)))
    setApprovedCount(drafts.filter((draft) => draft?.status === 'approved').length)
    setStep(4)
  }

  async function handleConfirm() {
    const confirmed = confirm(
      `Send "${campaignName}" to ${leadIds.length} lead${leadIds.length === 1 ? '' : 's'} now? This can't be undone.`,
    )
    if (!confirmed) return

    setIsSubmitting(true)
    try {
      const campaign = await createCampaign({
        name: campaignName.trim(),
        leadIds,
        schedule,
        scheduledAt: schedule === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        followUps,
      })
      navigate(`/campaigns/${campaign.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/campaigns" className="flex w-fit items-center gap-1 text-sm text-slate-400 hover:text-fog-100">
        <IconChevronLeft className="h-4 w-4" />
        Back to campaigns
      </Link>

      <div>
        <h2 className="font-display text-2xl font-medium text-fog-50">New campaign</h2>
        <p className="mt-1 text-sm text-slate-400">
          Select leads, review their emails, and set up follow-ups before sending.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-5">
        {step === 1 && (
          <LeadPickerStep
            campaignName={campaignName}
            onCampaignNameChange={setCampaignName}
            selectedIds={selectedIds}
            onToggle={toggleLead}
          />
        )}
        {step === 2 && <EmailReviewStep leadIds={leadIds} />}
        {step === 3 && <FollowUpStep value={followUps} onChange={setFollowUps} />}
        {step === 4 && (
          <ConfirmStep
            campaignName={campaignName}
            leadCount={leadIds.length}
            approvedCount={approvedCount}
            schedule={schedule}
            scheduledAt={scheduledAt}
            followUps={followUps}
            onScheduleChange={setSchedule}
            onScheduledAtChange={setScheduledAt}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {step < 4 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={() => (step === 3 ? goToConfirm() : setStep((current) => current + 1))} disabled={!canAdvance}>
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}
