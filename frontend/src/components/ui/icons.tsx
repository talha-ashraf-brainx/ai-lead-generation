import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconLeads(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="7.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="8.5" r="2.25" />
      <path d="M15 19.5c.3-2.2 1.9-3.7 4-3.9" />
    </svg>
  )
}

export function IconCampaigns(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 11 20 4.5 15 20l-3.8-6.2L3.5 11Z" />
      <path d="M11.2 13.8 20 4.5" />
    </svg>
  )
}

export function IconAnalytics(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M2.5 20h19" />
    </svg>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.6 7l1.9 1.1M17.5 16l1.9 1.1M3.5 12h2.2M18.3 12h2.2M4.6 17l1.9-1.1M17.5 8l1.9-1.1" />
    </svg>
  )
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.2 5.2 1.2 5.2H4.8S6 13.5 6 9.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  )
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </svg>
  )
}

export function IconUpload(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.3-4.3" />
    </svg>
  )
}

export function IconX(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function IconFilter(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5h16l-6 7.5v5l-4 2v-7L4 5.5Z" />
    </svg>
  )
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5v.01" />
    </svg>
  )
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5 6.5 5h11L20 12.5" />
      <path d="M4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6h-4.7a2.8 2.8 0 0 1-5.6 0H4Z" />
    </svg>
  )
}

export function IconSpinner(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 24 24" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" strokeWidth={2.25} />
    </svg>
  )
}

export function IconExternalLink(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5H6a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 6 19.5h11a1.5 1.5 0 0 0 1.5-1.5v-3.5" />
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
    </svg>
  )
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M6.5 7 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconFileText(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  )
}

export function IconMapPin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6Z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.4M19.5 12a7.5 7.5 0 0 1-12.6 5.4" />
      <path d="M17 4.5V7h2.5" />
      <path d="M7 19.5V17H4.5" />
    </svg>
  )
}

export function IconGauge(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15 15.5 10" />
      <path d="M4 15h1.2M18.8 15H20M6.5 8.5l.9.9M17.5 8.5l-.9.9M12 5.5v1.2" />
    </svg>
  )
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconLayoutGrid(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconListBullets(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconActivity(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 12h3l2-6 4 12 2-9 1.5 3h4.5" />
    </svg>
  )
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

export function IconEyeOff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.3 4.2M6.6 6.6C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9.8 9.8 0 0 0 3.4-.6" />
      <path d="M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9" />
    </svg>
  )
}

export function IconBug(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="8.5" width="8" height="9.5" rx="4" />
      <path d="M9.5 8.5V6.5a2.5 2.5 0 0 1 5 0v2" />
      <path d="M8 12H4.5M8 15.5H4.5M16 12h3.5M16 15.5h3.5M10 6l-1.7-1.7M14 6l1.7-1.7" />
    </svg>
  )
}
