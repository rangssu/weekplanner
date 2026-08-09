import { forwardRef } from 'react'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import { CalendarGrid } from './CalendarGrid'
import { Sidebar } from './Sidebar'
import { StickerLayer } from './StickerLayer'
import { TitleBar } from './TitleBar'
import {
  BODY_HEIGHT, CANVAS_HEIGHT, CANVAS_WIDTH, COLUMN_GAP, OUTER_PADDING, TITLE_GAP,
} from './layout'

export type ScheduleCanvasProps = {
  doc: ScheduleDoc
  /** 적용할 CSS font-family. App이 fontFamilyFor()로 계산해 넘긴다. */
  fontFamily: string
  /** 배경 이미지 data URL. null이면 테마 배경만 쓴다. */
  backgroundUrl: string | null
}

/**
 * 미리보기 루트이자 이미지 내보내기 대상 노드.
 *
 * 이 트리 안에서는 px 이외의 단위를 쓰지 않는다. 화면 크기에 반응하는 순간
 * 미리보기와 내보낸 이미지가 어긋난다. 축소는 부모(PreviewStage)가 담당한다.
 *
 * 배치: 위에 제목 줄, 아래는 왼쪽 사이드바 + 오른쪽 달력.
 */
export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  function ScheduleCanvas({ doc, fontFamily, backgroundUrl }, ref) {
    const theme = getTheme(doc.themeId)

    return (
      <div
        ref={ref}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: theme.pageBackground,
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
          backgroundSize: backgroundUrl ? `${CANVAS_WIDTH}px ${CANVAS_HEIGHT}px` : undefined,
          backgroundRepeat: backgroundUrl ? 'no-repeat' : undefined,
          backgroundPosition: backgroundUrl ? 'center' : undefined,
          padding: OUTER_PADDING,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: theme.bodyText,
          fontFamily,
        }}
      >
        <TitleBar header={doc.header} month={doc.month} theme={theme} />
        <div style={{ height: TITLE_GAP, flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: COLUMN_GAP, height: BODY_HEIGHT, flexShrink: 0 }}>
          <Sidebar header={doc.header} theme={theme} />
          <CalendarGrid doc={doc} theme={theme} />
        </div>

        <StickerLayer stickers={doc.stickers} />
      </div>
    )
  },
)
