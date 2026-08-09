import { useRef, useState } from 'react'
import { deleteAsset, putAsset } from '../model/assets'
import { resizeImageBlob } from '../model/imageResize'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type BackgroundPickerProps = {
  api: ScheduleDocApi
}

type OpacitySliderProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function OpacitySlider({ id, label, value, onChange }: OpacitySliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0 }}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        style={{ flex: 1 }}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span
        style={{
          fontSize: 12, color: '#52525b', width: 40, flexShrink: 0, textAlign: 'right',
          // 값이 바뀔 때 폭이 흔들리면 슬라이더가 같이 움찔거린다.
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  )
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
    // 배경을 없애면 슬라이더도 같이 사라져 사용자가 더는 값을 볼 수도, 되돌릴 수도 없다.
    // 낮춰둔 투명도를 그대로 두면 문서가 "화면에 없는 컨트롤이 적용 중인" 상태로
    // 저장돼 버리므로, 배경을 지우는 순간 함께 1(불투명)로 되돌린다.
    setDoc((prev) => ({ ...prev, backgroundAssetId: null, gridOpacity: 1, sidebarOpacity: 1 }))
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
      {doc.backgroundAssetId && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 8px' }}>
            투명도를 낮추면 배경 그림이 비쳐 보입니다. 일정 글자와 선은 항상 또렷합니다.
          </p>
          <OpacitySlider
            id="grid-opacity"
            label="달력"
            value={doc.gridOpacity}
            onChange={(v) => setDoc((prev) => ({ ...prev, gridOpacity: v }))}
          />
          <OpacitySlider
            id="sidebar-opacity"
            label="사이드바"
            value={doc.sidebarOpacity}
            onChange={(v) => setDoc((prev) => ({ ...prev, sidebarOpacity: v }))}
          />
        </div>
      )}
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
