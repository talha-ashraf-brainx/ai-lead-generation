import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { popIn } from '../../lib/motion'
import {
  clearNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../../lib/mock/notifications'
import { NotificationSettingsDrawer } from './NotificationSettingsDrawer'
import { IconBell, IconSettings } from '../ui/icons'
import type { AppNotification } from '../../types/notification'

const KIND_DOT: Record<AppNotification['kind'], string> = {
  reply: 'var(--color-temp-warm)',
  conversion: 'var(--color-temp-hot)',
  follow_up: 'var(--color-slate-400)',
}

function relativeTime(iso: string): string {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  useEffect(() => {
    function load() {
      fetchNotifications().then(setNotifications)
    }
    load()
    return subscribeToNotifications(load)
  }, [])

  // Topbar persists across route changes, so any open dropdown/drawer would
  // otherwise stay mounted and overlap the next page — close both on navigation.
  useEffect(() => {
    setOpen(false)
    setSettingsOpen(false)
  }, [location.pathname])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  async function handleOpenItem(notification: AppNotification) {
    if (!notification.read) await markNotificationRead(notification.id)
    setOpen(false)
    if (notification.campaignId) navigate(`/campaigns/${notification.campaignId}`)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-slate-400 transition-colors hover:bg-graphite-800 hover:text-fog-100"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-temp-hot px-1 font-mono text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={popIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: 'top right' }}
            className="absolute top-full right-0 z-50 mt-2 w-80 rounded-md border border-graphite-700 bg-graphite-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-display text-sm font-medium text-fog-50">Notifications</p>
              <button
                onClick={() => {
                  setOpen(false)
                  setSettingsOpen(true)
                }}
                aria-label="Notification settings"
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-graphite-800 hover:text-fog-100"
              >
                <IconSettings className="h-4 w-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-slate-400">
                No new replies yet. Reply alerts arrive here once outreach is live.
              </p>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto border-t border-graphite-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleOpenItem(notification)}
                      className={`flex w-full items-start gap-2.5 border-b border-graphite-700 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-graphite-800/60 ${
                        notification.read ? '' : 'bg-primary/5'
                      }`}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: notification.read ? 'var(--color-slate-500)' : KIND_DOT[notification.kind] }}
                      />
                      <div className="min-w-0">
                        <p className={`truncate text-sm ${notification.read ? 'text-slate-300' : 'font-medium text-fog-50'}`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{notification.detail}</p>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">{relativeTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-graphite-700 px-4 py-2.5">
                  <button
                    onClick={() => markAllNotificationsRead()}
                    disabled={unreadCount === 0}
                    className="text-xs text-slate-400 transition-colors hover:text-fog-100 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={() => clearNotifications()}
                    className="text-xs text-slate-400 transition-colors hover:text-fog-100"
                  >
                    Clear all
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
