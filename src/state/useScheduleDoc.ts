import { useCallback, useEffect, useRef, useState } from 'react'
import { previousMonth } from '../model/calendar'
import { copyMonthDays } from '../model/copyMonth'
import { createEmptyDoc } from '../model/defaults'
import { loadDoc, saveDoc } from '../model/storage'
import type { ScheduleDoc } from '../model/types'

/** 타이핑 도중 매 글자마다 저장하지 않도록 두는 지연 */
export const AUTOSAVE_DELAY_MS = 400

export type SaveErrorReason = 'quota' | 'unknown'

export type ScheduleDocApi = {
  doc: ScheduleDoc
  setDoc: (updater: (prev: ScheduleDoc) => ScheduleDoc) => void
  goToMonth: (year: number, month: number) => void
  /** 이전 달 문서가 없으면 'no-source'를 주고 아무것도 바꾸지 않는다. */
  copyFromPreviousMonth: () => 'ok' | 'no-source'
  saveError: SaveErrorReason | null
}

function openMonth(year: number, month: number): ScheduleDoc {
  return loadDoc(year, month) ?? createEmptyDoc(year, month)
}

export function useScheduleDoc(initialYear: number, initialMonth: number): ScheduleDocApi {
  const [doc, setDocState] = useState<ScheduleDoc>(() => openMonth(initialYear, initialMonth))
  const [saveError, setSaveError] = useState<SaveErrorReason | null>(null)

  // 항상 최신 문서를 가리킨다. 월 전환 시 즉시 저장하는 데 쓴다.
  const docRef = useRef(doc)
  docRef.current = doc

  const dirtyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((target: ScheduleDoc) => {
    if (!dirtyRef.current) return
    const result = saveDoc(target)
    setSaveError(result.ok ? null : result.reason)
    dirtyRef.current = false
  }, [])

  const setDoc = useCallback((updater: (prev: ScheduleDoc) => ScheduleDoc) => {
    dirtyRef.current = true
    setDocState(updater)
  }, [])

  // 변경 후 잠시 조용하면 저장한다.
  useEffect(() => {
    if (!dirtyRef.current) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => persist(docRef.current), AUTOSAVE_DELAY_MS)
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [doc, persist])

  const goToMonth = useCallback(
    (year: number, month: number) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      // 전환 전에 반드시 저장한다. 안 그러면 지연 시간 안에 바꾼 내용이 사라진다.
      persist(docRef.current)
      setDocState(openMonth(year, month))
    },
    [persist],
  )

  const copyFromPreviousMonth = useCallback((): 'ok' | 'no-source' => {
    const current = docRef.current
    const prev = previousMonth(current.year, current.month)
    const source = loadDoc(prev.year, prev.month)
    if (!source) return 'no-source'
    setDoc(() => copyMonthDays(source, current.year, current.month))
    return 'ok'
  }, [setDoc])

  return { doc, setDoc, goToMonth, copyFromPreviousMonth, saveError }
}
