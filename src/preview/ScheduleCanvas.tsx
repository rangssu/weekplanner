import { forwardRef } from 'react'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import { CalendarGrid } from './CalendarGrid'
import { Header } from './Header'
import { StickerLayer } from './StickerLayer'
import {
  CANVAS_BORDER_RADIUS, CANVAS_BORDER_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH, OUTER_PADDING,
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
          // 배경 이미지가 있으면 테마 무늬 대신 그것을 깐다.
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : theme.patternCss,
          backgroundSize: backgroundUrl ? `${CANVAS_WIDTH}px ${CANVAS_HEIGHT}px` : undefined,
          backgroundRepeat: backgroundUrl ? 'no-repeat' : undefined,
          backgroundPosition: backgroundUrl ? 'center' : undefined,
          border: `${CANVAS_BORDER_WIDTH}px solid ${theme.borderColor}`,
          borderRadius: CANVAS_BORDER_RADIUS,
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
        <Header header={doc.header} year={doc.year} month={doc.month} theme={theme} />
        <CalendarGrid doc={doc} theme={theme} />
        {/* 원본 PSD 레이어 순서를 따라 격자 위에 얹는다. */}
        <StickerLayer stickers={doc.stickers} />
      </div>
    )
  },
)
