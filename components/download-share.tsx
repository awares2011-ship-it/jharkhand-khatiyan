'use client'

// Download the current services view as PNG or PDF, or share the app via
// the system share sheet / WhatsApp. Uses html2canvas + jspdf (both already
// in the project) so everything works client-side with no server. On
// Android with the Web Share API, PNGs are shared as a real file — on
// older/web browsers it saves to the device.
import { useRef, useState } from 'react'
import { Download, FileDown, ImageDown, MessageCircle, Share2 } from 'lucide-react'
import { shareFile, shareText, whatsappUrl } from '@/lib/share'

type Props = {
  // Element to capture — if omitted, grabs the whole services section via ID.
  targetId?: string
  // Default filename stem.
  fileName?: string
  notify: (message: string) => void
}

const DEFAULT_TARGET = 'services'
const DEFAULT_NAME = 'Jharkhand-Khatiyan-सेवाएं'
const SHARE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://jharkhand-khatiyan.app'
const SHARE_TEXT =
  'Jharkhand Khatiyan — Land Info · झारखंड की सभी भूमि सेवाएं, मौसम, योजनाएं और रंगीन अलर्ट, एक ऐप में।'

async function captureNode(node: HTMLElement) {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(node, { backgroundColor: '#fdfaf4', scale: 2, useCORS: true, logging: false })
}

export function DownloadShare({ targetId = DEFAULT_TARGET, fileName = DEFAULT_NAME, notify }: Props) {
  const [busy, setBusy] = useState<null | 'png' | 'pdf' | 'share' | 'wa'>(null)
  const sectionRef = useRef<HTMLElement>(null)

  function resolveNode(): HTMLElement | null {
    if (sectionRef.current) {
      const target = targetId ? document.getElementById(targetId) : null
      if (target) return target
      return sectionRef.current
    }
    return document.getElementById(targetId)
  }

  async function downloadPng() {
    const node = resolveNode()
    if (!node) return
    setBusy('png')
    try {
      const canvas = await captureNode(node)
      const dataUrl = canvas.toDataURL('image/png')
      // Try to share as a file first on supported platforms, so the user
      // can send it straight to WhatsApp / Gallery.
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
      const shared = await shareFile(file)
      if (shared === 'shared' || shared === 'dismissed') {
        notify(shared === 'shared' ? 'छवि साझा की गई' : 'साझा रद्द')
        return
      }
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${fileName}.png`
      a.click()
      notify('PNG डाउनलोड हो गई')
    } catch (error) {
      console.warn('[png] failed', error)
      notify('PNG बन नहीं सकी')
    } finally {
      setBusy(null)
    }
  }

  async function downloadPdf() {
    const node = resolveNode()
    if (!node) return
    setBusy('pdf')
    try {
      const canvas = await captureNode(node)
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
      notify('PDF डाउनलोड हो गई')
    } catch (error) {
      console.warn('[pdf] failed', error)
      notify('PDF बन नहीं सकी')
    } finally {
      setBusy(null)
    }
  }

  async function shareApp() {
    setBusy('share')
    try {
      const outcome = await shareText('Jharkhand Khatiyan — Land Info', SHARE_TEXT, SHARE_URL)
      if (outcome === 'shared') notify('ऐप साझा किया गया')
      else if (outcome === 'copied') notify('लिंक कॉपी हो गया')
      else if (outcome === 'failed') notify('साझा नहीं हो सका — WhatsApp आज़माएं')
    } finally {
      setBusy(null)
    }
  }

  function openWhatsApp() {
    setBusy('wa')
    try {
      window.open(whatsappUrl(SHARE_TEXT, SHARE_URL), '_blank', 'noopener,noreferrer')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section ref={sectionRef} id="share" className="content-section share-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">सहेजें और साझा करें</p>
          <h2>दोस्तों तक पहुंचाएं</h2>
        </div>
      </div>
      <div className="share-card">
        <div className="share-card-copy">
          <span className="share-card-icon"><Download aria-hidden="true" /></span>
          <div>
            <b>सेवाओं की सूची डाउनलोड करें</b>
            <p>PNG या PDF में सहेजें — बाद में देखें, प्रिंट करें या WhatsApp पर भेजें।</p>
          </div>
        </div>
        <div className="share-actions">
          <button type="button" className="share-btn share-btn-png" onClick={downloadPng} disabled={busy !== null}>
            <ImageDown aria-hidden="true" />
            {busy === 'png' ? 'बन रहा है…' : 'PNG'}
          </button>
          <button type="button" className="share-btn share-btn-pdf" onClick={downloadPdf} disabled={busy !== null}>
            <FileDown aria-hidden="true" />
            {busy === 'pdf' ? 'बन रहा है…' : 'PDF'}
          </button>
          <button type="button" className="share-btn share-btn-share" onClick={shareApp} disabled={busy !== null}>
            <Share2 aria-hidden="true" />
            {busy === 'share' ? '…' : 'ऐप शेयर'}
          </button>
          <button type="button" className="share-btn share-btn-wa" onClick={openWhatsApp} disabled={busy !== null}>
            <MessageCircle aria-hidden="true" />
            WhatsApp
          </button>
        </div>
      </div>
    </section>
  )
}
