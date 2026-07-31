import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { SignalGauge } from '../ui/SignalGauge'
import { IconAnalytics, IconCampaigns, IconGauge, IconLeads, IconSettings, IconX } from '../ui/icons'

const NAV_ITEMS = [
  { to: '/leads', label: 'Leads', icon: IconLeads },
  { to: '/campaigns', label: 'Campaigns', icon: IconCampaigns },
  { to: '/tracker', label: 'Tracker', icon: IconGauge },
  { to: '/analytics', label: 'Analytics', icon: IconAnalytics },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-30 bg-graphite-950/60 transition-opacity duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-graphite-700 bg-graphite-900 transition-transform duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <SignalGauge size={30} />
            <span className="font-display text-lg font-semibold tracking-tight text-fog-50">
              Ember<span className="font-normal text-slate-400">line</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-slate-400 hover:bg-graphite-800 hover:text-fog-100 lg:hidden"
          >
            <IconX className="h-4.5 w-4.5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'text-fog-50' : 'text-slate-400 hover:bg-graphite-800 hover:text-fog-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      className="absolute inset-0 rounded-md bg-primary/15"
                      transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                    />
                  )}
                  <Icon className={`relative z-10 h-4.5 w-4.5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-graphite-700 px-6 py-4">
          <p className="font-mono text-[11px] tracking-wide text-slate-500 uppercase">
            Demo run · London dental
          </p>
        </div>
      </aside>
    </>
  )
}
