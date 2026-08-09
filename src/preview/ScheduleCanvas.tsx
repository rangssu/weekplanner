import { forwardRef } from 'react'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import {
  CANVAS_BORDER_RADIUS, CANVAS_BORDER_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH, OUTER_PADDING,
} from './layout'

export type ScheduleCanvasProps = {
  doc: ScheduleDoc
}

/**
 * 미리보기 루트이자 이미지 내보내기 대상 노드.
 *
 * 이 트리 안에서는 px 이외의 단위를 쓰지 않는다. 화면 크기에 반응하는 순간
 * 미리보기와 내보낸 이미지가 어긋난다. 축소는 부모(PreviewStage)가 담당한다.
 */
export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  function ScheduleCanvas({ doc }, ref) {
    const theme = getTheme(doc.themeId)

    return (
      <div
        ref={ref}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: theme.pageBackground,
          backgroundImage: theme.patternCss,
          border: `${CANVAS_BORDER_WIDTH}px solid ${theme.borderColor}`,
          borderRadius: CANVAS_BORDER_RADIUS,
          padding: OUTER_PADDING,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: theme.bodyText,
        }}
      />
    )
  },
)
