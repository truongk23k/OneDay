import { GAME_START, SPEED, advance, format, ANH_DEADLINE, EM_DEADLINE } from './clock'

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

test('deadlines: Em starts work at 8:45, Anh at 9:00', () => {
  expect(format(EM_DEADLINE)).toBe('8:45')
  expect(format(ANH_DEADLINE)).toBe('9:00')
})
