import { useRef, useState, type DragEvent } from 'react'
import { IconFileText, IconUpload } from '../ui/icons'

interface CsvDropzoneProps {
  onFileSelected: (file: File) => void
}

export function CsvDropzone({ onFileSelected }: CsvDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-graphite-600 hover:border-slate-500 hover:bg-graphite-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFileSelected(file)
          event.target.value = ''
        }}
      />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-graphite-800 text-primary">
        <IconUpload className="h-5 w-5" />
      </span>
      <div>
        <p className="font-body text-sm font-medium text-fog-50">
          Drop a CSV file here, or click to browse
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <IconFileText className="h-3.5 w-3.5" />
          Requires company and email columns · .csv only
        </p>
      </div>
    </div>
  )
}
