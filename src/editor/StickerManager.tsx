import { useRef, useState } from 'react'
import { deleteAsset, putAsset } from '../model/assets'
import { resizeImageBlob } from '../model/imageResize'
import {
  createSticker, removeSticker, reorderSticker, STICKER_MAX_WIDTH, STICKER_MIN_WIDTH,
  updateSticker,
} from '../model/stickers'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type StickerManagerProps = {
  api: ScheduleDocApi
}

export function StickerManager({ api }: StickerManagerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  // 위에 있는 것부터 보여준다
  const ordered = [...doc.stickers].sort((a, b) => b.z - a.z)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    try {
      const blob = await resizeImageBlob(file)
      const assetId = await putAsset({ kind: 'image', name: file.name, mime: 'image/png', blob })
      setDoc((prev) => ({
        ...prev,
        stickers: [...prev.stickers, createSticker(assetId, prev.stickers)],
      }))
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async (id: string, assetId: string) => {
    // 같은 에셋을 다른 스티커가 쓰고 있으면 파일은 남긴다.
    const stillUsed = doc.stickers.some((s) => s.id !== id && s.assetId === assetId)
    setDoc((prev) => removeSticker(prev, id))
    if (!stillUsed) await deleteAsset(assetId)
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>스티커</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button type="button" style={buttonStyle} onClick={() => inputRef.current?.click()}>
        스티커 추가
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        배경이 투명한 PNG가 가장 잘 맞습니다. 추가한 뒤 미리보기에서 끌어 옮기세요.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}

      {ordered.map((sticker, index) => (
        <div
          key={sticker.id}
          style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10, marginTop: 10 }}
        >
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              type="button"
              style={buttonStyle}
              disabled={index === 0}
              onClick={() => setDoc((prev) => reorderSticker(prev, sticker.id, 'up'))}
            >
              앞으로
            </button>
            <button
              type="button"
              style={buttonStyle}
              disabled={index === ordered.length - 1}
              onClick={() => setDoc((prev) => reorderSticker(prev, sticker.id, 'down'))}
            >
              뒤로
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => void handleRemove(sticker.id, sticker.assetId)}
            >
              삭제
            </button>
          </div>

          <label style={fieldLabelStyle} htmlFor={`sticker-width-${sticker.id}`}>
            크기 {Math.round(sticker.width)}
          </label>
          <input
            id={`sticker-width-${sticker.id}`}
            type="range"
            min={STICKER_MIN_WIDTH}
            max={STICKER_MAX_WIDTH}
            value={sticker.width}
            style={{ ...inputStyle, padding: 0 }}
            onChange={(e) =>
              setDoc((prev) => updateSticker(prev, sticker.id, { width: Number(e.target.value) }))
            }
          />

          <label style={fieldLabelStyle} htmlFor={`sticker-rotation-${sticker.id}`}>
            회전 {Math.round(sticker.rotation)}°
          </label>
          <input
            id={`sticker-rotation-${sticker.id}`}
            type="range"
            min={-180}
            max={180}
            value={sticker.rotation}
            style={{ ...inputStyle, padding: 0 }}
            onChange={(e) =>
              setDoc((prev) => updateSticker(prev, sticker.id, { rotation: Number(e.target.value) }))
            }
          />
        </div>
      ))}
    </section>
  )
}
