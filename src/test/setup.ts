import 'fake-indexeddb/auto'

/**
 * jsdom에는 `document.fonts`(CSS Font Loading API)가 없다.
 *
 * AutoFitText가 폰트 로딩이 끝나면 글자 크기를 다시 재려고 이 API를 쓴다.
 * 없으면 그 컴포넌트를 그리는 순간 터져서, 미리보기 쪽 컴포넌트 테스트를
 * 아예 쓸 수 없다. 실제로 재는 일은 jsdom이 못 하므로 "이미 다 불러왔다"로
 * 답하는 최소 구현만 둔다.
 */
if (document.fonts === undefined) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  })
}

/**
 * jsdom에는 window.matchMedia가 없다.
 *
 * useIsNarrow가 화면 폭을 물어보는 데 쓴다. jsdom은 실제 레이아웃이 없어
 * 폭을 잴 수 없으므로 "넓은 화면"으로 답하는 최소 구현만 둔다.
 * 좁은 화면 동작은 테스트마다 이 값을 갈아끼워 확인한다.
 */
if (window.matchMedia === undefined) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
