import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import type { CampaignSchedule, FollowUpConfig } from '../../types/campaign'

interface ConfirmStepProps {
  campaignName: string
  leadCount: number
  approvedCount: number
  schedule: CampaignSchedule
  scheduledAt: string
  followUps: FollowUpConfig
  onScheduleChange: (schedule: CampaignSchedule) => void
  onScheduledAtChange: (value: string) => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function ConfirmStep({
  campaignName,
  leadCount,
  approvedCount,
  schedule,
  scheduledAt,
  followUps,
  onScheduleChange,
  onScheduledAtChange,
  onConfirm,
  isSubmitting,
}: ConfirmStepProps) {
  const unapprovedCount = leadCount - approvedCount

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 p-4">
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Send scheduling</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 text-sm text-fog-100">
            <input
              type="radio"
              name="schedule"
              checked={schedule === 'immediate'}
              onChange={() => onScheduleChange('immediate')}
              className="accent-primary"
            />
            Send immediately
          </label>
          <label className="flex items-center gap-2 text-sm text-fog-100">
            <input
              type="radio"
              name="schedule"
              checked={schedule === 'scheduled'}
              onChange={() => onScheduleChange('scheduled')}
              className="accent-primary"
            />
            Schedule for later
          </label>
        </div>
        {schedule === 'scheduled' && (
          <TextField
            label="Send at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => onScheduledAtChange(event.target.value)}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-graphite-700 p-4">
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">Summary</p>
        <SummaryRow label="Campaign name" value={campaignName || 'Untitled campaign'} />
        <SummaryRow label="Leads" value={`${leadCount}`} />
        <SummaryRow label="Approved emails" value={`${approvedCount} / ${leadCount}`} warn={unapprovedCount > 0} />
        <SummaryRow label="Day 3 follow-up" value={followUps.day3.enabled ? 'On' : 'Off'} />
        <SummaryRow label="Day 7 follow-up" value={followUps.day7.enabled ? 'On' : 'Off'} />
      </div>

      {unapprovedCount > 0 && (
        <p className="text-xs text-slate-400">
          {unapprovedCount} lead{unapprovedCount === 1 ? '' : 's'} {unapprovedCount === 1 ? "doesn't" : "don't"} have an
          approved draft yet — unapproved drafts will still send as-is.
        </p>
      )}

      <Button onClick={onConfirm} isLoading={isSubmitting} disabled={leadCount === 0 || !campaignName.trim()}>
        Confirm &amp; send campaign
      </Button>
    </div>
  )
}

function SummaryRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={warn ? 'font-medium text-fog-50' : 'text-fog-100'}>{value}</span>
    </div>
  )
}
