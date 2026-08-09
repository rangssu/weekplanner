import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DayEditor } from './DayEditor'
import { MonthPicker } from './MonthPicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
}

export function EditorPanel({ api }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <DayEditor api={api} />
    </div>
  )
}
