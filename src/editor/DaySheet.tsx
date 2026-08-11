import { useEffect, type ReactNode } from 'react'

export type DaySheetProps = {
  onClose: () => void
  children: ReactNode
}

/**
 * 화면 아래에서 올라오는 편집 시트. 좁은 화면에서만 쓴다.
 *
 * 폼 높이가 약 420px이라 작은 폰(667px)에서는 화면의 55%로 잡으면 안
 * 들어간다. 75%까지 열어 두고 넘치면 시트 안에서 스크롤한다. 폰에서만
 * 아이콘을 접으면 폼이 화면 크기에 따라 두 모습을 갖게 되므로 그 길은
 * 택하지 않았다.
 *
 * .app-editor에 transform이 걸려 있지 않아 position: fixed가 정상 동작한다.
 */
export function DaySheet({ onClose, children }: DaySheetProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label="날짜 편집"
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        maxHeight: '75vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: 12,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderTop: '2px solid #2563eb',
        background: '#ffffff',
        boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.18)',
        zIndex: 30,
      }}
    >
      {children}
    </div>
  )
}
