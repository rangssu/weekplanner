import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DayClickLayer } from './editor/DayClickLayer'
import { DayPopover } from './editor/DayPopover'
import { DaySheet } from './editor/DaySheet'
import { EditorPanel } from './editor/EditorPanel'
import { PreviewStage } from './editor/PreviewStage'
import { SelectedDayEditor } from './editor/SelectedDayEditor'
import { StickerDragLayer } from './editor/StickerDragLayer'
import { cellScreenRect, popoverPlacement } from './editor/cellGeometry'
import { useIsNarrow } from './editor/useIsNarrow'
import { buildMonthGrid } from './model/calendar'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './preview/layout'
import { useAssetUrl } from './state/useAssetUrl'
import { useRecurringRules } from './state/useRecurringRules'
import { useScheduleDoc } from './state/useScheduleDoc'
import { fontFamilyFor, type FontOption, loadUserFonts } from './theme/fonts'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)
  const [userFonts, setUserFonts] = useState<FontOption[]>([])
  const rulesApi = useRecurringRules()
  const isNarrow = useIsNarrow()

  useEffect(() => {
    void loadUserFonts().then(setUserFonts)
  }, [])

  const fontFamily = fontFamilyFor(api.doc.fontId, userFonts)
  const backgroundUrl = useAssetUrl(api.doc.backgroundAssetId)

  const [previewScale, setPreviewScale] = useState(0)
  const handleScaleChange = useCallback((next: number) => setPreviewScale(next), [])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 달을 옮기면 선택을 푼다. 8월 8일을 고른 채 9월로 넘어갔을 때
  // 9월 8일이 선택돼 있는 것은 자연스럽지 않다.
  const { year, month } = api.doc
  useEffect(() => setSelectedDate(null), [year, month])

  // 같은 칸을 다시 누르면 해제한다.
  const handleSelect = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }, [])

  const closeEditor = useCallback(() => setSelectedDate(null), [])

  const selectedIndex = useMemo(() => {
    if (selectedDate === null) return -1
    return buildMonthGrid(year, month).findIndex((cell) => cell.date === selectedDate)
  }, [selectedDate, year, month])

  const editorForm = selectedDate === null ? null : (
    <SelectedDayEditor
      api={api}
      date={selectedDate}
      onSelect={setSelectedDate}
      onClose={closeEditor}
    />
  )

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

      <div className="app-layout">
        <div className="app-preview">
          <div style={{ position: 'relative' }}>
            <PreviewStage verticalChrome={90} onScaleChange={handleScaleChange}>
              <ScheduleCanvas
                ref={canvasRef}
                doc={api.doc}
                fontFamily={fontFamily}
                backgroundUrl={backgroundUrl}
              />
            </PreviewStage>

            {/*
              스티커 레이어보다 **먼저** 놓는다. 반대로 두면 날짜 오버레이가
              스티커 위에 깔려 스티커를 못 끈다.
            */}
            <DayClickLayer
              year={year}
              month={month}
              scale={previewScale}
              selectedDate={selectedDate}
              onSelect={handleSelect}
            />
            <StickerDragLayer api={api} scale={previewScale} />

            {!isNarrow && editorForm !== null && selectedIndex >= 0 && (
              <DayPopover
                anchor={cellScreenRect(selectedIndex, previewScale)}
                placement={popoverPlacement(selectedIndex)}
                containerWidth={CANVAS_WIDTH * previewScale}
                containerHeight={CANVAS_HEIGHT * previewScale}
                onClose={closeEditor}
              >
                {editorForm}
              </DayPopover>
            )}
          </div>
        </div>
        <div className="app-editor">
          <EditorPanel
            api={api}
            userFonts={userFonts}
            onUserFontsChange={setUserFonts}
            canvasRef={canvasRef}
            rulesApi={rulesApi}
          />
        </div>
      </div>

      {isNarrow && editorForm !== null && (
        <DaySheet onClose={closeEditor}>{editorForm}</DaySheet>
      )}
    </div>
  )
}
