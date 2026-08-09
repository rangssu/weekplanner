import { useCallback, useState } from 'react'
import {
  loadRecurringRules, type RecurringRule, saveRecurringRules,
} from '../model/recurring'

export type RecurringRulesApi = {
  rules: RecurringRule[]
  setRules: (updater: (prev: RecurringRule[]) => RecurringRule[]) => void
}

/**
 * 요일 반복 규칙 상태.
 *
 * 월별 문서와 **분리해서** 전역으로 보관한다. 규칙은 "이 달의 데이터"가 아니라
 * "이 사람의 방송 패턴"이라, 문서에 넣으면 달을 바꿀 때마다 사라진다.
 *
 * 규칙은 크기가 작고 편집이 드물어 디바운스 없이 바로 저장한다.
 */
export function useRecurringRules(): RecurringRulesApi {
  const [rules, setRulesState] = useState<RecurringRule[]>(() => loadRecurringRules())

  const setRules = useCallback((updater: (prev: RecurringRule[]) => RecurringRule[]) => {
    setRulesState((prev) => {
      const next = updater(prev)
      saveRecurringRules(next)
      return next
    })
  }, [])

  return { rules, setRules }
}
