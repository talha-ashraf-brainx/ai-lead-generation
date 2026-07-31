import { Skeleton } from '../ui/Skeleton'
import type { CampaignBreakdownRow } from '../../types/analytics'

export function CampaignBreakdownTable({ rows, isLoading }: { rows: CampaignBreakdownRow[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-graphite-600 px-4 py-8 text-center text-sm text-slate-400">
        No campaigns yet — create one to see its breakdown here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-graphite-700">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-graphite-800 font-mono text-xs text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Leads</th>
            <th className="px-4 py-3 font-medium">Open rate</th>
            <th className="px-4 py-3 font-medium">Reply rate</th>
            <th className="px-4 py-3 font-medium">Conversion rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite-700">
          {rows.map((row) => (
            <tr key={row.campaignId}>
              <td className="px-4 py-3 font-medium text-fog-50">{row.campaignName}</td>
              <td className="px-4 py-3 text-slate-300">{row.total}</td>
              <td className="px-4 py-3 text-slate-300">{row.openRate}%</td>
              <td className="px-4 py-3 text-slate-300">{row.replyRate}%</td>
              <td className="px-4 py-3 text-slate-300">{row.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
