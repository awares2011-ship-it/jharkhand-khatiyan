'use client'

import { useState, type RefObject } from 'react'
import { FileDown, ImageDown } from 'lucide-react'

async function captureCanvas(node: HTMLElement) {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(node, { backgroundColor: '#f7f8f4', scale: 2, useCORS: true })
}

export function ExportButtons({ targetRef, fileName, label }: { targetRef: RefObject<HTMLElement>; fileName: string; label?: string }) {
  const [busy, setBusy] = useState<'pdf' | 'png' | null>(null)

  async function downloadPng() {
    if (!targetRef.current) return
    setBusy('png')
    try {
      const canvas = await captureCanvas(targetRef.current)
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.warn('[export] PNG failed', error)
    } finally {
      setBusy(null)
    }
  }

  async function downloadPdf() {
    if (!targetRef.current) return
    setBusy('pdf')
    try {
      const canvas = await captureCanvas(targetRef.current)
      const { jsPDF } = await import('jspdf')
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
    } catch (error) {
      console.warn('[export] PDF failed', error)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="export-row">
      <button type="button" className={`export-btn export-btn-png ${busy === 'png' ? 'is-busy' : ''}`} onClick={downloadPng} disabled={busy !== null}>
        <ImageDown aria-hidden="true" />
        {busy === 'png' ? 'बन रहा है…' : `${label ? label + ' ' : ''}PNG डाउनलोड`}
      </button>
      <button type="button" className={`export-btn export-btn-pdf ${busy === 'pdf' ? 'is-busy' : ''}`} onClick={downloadPdf} disabled={busy !== null}>
        <FileDown aria-hidden="true" />
        {busy === 'pdf' ? 'बन रहा है…' : `${label ? label + ' ' : ''}PDF डाउनलोड`}
      </button>
    </div>
  )
}
