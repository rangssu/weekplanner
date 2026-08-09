import { useRef, useState } from 'react'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { BUILTIN_FONTS, type FontOption, uploadUserFont } from '../theme/fonts'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type FontPickerProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
}

export function FontPicker({ api, userFonts, onUserFontsChange }: FontPickerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const option = await uploadUserFont(file)
      onUserFontsChange([...userFonts, option])
      setDoc((prev) => ({ ...prev, fontId: option.id }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '폰트를 등록하지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>폰트</h2>

      <label style={fieldLabelStyle} htmlFor="font-select">사용할 폰트</label>
      <select
        id="font-select"
        style={inputStyle}
        value={doc.fontId}
        onChange={(e) => setDoc((prev) => ({ ...prev, fontId: e.target.value }))}
      >
        {[...BUILTIN_FONTS, ...userFonts].map((font) => (
          <option key={font.id} value={font.id}>{font.label}</option>
        ))}
      </select>

      <input
        ref={inputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        style={{ ...buttonStyle, marginTop: 8 }}
        onClick={() => inputRef.current?.click()}
      >
        폰트 파일 추가
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        ttf, otf, woff, woff2 파일을 쓸 수 있습니다. 한 번 추가하면 계속 남습니다.
        <br />
        컴퓨터에 설치만 된 폰트는 이름으로 고를 수 없습니다. 파일을 직접 넣어야
        결과 이미지에도 반영됩니다.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
