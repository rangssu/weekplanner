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
