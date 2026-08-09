import { useState } from 'react'
import {
  applyRecurringRules, clearRecurringRules, countClearTargets, countRuleTargets,
  createRecurringRule, type ApplyMode, type RecurringRule,
} from '../model/recurring'
import type { RecurringRulesApi } from '../state/useRecurringRules'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme } from '../theme/themes'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type RecurringEditorProps = {
  api: ScheduleDocApi
  rulesApi: RecurringRulesApi
}

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export function RecurringEditor({ api, rulesApi }: RecurringEditorProps) {
  const { doc, setDoc } = api
  const { rules, setRules } = rulesApi
  const theme = getTheme(doc.themeId)
  const [notice, setNotice] = useState('')

  const patchRule = (id: string, patch: Partial<RecurringRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const toggleWeekday = (rule: RecurringRule, dow: number) =>
    patchRule(rule.id, {
      weekdays: rule.weekdays.includes(dow)
        ? rule.weekdays.filter((d) => d !== dow)
        : [...rule.weekdays, dow].sort(),
    })

  const apply = (mode: ApplyMode) => {
    const count = countRuleTargets(doc, rules, mode)
    if (count === 0) {
      setNotice('채울 칸이 없습니다. 요일과 내용을 확인해 주세요.')
      return
    }
    setDoc((prev) => applyRecurringRules(prev, rules, mode))
    setNotice(`${count}칸을 채웠습니다.`)
  }

  const clear = () => {
    const count = countClearTargets(doc, rules)
    if (count === 0) {
      setNotice('지울 칸이 없습니다. 규칙 내용과 칸의 내용이 정확히 같아야 지워집니다.')
      return
    }
    setDoc((prev) => clearRecurringRules(prev, rules))
    setNotice(`${count}칸을 비웠습니다.`)
  }

  const fillCount = countRuleTargets(doc, rules, 'fill-empty')
  const overwriteCount = countRuleTargets(doc, rules, 'overwrite')
  const clearCount = countClearTargets(doc, rules)

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>반복 일정</h2>
      <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 10px' }}>
        고정 요일 방송을 한 번 적어두면 매달 버튼 한 번으로 채웁니다.
        규칙은 다음 달로 넘어가도 그대로 남습니다.
        지우기는 칸 내용이 규칙과 정확히 같을 때만 동작합니다.
      </p>

      {rules.map((rule, index) => (
        <div
          key={rule.id}
          style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10, marginTop: 10 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3f3f46' }}>
              규칙 {index + 1}
              {index > 0 && (
                <span style={{ fontWeight: 400, color: '#a1a1aa' }}> · 위 규칙이 우선</span>
              )}
            </span>
            <button
              type="button"
              style={buttonStyle}
              onClick={() =>
                setRules((prev) => prev.filter((r) => r.id !== rule.id))
              }
            >
              삭제
            </button>
          </div>

          <label style={{ ...fieldLabelStyle, marginTop: 8 }}>요일</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {DOW_KO.map((label, dow) => {
              const on = rule.weekdays.includes(dow)
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleWeekday(rule, dow)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    border: on ? '2px solid #18181b' : '1px solid #d4d4d8',
                    background: on ? '#18181b' : '#ffffff',
                    color: on ? '#ffffff' : dow === 0 ? '#c0392b' : dow === 6 ? '#2563eb' : '#3f3f46',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor={`rule-text-${rule.id}`}>
            칸에 들어갈 내용
          </label>
          <textarea
            id={`rule-text-${rule.id}`}
            style={{ ...inputStyle, minHeight: 52, resize: 'none' }}
            value={rule.text}
            placeholder={'예)\n발로란트 랭크\n21:00'}
            onChange={(e) => patchRule(rule.id, { text: e.target.value })}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0 }}>칸 배경</span>
            <button
              type="button"
              aria-label="칸 배경 없음"
              onClick={() => patchRule(rule.id, { cellFill: null })}
              style={{
                width: 22, height: 22, borderRadius: 4, cursor: 'pointer', padding: 0,
                border: rule.cellFill === null ? '2px solid #18181b' : '1px solid #d4d4d8',
                background: '#ffffff', fontSize: 12, lineHeight: 1,
              }}
            >
              ×
            </button>
            {theme.accents.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`칸 배경 ${color}`}
                onClick={() => patchRule(rule.id, { cellFill: color })}
                style={{
                  width: 22, height: 22, borderRadius: 4, cursor: 'pointer', padding: 0,
                  border: rule.cellFill === color ? '2px solid #18181b' : '1px solid #d4d4d8',
                  background: color,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        style={{ ...buttonStyle, marginTop: 12 }}
        onClick={() =>
          setRules((prev) => [...prev, createRecurringRule(prev)])
        }
      >
        규칙 추가
      </button>

      {rules.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => apply('fill-empty')}>
            빈 칸만 채우기 ({fillCount})
          </button>
          <button type="button" style={buttonStyle} onClick={() => apply('overwrite')}>
            전부 덮어쓰기 ({overwriteCount})
          </button>
          <button type="button" style={buttonStyle} onClick={clear}>
            규칙 지우기 ({clearCount})
          </button>
        </div>
      )}

      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 8 }}>{notice}</p>}
    </section>
  )
}
