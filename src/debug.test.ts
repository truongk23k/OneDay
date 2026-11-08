import { FpsMeter, isDebug } from './debug'

describe('isDebug', () => {
  test.each([
    ['?debug', true],
    ['?debug=1', true],
    ['?a=1&debug=1', true],
    ['', false],
    ['?debugger=1', false],
    ['?a=debug', false],
  ])('%s → %s', (search, expected) => {
    expect(isDebug(search)).toBe(expected)
  })
})

describe('FpsMeter', () => {
  test('60 frames 16.7 ms apart read as about 60 fps', () => {
    const m = new FpsMeter()
    let fps = 0
    for (let i = 0; i < 60; i++) fps = m.tick(1000 + i * 16.7)
    expect(fps).toBeGreaterThanOrEqual(59)
    expect(fps).toBeLessThanOrEqual(61)
  })

  test('only the last second counts', () => {
    const m = new FpsMeter()
    for (let i = 0; i < 60; i++) m.tick(i * 16.7)
    // A 2-second stall, then one frame: the old frames are out of the window.
    expect(m.tick(60 * 16.7 + 2000)).toBe(1)
  })
})
