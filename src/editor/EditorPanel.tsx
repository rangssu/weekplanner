import type { ScheduleDocApi } from '../state/useScheduleDoc'
import type { FontOption } from '../theme/fonts'
import { DayEditor } from './DayEditor'
import { FontPicker } from './FontPicker'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
}

export function EditorPanel({ api, userFonts, onUserFontsChange }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <ThemePicker api={api} />
      <FontPicker api={api} userFonts={userFonts} onUserFontsChange={onUserFontsChange} />
      <HeaderEditor api={api} />
      <DayEditor api={api} />
    </div>
  )
}
