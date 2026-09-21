// Definitions for the "smart multi-color" local notification system: a
// rotating set of themes/colors and message pool, consumed by
// components/notification-optin.tsx. Local-only (see that file) — there is
// no server here to send these as real push notifications.

export type NotificationTheme = {
  id: 'saffron' | 'green' | 'blue' | 'rose'
  label: string
  color: string
  accent: string
  emoji: string
}

export const NOTIFICATION_THEMES: NotificationTheme[] = [
  { id: 'saffron', label: 'योजना अपडेट', color: '#e8973a', accent: '#fff3da', emoji: '📜' },
  { id: 'green', label: 'मंडी भाव', color: '#3a8261', accent: '#e9f2eb', emoji: '🌾' },
  { id: 'blue', label: 'भूमि रिकॉर्ड', color: '#4a7fc9', accent: '#e7eff9', emoji: '📍' },
  { id: 'rose', label: 'ताज़ा समाचार', color: '#c968a0', accent: '#f9e8ee', emoji: '📰' },
]

export type NotificationMessage = { title: string; body: string }

const MESSAGE_POOL: Record<NotificationTheme['id'], NotificationMessage[]> = {
  saffron: [
    { title: '📜 नई योजना सूचना', body: 'किसानों के लिए ताज़ा सरकारी योजनाएं देखें।' },
    { title: '📜 योजना याद दिलाना', body: 'क्या आपने इस महीने की योजनाएं देख लीं?' },
  ],
  green: [
    { title: '🌾 आज का मंडी भाव', body: 'धान, मक्का और गेहूं के ताज़ा भाव अभी देखें।' },
    { title: '🌾 भाव में बदलाव', body: 'नजदीकी मंडी के आज के भाव चेक करें।' },
  ],
  blue: [
    { title: '📍 भूमि रिकॉर्ड अपडेट', body: 'अपना खाता और खेसरा एक बार ज़रूर जांचें।' },
    { title: '📍 दाखिल-खारिज स्थिति', body: 'अपने आवेदन की स्थिति देखना न भूलें।' },
  ],
  rose: [
    { title: '📰 ताज़ा समाचार', body: 'झारखंड से जुड़ी नई खबरें पढ़ें।' },
    { title: '📰 आज की सुर्खियां', body: 'भूमि और कृषि से जुड़ी ताज़ा खबरें।' },
  ],
}

export function themeForSlot(slotIndex: number): NotificationTheme {
  const i = ((slotIndex % NOTIFICATION_THEMES.length) + NOTIFICATION_THEMES.length) % NOTIFICATION_THEMES.length
  return NOTIFICATION_THEMES[i]
}

/** A new slot every 3 hours, shared by server cron + client fallback so both rotate in lockstep. */
export function currentSlotIndex(intervalMs = 3 * 60 * 60 * 1000): number {
  return Math.floor(Date.now() / intervalMs)
}

export function pickNotificationPayload(slotIndex: number = currentSlotIndex()) {
  const theme = themeForSlot(slotIndex)
  const pool = MESSAGE_POOL[theme.id]
  const message = pool[slotIndex % pool.length]
  return { theme, message }
}

