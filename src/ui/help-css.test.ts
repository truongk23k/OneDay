import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')

// iOS ignores user-scalable=no; a scroll container resets touch-action, so the panel must opt out of pinch-zoom.
test('help panel only allows vertical scrolling, not pinch-zoom', () => {
  expect(css).toMatch(/\.help-panel\s*\{[^}]*touch-action:\s*pan-y/)
  expect(css).toMatch(/\.help-panel\s*\{[^}]*overscroll-behavior:\s*contain/)
})
