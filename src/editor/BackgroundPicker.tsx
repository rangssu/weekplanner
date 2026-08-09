import { useRef, useState } from 'react'
import { deleteAsset, putAsset } from '../model/assets'
import { resizeImageBlob } from '../model/imageResize'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type BackgroundPickerProps = {
  api: ScheduleDocApi
}

export function BackgroundPicker({ api }: BackgroundPickerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

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
      const previous = doc.backgroundAssetId
      setDoc((prev) => ({ ...prev, backgroundAssetId: assetId }))
      if (previous) await deleteAsset(previous)
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    const previous = doc.backgroundAssetId
    setDoc((prev) => ({ ...prev, backgroundAssetId: null }))
    if (previous) await deleteAsset(previous)
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>배경 이미지</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={() => inputRef.current?.click()}>
          {doc.backgroundAssetId ? '배경 바꾸기' : '배경 올리기'}
        </button>
        {doc.backgroundAssetId && (
          <button type="button" style={buttonStyle} onClick={() => void handleRemove()}>
            배경 없애기
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        16:9 이미지가 가장 잘 맞습니다. 너무 큰 이미지는 자동으로 줄입니다.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
