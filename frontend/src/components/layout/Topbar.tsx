import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../../hooks/useAuth'
import { useClickOutside } from '../../hooks/useClickOutside'
import { popIn } from '../../lib/motion'
import { Button } from '../ui/Button'
import { NotificationBell } from '../notifications/NotificationBell'
import { IconChevronDown, IconLogout, IconMenu } from '../ui/icons'

const PAGE_TITLES: Record<string, string> = {
  '/leads': 'Leads',
  '/leads/import': 'Import Leads',
  '/campaigns': 'Campaigns',
  '/tracker': 'Lead Tracker',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

function pageTitleFor(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const base = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path))
  return base ? PAGE_TITLES[base] : 'Emberline'
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside(menuRef, () => setMenuOpen(false))

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-graphite-700 bg-graphite-950 px-4 lg:px-8">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-md p-1.5 text-slate-400 hover:bg-graphite-800 hover:text-fog-100 lg:hidden"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <h1 className="font-display text-base font-medium text-fog-50">
        {pageTitleFor(location.pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 transition-colors hover:bg-graphite-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-medium text-primary">
              {initials}
            </span>
            <span className="hidden text-sm text-fog-100 sm:inline">{user?.name}</span>
            <IconChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                variants={popIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ transformOrigin: 'top right' }}
                className="absolute top-full right-0 mt-2 w-56 rounded-md border border-graphite-700 bg-graphite-900 p-2 shadow-xl"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm text-fog-100">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-graphite-700" />
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full justify-start border-none px-2 py-1.5 text-slate-300 hover:bg-graphite-800 hover:text-fog-100"
                >
                  <IconLogout className="h-4 w-4" />
                  Sign out
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
