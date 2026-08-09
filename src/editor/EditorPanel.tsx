import type { RefObject } from 'react'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import type { FontOption } from '../theme/fonts'
import { BackgroundPicker } from './BackgroundPicker'
import { DayEditor } from './DayEditor'
import { ExportPanel } from './ExportPanel'
import { FontPicker } from './FontPicker'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { StickerManager } from './StickerManager'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
  canvasRef: RefObject<HTMLDivElement | null>
}

export function EditorPanel({ api, userFonts, onUserFontsChange, canvasRef }: EditorPanelProps) {
  return (
    <div>
      {/* 가장 자주 쓰는 기능이라 맨 위에 둔다. */}
      <ExportPanel api={api} canvasRef={canvasRef} />
      <MonthPicker api={api} />
      <ThemePicker api={api} />
      <BackgroundPicker api={api} />
      <StickerManager api={api} />
      <FontPicker api={api} userFonts={userFonts} onUserFontsChange={onUserFontsChange} />
      <HeaderEditor api={api} />
      <DayEditor api={api} />
    </div>
  )
}
