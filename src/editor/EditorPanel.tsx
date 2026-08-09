import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DayEditor } from './DayEditor'
import { FooterEditor } from './FooterEditor'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
}

export function EditorPanel({ api }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <ThemePicker api={api} />
      <HeaderEditor api={api} />
      <DayEditor api={api} />
      <FooterEditor api={api} />
    </div>
  )
}
