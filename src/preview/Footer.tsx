import type { Theme } from '../theme/themes'
import { FOOTER_HEIGHT, FOOTER_TEXT_SIZE } from './layout'

export type FooterProps = {
  text: string
  theme: Theme
}

export function Footer({ text, theme }: FooterProps) {
  return (
    <div
      style={{
        height: FOOTER_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: FOOTER_TEXT_SIZE,
        color: theme.bodyText,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  )
}
