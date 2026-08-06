import type { CampaignLead } from '../../lib/api/campaigns'
import { SendStatusBadge } from '../ui/StatusBadge'

export function CampaignLeadsTable({ leads }: { leads: CampaignLead[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-graphite-700">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-graphite-800 font-mono text-xs text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Send status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite-700">
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-fog-50">{lead.company}</p>
                <p className="text-xs text-slate-500">{lead.industry}</p>
              </td>
              <td className="px-4 py-3 text-slate-300">{lead.contactName}</td>
              <td className="px-4 py-3 text-slate-300">{lead.email ?? '—'}</td>
              <td className="px-4 py-3">
                <SendStatusBadge status={lead.initialSendStatus} error={lead.initialSendError} />
                {lead.initialSendError && (
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{lead.initialSendError}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
