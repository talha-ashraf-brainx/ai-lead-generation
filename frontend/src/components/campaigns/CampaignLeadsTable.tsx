import type { Lead } from '../../types/lead'
import { StatusBadge } from '../ui/StatusBadge'

export function CampaignLeadsTable({ leads }: { leads: Lead[] }) {
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
                <StatusBadge status={lead.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
