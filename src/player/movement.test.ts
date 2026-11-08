import { clampDelta, moveVector } from './movement'

test('forward at yaw 0 is north (-z)', () => {
  const v = moveVector({ x: 0, y: 1 }, 0)
  expect(v.x).toBeCloseTo(0)
  expect(v.z).toBeCloseTo(-1)
})

test('right at yaw 0 is east (+x)', () => {
  const v = moveVector({ x: 1, y: 0 }, 0)
  expect(v.x).toBeCloseTo(1)
  expect(v.z).toBeCloseTo(0)
})

test('forward at yaw 90° is west (-x)', () => {
  const v = moveVector({ x: 0, y: 1 }, Math.PI / 2)
  expect(v.x).toBeCloseTo(-1)
  expect(v.z).toBeCloseTo(0)
})

test('diagonal has length 1', () => {
  const v = moveVector({ x: 1, y: 1 }, 0.3)
  expect(Math.hypot(v.x, v.z)).toBeCloseTo(1)
})

test('half-tilted joystick keeps its length', () => {
  const v = moveVector({ x: 0, y: 0.5 }, 0)
  expect(Math.hypot(v.x, v.z)).toBeCloseTo(0.5)
})

test('clampDelta caps at 0.05', () => {
  expect(clampDelta(2)).toBe(0.05)
  expect(clampDelta(0.016)).toBe(0.016)
})
