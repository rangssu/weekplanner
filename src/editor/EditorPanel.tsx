import { useState, type RefObject } from 'react'
import type { ResolvedTextColors } from '../model/textColors'
import type { RecurringRulesApi } from '../state/useRecurringRules'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import type { FontOption } from '../theme/fonts'
import { AssetLibrary } from './AssetLibrary'
import { BackgroundPicker } from './BackgroundPicker'
import { EditorTabs, loadEditorTab, saveEditorTab, type EditorTabId } from './EditorTabs'
import { ExportPanel } from './ExportPanel'
import { FontPicker } from './FontPicker'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { RecurringEditor } from './RecurringEditor'
import { StickerManager } from './StickerManager'
import { TextColorPicker } from './TextColorPicker'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
  /** 보관함에서 파일을 지운 뒤 불린다. 폰트 목록을 다시 읽는 데 쓴다. */
  onAssetsChange: () => void
  canvasRef: RefObject<HTMLDivElement | null>
  rulesApi: RecurringRulesApi
  /** 지금 미리보기에 실제로 칠해지는 글자색. 글자색 견본이 이걸 그대로 보여준다. */
  textColors: ResolvedTextColors
}

/**
 * 설정 12개를 탭 3개로 접는다.
 *
 * 이미지 저장은 탭에 넣지 않는다 — 가장 자주 쓰는 기능이라 지금까지
 * 맨 위에 있었고, 탭 뒤로 보내면 매번 한 번 더 눌러야 한다. 탭의 약점이
 * "안 보이는 탭에 뭐가 있는지 모른다"는 것이라, 매번 쓰는 것을 밖에 꺼내
 * 두면 그 약점이 닿는 범위가 줄어든다.
 *
 * 날짜별 일정은 여기 없다. 미리보기 달력 칸을 클릭해 편집한다.
 */
export function EditorPanel({
  api, userFonts, onUserFontsChange, onAssetsChange, canvasRef, rulesApi, textColors,
}: EditorPanelProps) {
  const [tab, setTab] = useState<EditorTabId>(loadEditorTab)

  const changeTab = (id: EditorTabId) => {
    setTab(id)
    saveEditorTab(id)
  }

  return (
    <div>
      <ExportPanel api={api} canvasRef={canvasRef} />

      <EditorTabs value={tab} onChange={changeTab} />

      {tab === 'calendar' && (
        <>
          <MonthPicker api={api} />
          <RecurringEditor api={api} rulesApi={rulesApi} />
        </>
      )}

      {tab === 'decorate' && (
        <>
          <ThemePicker api={api} />
          <TextColorPicker api={api} resolved={textColors} />
          <BackgroundPicker api={api} />
          <FontPicker api={api} userFonts={userFonts} onUserFontsChange={onUserFontsChange} />
          <StickerManager api={api} />
        </>
      )}

      {tab === 'sidebar' && <HeaderEditor api={api} />}

      <AssetLibrary onAssetsChange={onAssetsChange} />
    </div>
  )
}
