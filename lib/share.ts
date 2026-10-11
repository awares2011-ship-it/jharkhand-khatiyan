'use client'

// Share helper with graceful fallbacks:
// 1. System share sheet (Web Share on Android/iOS/modern Chrome)
// 2. Clipboard copy (so the UI can confirm "copied")
// 3. WhatsApp deep link separately — a plain URL that always works.
export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed'

export async function shareText(title: string, text: string, url?: string): Promise<ShareOutcome> {
  const data: ShareData = { title, text }
  if (url) data.url = url
  try {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      if (navigator.canShare && !navigator.canShare(data)) {
        // navigator.canShare returned false — fall through to clipboard.
      } else {
        await navigator.share(data)
        return 'shared'
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
  }
  try {
    const full = url ? `${text}\n${url}` : text
    await navigator.clipboard.writeText(full)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function whatsappUrl(text: string, url?: string): string {
  const full = url ? `${text}\n${url}` : text
  return `https://wa.me/?text=${encodeURIComponent(full)}`
}

export async function shareFile(file: File): Promise<ShareOutcome> {
  const data: ShareData = { files: [file], title: file.name }
  try {
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.canShare?.(data)) {
      await navigator.share(data)
      return 'shared'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
  }
  return 'failed'
}
