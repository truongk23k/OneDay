import { GAME_START, SPEED, advance, format } from './clock'

test('the day starts at 7:30', () => {
  expect(format(GAME_START)).toBe('7:30')
})

test('format floors to the minute', () => {
  expect(format(509.9)).toBe('8:29')
  expect(format(481)).toBe('8:01')
})

test('60 real seconds advance 8.5 game minutes', () => {
  expect(SPEED).toBe(8.5)
  expect(advance(450, 60)).toBeCloseTo(458.5)
})
