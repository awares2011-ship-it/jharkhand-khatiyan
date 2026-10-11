'use client'

// Smart color lock-screen notification system.
//
// How it works:
//   • On the Capacitor APK (native): @capacitor/local-notifications schedules
//     4 recurring notifications (one per color: saffron, green, blue, rose)
//     at four daytime slots. Each slot uses a distinct Android notification
//     channel so Android paints the lock-screen side-stripe in the right
//     color and groups the alerts by category.
//   • On the web / PWA: a client-side scheduler using the Web Notification
//     API fires the same rotating payloads while the app is open. Browsers
//     show them in the OS tray, which on Android equals the lock screen for
//     an installed PWA.
//
// The plugin is lazy-imported so the project still builds and runs when
// @capacitor/local-notifications is not installed yet — the native path
// just degrades to the web path.
import { NOTIFICATION_THEMES, pickNotificationPayload, type NotificationTheme } from './notifications'

const LAST_LOCAL_KEY = 'jbi-last-local-notify-slot'
const SCHEDULE_FLAG_KEY = 'jbi-locknotify-scheduled-v1'
const WEB_INTERVAL_MS = 3 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 5 * 60 * 1000

// Hours of day (local) at which the 4 colored notifications fire. Keeps
// them to civilised daytime windows — no 2am surprises.
const DAY_SLOTS: { hour: number; minute: number; theme: NotificationTheme['id'] }[] = [
  { hour: 8, minute: 0, theme: 'green' }, // 🌾 mandi — morning
  { hour: 11, minute: 30, theme: 'blue' }, // 📍 land record — late morning
  { hour: 15, minute: 0, theme: 'saffron' }, // 📜 scheme — afternoon
  { hour: 19, minute: 0, theme: 'rose' }, // 📰 news — evening
]

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export async function requestPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined') return 'unsupported'
  // Prefer the native plugin when it is wired in; otherwise the Web API.
  try {
    const plugin = await loadNativePlugin()
    if (plugin) {
      const res = await plugin.requestPermissions()
      return (res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'default') as PermissionState
    }
  } catch {
    // fall through to web permission
  }
  if (!('Notification' in window)) return 'unsupported'
  const result = await Notification.requestPermission()
  return result as PermissionState
}

export function readPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as PermissionState
}

type NativePlugin = {
  requestPermissions: () => Promise<{ display: string }>
  createChannel: (channel: {
    id: string
    name: string
    description: string
    importance: number
    visibility: number
    lightColor: string
    lights: boolean
    vibration: boolean
  }) => Promise<void>
  schedule: (opts: { notifications: ScheduledNotification[] }) => Promise<void>
  cancel: (opts: { notifications: { id: number }[] }) => Promise<void>
  getPending: () => Promise<{ notifications: { id: number }[] }>
}

type ScheduledNotification = {
  id: number
  title: string
  body: string
  channelId: string
  schedule: { on: { hour: number; minute: number }; allowWhileIdle: boolean }
  smallIcon?: string
  largeIcon?: string
  iconColor: string
}

async function loadNativePlugin(): Promise<NativePlugin | null> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    const mod = (await import('@capacitor/local-notifications')) as unknown as { LocalNotifications: NativePlugin }
    return mod.LocalNotifications ?? null
  } catch {
    return null
  }
}

async function ensureNativeChannels(plugin: NativePlugin) {
  for (const theme of NOTIFICATION_THEMES) {
    await plugin.createChannel({
      id: `jbi-${theme.id}`,
      name: theme.label,
      description: `${theme.label} के लिए रंगीन सूचनाएं`,
      importance: 4, // IMPORTANCE_HIGH — heads-up on Android
      visibility: 1, // VISIBILITY_PUBLIC — shown on lock screen
      lightColor: theme.color,
      lights: true,
      vibration: true,
    })
  }
}

/** Schedule the 4 daily colored notifications on the native platform. */
export async function scheduleNative(): Promise<boolean> {
  const plugin = await loadNativePlugin()
  if (!plugin) return false
  await ensureNativeChannels(plugin)
  // Clear any previously scheduled jobs so re-enable is idempotent.
  try {
    const pending = await plugin.getPending()
    if (pending.notifications.length) {
      await plugin.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
  } catch {
    // ignore
  }
  const notifications: ScheduledNotification[] = DAY_SLOTS.map((slot, index) => {
    const theme = NOTIFICATION_THEMES.find((t) => t.id === slot.theme)!
    const sampleSlotIndex = index // deterministic sample for scheduling preview
    const { message } = pickNotificationPayload(sampleSlotIndex)
    return {
      id: 1000 + index,
      title: message.title,
      body: message.body,
      channelId: `jbi-${slot.theme}`,
      schedule: { on: { hour: slot.hour, minute: slot.minute }, allowWhileIdle: true },
      iconColor: theme.color,
    }
  })
  await plugin.schedule({ notifications })
  try {
    window.localStorage.setItem(SCHEDULE_FLAG_KEY, '1')
  } catch {
    // ignore
  }
  return true
}

export async function cancelNative(): Promise<void> {
  const plugin = await loadNativePlugin()
  if (!plugin) return
  try {
    const pending = await plugin.getPending()
    if (pending.notifications.length) {
      await plugin.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
    }
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem(SCHEDULE_FLAG_KEY)
  } catch {
    // ignore
  }
}

/** Start the web fallback that fires rotating notifications while the tab is open. */
export function startWebRotation(onFire?: (theme: NotificationTheme) => void): () => void {
  if (typeof window === 'undefined' || !('Notification' in window)) return () => {}
  const tick = () => {
    const slot = Math.floor(Date.now() / WEB_INTERVAL_MS)
    const last = Number(window.localStorage.getItem(LAST_LOCAL_KEY) || '-1')
    if (slot === last) return
    const { theme, message } = pickNotificationPayload(slot)
    try {
      new Notification(message.title, {
        body: message.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `jbi-local-${theme.id}`,
      })
      window.localStorage.setItem(LAST_LOCAL_KEY, String(slot))
      onFire?.(theme)
    } catch {
      // Safari / iOS don't support constructor-notifications; ignore.
    }
  }
  tick()
  const id = window.setInterval(tick, CHECK_INTERVAL_MS)
  return () => window.clearInterval(id)
}

/** Fire one preview notification right now so the user sees the lock-screen style. */
export async function firePreview(theme: NotificationTheme = NOTIFICATION_THEMES[0]): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const plugin = await loadNativePlugin()
  const { message } = pickNotificationPayload(NOTIFICATION_THEMES.indexOf(theme))
  if (plugin) {
    try {
      await ensureNativeChannels(plugin)
      await plugin.schedule({
        notifications: [
          {
            id: 9999,
            title: message.title,
            body: message.body,
            channelId: `jbi-${theme.id}`,
            schedule: { on: { hour: new Date().getHours(), minute: Math.min(59, new Date().getMinutes() + 1) }, allowWhileIdle: true },
            iconColor: theme.color,
          },
        ],
      })
      return true
    } catch {
      // fall through to web
    }
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return false
  try {
    new Notification(message.title, { body: message.body, icon: '/icon-192.png', tag: `jbi-preview-${theme.id}` })
    return true
  } catch {
    return false
  }
}

export function describeSchedule(): { time: string; theme: NotificationTheme }[] {
  return DAY_SLOTS.map((slot) => {
    const theme = NOTIFICATION_THEMES.find((t) => t.id === slot.theme)!
    const d = new Date()
    d.setHours(slot.hour, slot.minute, 0, 0)
    return {
      time: d.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      theme,
    }
  })
}
