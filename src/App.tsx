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
import { useSelectedDate } from './editor/useSelectedDate'
import { buildMonthGrid } from './model/calendar'
import { resolveTextColors } from './model/textColors'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './preview/layout'
import { useAssetUrl } from './state/useAssetUrl'
import { useAutoTextColors } from './state/useAutoTextColors'
import { useRecurringRules } from './state/useRecurringRules'
import { useScheduleDoc } from './state/useScheduleDoc'
import { fontFamilyFor, type FontOption, loadUserFonts } from './theme/fonts'
import { getTheme } from './theme/themes'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)
  const [userFonts, setUserFonts] = useState<FontOption[]>([])
  const rulesApi = useRecurringRules()
  const isNarrow = useIsNarrow()

  /**
   * 보관함에서 폰트 파일을 지워도 이 목록이 그대로면 고를 수 있는 척 남는다.
   * 지운 뒤 다시 읽어야 선택 목록에서도 빠진다.
   */
  const reloadUserFonts = useCallback(() => {
    void loadUserFonts().then(setUserFonts)
  }, [])

  useEffect(reloadUserFonts, [reloadUserFonts])

  const fontFamily = fontFamilyFor(api.doc.fontId, userFonts)
  const backgroundUrl = useAssetUrl(api.doc.backgroundAssetId)

  const theme = getTheme(api.doc.themeId)
  const boxesEnabled: [boolean, boolean, boolean] = [
    api.doc.header.goals.enabled,
    api.doc.header.todo.enabled,
    api.doc.header.memo.enabled,
  ]
  const tones = useAutoTextColors({
    backgroundUrl,
    theme,
    boxesEnabled,
    gridOpacity: api.doc.gridOpacity,
    sidebarOpacity: api.doc.sidebarOpacity,
  })
  const textColors = resolveTextColors(api.doc.textColors, theme, tones)

  const [previewScale, setPreviewScale] = useState(0)
  const handleScaleChange = useCallback((next: number) => setPreviewScale(next), [])

  const { year, month } = api.doc
  const { selectedDate, toggle: handleSelect, select, close: closeEditor } =
    useSelectedDate(year, month)

  const selectedIndex = useMemo(() => {
    if (selectedDate === null) return -1
    return buildMonthGrid(year, month).findIndex((cell) => cell.date === selectedDate)
  }, [selectedDate, year, month])

  const editorForm = selectedDate === null ? null : (
    <SelectedDayEditor
      api={api}
      date={selectedDate}
      onSelect={select}
      onClose={closeEditor}
    />
  )

  return (
    <div style={{ padding: 16, maxWidth: 2000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 12px' }}>월간 스케줄표 만들기</h1>

      {/*
        quota는 localStorage(문서 JSON)가 가득 찼다는 뜻이다. 보관함이 다루는
        IndexedDB(이미지·폰트)와는 할당량이 완전히 별개라, 파일을 지워도
        이쪽 공간은 1바이트도 늘지 않는다. 정리를 해결책으로 가리키면 안 된다.
      */}
      {api.saveError && (
        <p style={{ color: '#c0392b', fontSize: 13 }}>
          {api.saveError === 'quota'
            ? '일정을 저장하지 못했습니다. 브라우저의 저장 공간을 확인해 주세요.'
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
                textColors={textColors}
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
            onAssetsChange={reloadUserFonts}
            canvasRef={canvasRef}
            rulesApi={rulesApi}
            textColors={textColors}
          />
        </div>
      </div>

      {isNarrow && editorForm !== null && (
        <DaySheet onClose={closeEditor}>{editorForm}</DaySheet>
      )}
    </div>
  )
}
