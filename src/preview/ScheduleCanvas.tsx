import { forwardRef } from 'react'
import type { ResolvedTextColors } from '../model/textColors'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import { CalendarGrid } from './CalendarGrid'
import { Sidebar } from './Sidebar'
import { StickerLayer } from './StickerLayer'
import { TitleBar } from './TitleBar'
import {
  CANVAS_CONTENT_HEIGHT, CANVAS_HEIGHT, CANVAS_WIDTH, COLUMN_GAP, OUTER_PADDING,
  SIDEBAR_WIDTH, TITLE_GAP,
} from './layout'

export type ScheduleCanvasProps = {
  doc: ScheduleDoc
  /** 적용할 CSS font-family. App이 fontFamilyFor()로 계산해 넘긴다. */
  fontFamily: string
  /** 배경 이미지 data URL. null이면 테마 배경만 쓴다. */
  backgroundUrl: string | null
  /** 영역별 글자색 5개. App이 resolveTextColors()로 계산해 넘긴다. */
  textColors: ResolvedTextColors
}

/**
 * 미리보기 루트이자 이미지 내보내기 대상 노드.
 *
 * 이 트리 안에서는 px 이외의 단위를 쓰지 않는다. 화면 크기에 반응하는 순간
 * 미리보기와 내보낸 이미지가 어긋난다. 축소는 부모(PreviewStage)가 담당한다.
 *
 * 배치: 왼쪽 열(제목 + 사이드바)과 오른쪽 달력이 나란하다. 제목이 왼쪽 열
 * 안으로 들어간 덕에 달력이 캔버스 세로 전체를 쓴다.
 */
export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  function ScheduleCanvas({ doc, fontFamily, backgroundUrl, textColors }, ref) {
    const theme = getTheme(doc.themeId)

    return (
      <div
        ref={ref}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          /*
            단축 속성 `background`를 쓰면 안 된다. 테마를 바꾸면 이 값만 달라지는데,
            React는 바뀐 속성만 다시 쓰고 단축 속성은 background-image까지 초기화한다.
            backgroundImage는 값이 그대로라 다시 안 써지므로 배경 그림이 사라진다.
          */
          backgroundColor: theme.pageBackground,
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
        {/*
          왼쪽 열은 제목 + 사이드바, 오른쪽은 달력.
          제목을 전체 폭으로 가로지르지 않는 덕에 달력이 캔버스 세로를 다 쓴다.
        */}
        <div style={{ display: 'flex', gap: COLUMN_GAP, height: CANVAS_CONTENT_HEIGHT }}>
          <div
            style={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TitleBar
              header={doc.header}
              month={doc.month}
              textColor={textColors.title}
            />
            <div style={{ height: TITLE_GAP, flexShrink: 0 }} />
            <Sidebar
              header={doc.header}
              theme={theme}
              bgOpacity={doc.sidebarOpacity}
              textColors={{ goal: textColors.goal, todo: textColors.todo, memo: textColors.memo }}
            />
          </div>

          <CalendarGrid doc={doc} theme={theme} textColor={textColors.calendar} />
        </div>

        <StickerLayer stickers={doc.stickers} />
      </div>
    )
  },
)
