import { useState } from 'react'
import type { CampaignOption } from '../../types/lead'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { IconMail, IconTrash, IconX } from '../ui/icons'

interface BulkActionsBarProps {
  selectedCount: number
  isBusy: boolean
  campaignOptions: CampaignOption[]
  onAddToCampaign: (campaignId: string) => void
  onGenerateEmails: () => void
  onDelete: () => void
  onClear: () => void
}

export function BulkActionsBar({
  selectedCount,
  isBusy,
  campaignOptions,
  onAddToCampaign,
  onGenerateEmails,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  const [campaignId, setCampaignId] = useState('')
  const selectedCampaign = campaignOptions.find((option) => option.id === campaignId)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5">
      <span className="text-sm font-medium text-fog-50">{selectedCount} selected</span>

      <div className="flex items-center gap-2">
        <div className="w-48">
          <Select value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
            <option value="" disabled>
              Select a campaign
            </option>
            {campaignOptions.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="ghost"
          onClick={() => selectedCampaign && onAddToCampaign(campaignId)}
          disabled={isBusy || !campaignId}
        >
          Add to campaign
        </Button>
      </div>

      <Button variant="ghost" onClick={onGenerateEmails} disabled={isBusy} className="gap-1.5">
        <IconMail className="h-4 w-4" />
        Generate emails
      </Button>

      <Button
        variant="ghost"
        onClick={onDelete}
        disabled={isBusy}
        className="gap-1.5 border-temp-hot/40 text-temp-hot hover:bg-temp-hot/10"
      >
        <IconTrash className="h-4 w-4" />
        Delete
      </Button>

      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 text-sm text-slate-400 hover:text-fog-100"
      >
        <IconX className="h-3.5 w-3.5" />
        Clear selection
      </button>
    </div>
  )
}
