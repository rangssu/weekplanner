import { useEffect, type RefObject } from 'react'

/**
 * Tab 순서에 들어오는 것들. `[tabindex="-1"]`은 프로그램으로만 포커스할 수
 * 있는 자리라 "첫 컨트롤"로 치지 않는다.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * `role="dialog"` 상자가 열릴 때 포커스를 안으로 들이고, 닫힐 때 원래 자리로
 * 돌려준다. 상자에 `tabIndex={-1}`이 있어야 안에 포커스할 컨트롤이 없을 때
 * 상자 자신으로 떨어질 수 있다.
 *
 * 왜 필요한가: 날짜 편집 상자는 DOM상 날짜 칸 버튼 31개 **뒤에** 있다. 그
 * 순서는 스티커를 가리지 않으려고 일부러 잡은 것이라 바꿀 수 없다. 포커스를
 * 안 옮기면 1일 칸에서 Enter로 연 뒤 다음 Tab이 2일 칸으로 가서, 폼에 닿으려면
 * 남은 30개 칸을 모두 지나야 한다.
 *
 * 되돌리기에 조건이 붙는 이유: 포커스가 이미 상자 **바깥**으로 나갔다면
 * 그대로 둔다. 마우스로 바깥 컨트롤을 눌러 닫는 경우인데, 여기서 되돌리면
 * 방금 누른 컨트롤에서 포커스가 달력으로 튕겨 나간다.
 *
 * 상자 안에 포커스가 있는지를 cleanup 시점에 `document.activeElement`로 묻지
 * 않고 focusin으로 따로 추적한다 — cleanup이 도는 시점에 상자가 이미 DOM에서
 * 떨어져 있을 수 있어 그 판정이 항상 거짓이 된다.
 */
export function useDialogFocus(boxRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const box = boxRef.current
    if (box === null) return

    const previous = document.activeElement as HTMLElement | null
    let inside = true

    const onFocusIn = () => {
      inside = box.contains(document.activeElement)
    }
    document.addEventListener('focusin', onFocusIn)

    const first = box.querySelector<HTMLElement>(FOCUSABLE)
    if (first !== null) first.focus()
    else box.focus()
    inside = box.contains(document.activeElement)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      if (!inside) return
      // 열어 준 요소가 그새 사라졌으면 되돌릴 곳이 없다.
      if (previous === null || !document.contains(previous)) return
      previous.focus()
    }
  }, [boxRef])
}
