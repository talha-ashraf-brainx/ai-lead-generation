import { IconChevronLeft, IconChevronRight } from './icons'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  isLoading?: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, isLoading, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <div className="flex items-center justify-between border-t border-graphite-700 px-4 py-3">
      <p className="font-mono text-xs text-slate-400">
        {isLoading ? 'Loading…' : total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-graphite-800 hover:text-fog-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 font-mono text-xs text-slate-400">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-graphite-800 hover:text-fog-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
