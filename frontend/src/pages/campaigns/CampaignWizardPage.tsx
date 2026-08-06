import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StepIndicator } from '../../components/campaigns/StepIndicator'
import { FollowUpStep } from '../../components/campaigns/FollowUpStep'
import { ConfirmStep } from '../../components/campaigns/ConfirmStep'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { IconChevronLeft } from '../../components/ui/icons'
import { DEFAULT_FOLLOW_UPS, createCampaign } from '../../lib/api/campaigns'
import type { CampaignSchedule, FollowUpConfig } from '../../types/campaign'

const STEPS = ['Name', 'Follow-ups', 'Confirm']

export function CampaignWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [campaignName, setCampaignName] = useState('')
  const [followUps, setFollowUps] = useState<FollowUpConfig>(DEFAULT_FOLLOW_UPS)
  const [schedule, setSchedule] = useState<CampaignSchedule>('immediate')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canAdvance = step === 1 ? campaignName.trim().length > 0 : true

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      const campaign = await createCampaign({
        name: campaignName.trim(),
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
          Name it and set up follow-ups — you'll add leads from the Leads page once it's created.
        </p>
      </div>

      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="rounded-lg border border-graphite-700 bg-graphite-900 p-5">
        {step === 1 && (
          <TextField
            label="Campaign name"
            placeholder="e.g. Dental Q3 Follow-up"
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
          />
        )}
        {step === 2 && <FollowUpStep value={followUps} onChange={setFollowUps} />}
        {step === 3 && (
          <ConfirmStep
            campaignName={campaignName}
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

      {step < 3 && (
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
            Back
          </Button>
          <Button onClick={() => setStep((current) => current + 1)} disabled={!canAdvance}>
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}
