import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type FooterEditorProps = {
  api: ScheduleDocApi
}

export function FooterEditor({ api }: FooterEditorProps) {
  const { doc, setDoc } = api

  const patchFooter = (patch: Partial<typeof doc.footer>) =>
    setDoc((prev) => ({ ...prev, footer: { ...prev.footer, ...patch } }))

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>하단 문구</h2>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={doc.footer.enabled}
          onChange={(e) => patchFooter({ enabled: e.target.checked })}
        />
        표시
      </label>
      {doc.footer.enabled && (
        <input
          style={{ ...inputStyle, marginTop: 6 }}
          value={doc.footer.text}
          placeholder="*방송 시간은 변경될 수 있어요 :D"
          onChange={(e) => patchFooter({ text: e.target.value })}
        />
      )}
    </section>
  )
}
