import { useEffect, useRef, useState } from 'react'
import { EditorPanel } from './editor/EditorPanel'
import { PreviewStage } from './editor/PreviewStage'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { useScheduleDoc } from './state/useScheduleDoc'
import { fontFamilyFor, type FontOption, loadUserFonts } from './theme/fonts'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)
  const [userFonts, setUserFonts] = useState<FontOption[]>([])

  useEffect(() => {
    void loadUserFonts().then(setUserFonts)
  }, [])

  const fontFamily = fontFamilyFor(api.doc.fontId, userFonts)

  return (
    <div style={{ padding: 16, maxWidth: 2000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 12px' }}>월간 스케줄표 만들기</h1>

      {api.saveError && (
        <p style={{ color: '#c0392b', fontSize: 13 }}>
          {api.saveError === 'quota'
            ? '저장 공간이 가득 찼습니다. 배경 이미지나 폰트를 정리해 주세요.'
            : '저장에 실패했습니다.'}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ position: 'sticky', top: 16 }}>
          <PreviewStage verticalChrome={90}>
            <ScheduleCanvas ref={canvasRef} doc={api.doc} fontFamily={fontFamily} />
          </PreviewStage>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}>
          <EditorPanel api={api} userFonts={userFonts} onUserFontsChange={setUserFonts} />
        </div>
      </div>
    </div>
  )
}
