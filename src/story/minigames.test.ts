import { WASH_FULL_MS, newScrub, scrub, washLevel, washOk } from './minigames'

test('alternating strokes fill the bar in 20 strokes', () => {
  let s = newScrub()
  for (let i = 0; i < 20; i++) s = scrub(s, i % 2 === 0 ? 1 : -1)
  expect(s.progress).toBeCloseTo(1)
})

test("same-direction strokes don't count twice", () => {
  let s = newScrub()
  for (let i = 0; i < 10; i++) s = scrub(s, 1)
  expect(s.progress).toBeCloseTo(0.05)
})

test('progress never goes past 1', () => {
  let s = newScrub()
  for (let i = 0; i < 40; i++) s = scrub(s, i % 2 === 0 ? 1 : -1)
  expect(s.progress).toBe(1)
})

test('wash level fills over 1.6 s and stops at 100', () => {
  expect(WASH_FULL_MS).toBe(1600)
  expect(washLevel(800)).toBeCloseTo(50)
  expect(washLevel(5000)).toBe(100)
})

test('wash release window is 60–85', () => {
  expect(washOk(59.9)).toBe(false)
  expect(washOk(60)).toBe(true)
  expect(washOk(85)).toBe(true)
  expect(washOk(85.1)).toBe(false)
})
