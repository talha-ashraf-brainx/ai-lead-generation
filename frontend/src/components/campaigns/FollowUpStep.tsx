import { Switch } from '../ui/Switch'
import { TextField } from '../ui/TextField'
import { Textarea } from '../ui/Textarea'
import type { FollowUpConfig, FollowUpStep as FollowUpStepData } from '../../types/campaign'

interface FollowUpStepProps {
  value: FollowUpConfig
  onChange: (next: FollowUpConfig) => void
}

export function FollowUpStep({ value, onChange }: FollowUpStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-graphite-600 px-4 py-4">
        <TimelineMarker label="Day 0" detail="Initial send" active />
        <Connector active={value.day3.enabled} />
        <TimelineMarker label="Day 3" detail={value.day3.enabled ? 'Follow-up' : 'Skipped'} active={value.day3.enabled} />
        <Connector active={value.day7.enabled} />
        <TimelineMarker label="Day 7" detail={value.day7.enabled ? 'Follow-up' : 'Skipped'} active={value.day7.enabled} />
      </div>

      <StepEditor label="Day 3 follow-up" step={value.day3} onChange={(day3) => onChange({ ...value, day3 })} />
      <StepEditor label="Day 7 follow-up" step={value.day7} onChange={(day7) => onChange({ ...value, day7 })} />
    </div>
  )
}

function StepEditor({
  label,
  step,
  onChange,
}: {
  label: string
  step: FollowUpStepData
  onChange: (next: FollowUpStepData) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-graphite-700 p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-medium text-fog-50">{label}</p>
        <Switch
          checked={step.enabled}
          onChange={(enabled) => onChange({ ...step, enabled })}
          label={step.enabled ? 'On' : 'Off'}
        />
      </div>
      {step.enabled && (
        <>
          <TextField
            label="Subject"
            value={step.subject}
            onChange={(event) => onChange({ ...step, subject: event.target.value })}
          />
          <Textarea
            label="Body"
            rows={5}
            value={step.body}
            onChange={(event) => onChange({ ...step, body: event.target.value })}
            className="font-mono leading-relaxed"
          />
        </>
      )}
    </div>
  )
}

function TimelineMarker({ label, detail, active }: { label: string; detail: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-primary' : 'bg-graphite-600'}`} />
      <p className={`font-mono text-xs ${active ? 'text-fog-100' : 'text-slate-500'}`}>{label}</p>
      <p className="text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  return <span className={`h-px flex-1 ${active ? 'bg-primary/50' : 'bg-graphite-700'}`} />
}
