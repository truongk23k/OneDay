import { createTouchRouter, joystickVector } from './input'

describe('joystickVector', () => {
  test('dragging up by the full radius is full forward', () => {
    const v = joystickVector(0, -60, 60)
    expect(v.x).toBeCloseTo(0)
    expect(v.y).toBeCloseTo(1)
  })

  test('dragging past the radius is clamped to length 1', () => {
    const v = joystickVector(120, 0, 60)
    expect(v.x).toBeCloseTo(1)
    expect(v.y).toBeCloseTo(0)
  })

  test('dragging down is backward', () => {
    expect(joystickVector(0, 30, 60).y).toBeCloseTo(-0.5)
  })

  test('inside dead zone → {0,0}', () => {
    expect(joystickVector(5, 0, 60)).toEqual({ x: 0, y: 0 })
  })
})

describe('createTouchRouter', () => {
  test('left half moves, right half looks', () => {
    const r = createTouchRouter()
    expect(r.start(1, 100, 1000)).toBe('move')
    expect(r.start(2, 900, 1000)).toBe('look')
  })

  test('two pointers keep separate roles', () => {
    const r = createTouchRouter()
    r.start(1, 100, 1000)
    r.start(2, 900, 1000)
    r.end(1)
    expect(r.role(1)).toBeUndefined()
    expect(r.role(2)).toBe('look')
  })

  test('second left finger becomes look', () => {
    const r = createTouchRouter()
    r.start(1, 100, 1000)
    expect(r.start(2, 200, 1000)).toBe('look')
  })

  test('after the move finger lifts, a new left finger moves again', () => {
    const r = createTouchRouter()
    r.start(1, 100, 1000)
    r.end(1)
    expect(r.start(3, 150, 1000)).toBe('move')
  })
})
