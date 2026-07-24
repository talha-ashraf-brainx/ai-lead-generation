import type { CsvPreview, CsvPreviewRow } from '../types/lead'

const COLUMN_ALIASES: Record<'company' | 'contactName' | 'email' | 'website', string[]> = {
  company: ['company', 'company name', 'business', 'business name'],
  contactName: ['contact', 'contact name', 'name', 'full name'],
  email: ['email', 'email address'],
  website: ['website', 'url', 'site', 'domain'],
}

function parseLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

function findColumn(headers: string[], key: keyof typeof COLUMN_ALIASES): number {
  const aliases = COLUMN_ALIASES[key]
  return headers.findIndex((header) => aliases.includes(header.trim().toLowerCase()))
}

export function parseLeadsCsv(text: string): CsvPreview {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { headers: [], missingColumns: Object.keys(COLUMN_ALIASES), rows: [] }
  }

  const headers = parseLine(lines[0])
  const companyIdx = findColumn(headers, 'company')
  const contactIdx = findColumn(headers, 'contactName')
  const emailIdx = findColumn(headers, 'email')
  const websiteIdx = findColumn(headers, 'website')

  const missingColumns: string[] = []
  if (companyIdx === -1) missingColumns.push('company')
  if (emailIdx === -1) missingColumns.push('email')

  const rows: CsvPreviewRow[] = lines.slice(1).map((line, index) => {
    const cells = parseLine(line)
    const company = companyIdx >= 0 ? (cells[companyIdx] ?? '') : ''
    const contactName = contactIdx >= 0 ? (cells[contactIdx] ?? '') : ''
    const email = emailIdx >= 0 ? (cells[emailIdx] ?? '') : ''
    const website = websiteIdx >= 0 ? (cells[websiteIdx] ?? '') : ''

    const issues: string[] = []
    if (!company) issues.push('Missing company name')
    if (!email) issues.push('Missing email')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) issues.push('Malformed email')

    return {
      rowNumber: index + 2,
      company,
      contactName,
      email,
      website,
      isValid: issues.length === 0,
      issues,
    }
  })

  return { headers, missingColumns, rows }
}
