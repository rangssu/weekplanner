import { useState, type RefObject } from 'react'
import { EXPORT_SIZES, type ExportSizeKey, exportSchedule } from '../export/exportImage'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type ExportPanelProps = {
  api: ScheduleDocApi
  canvasRef: RefObject<HTMLDivElement | null>
}

export function ExportPanel({ api, canvasRef }: ExportPanelProps) {
  const [busy, setBusy] = useState<ExportSizeKey | null>(null)
  const [error, setError] = useState('')

  const handleExport = async (key: ExportSizeKey) => {
    const node = canvasRef.current
    if (!node) {
      setError('미리보기를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.')
      return
    }
    setError('')
    setBusy(key)
    try {
      await exportSchedule(node, api.doc, key)
    } catch (err) {
      setError(
        err instanceof Error
          ? `이미지를 만들지 못했습니다: ${err.message}`
          : '이미지를 만들지 못했습니다.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>이미지 저장</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(EXPORT_SIZES) as ExportSizeKey[]).map((key) => {
          const size = EXPORT_SIZES[key]
          return (
            <button
              key={key}
              type="button"
              style={{ ...buttonStyle, opacity: busy ? 0.5 : 1 }}
              disabled={busy !== null}
              onClick={() => void handleExport(key)}
            >
              {busy === key ? '만드는 중…' : `${size.label} (${size.width}×${size.height})`}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 8 }}>
        만드는 데 1~3초 걸립니다. 창을 닫지 말고 기다려 주세요.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
