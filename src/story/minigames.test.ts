import { PLAQUE_COLS, PLAQUE_ROWS, WASH_ROUNDS, brushAt, cleanFraction, newPlaque, washLevel, washOk } from './minigames'

describe('wash: three rounds, faster and with a smaller target each time', () => {
  test('there are 3 rounds', () => {
    expect(WASH_ROUNDS).toHaveLength(3)
  })

  test('each round fills faster than the one before', () => {
    expect(WASH_ROUNDS[1].fullMs).toBeLessThan(WASH_ROUNDS[0].fullMs)
    expect(WASH_ROUNDS[2].fullMs).toBeLessThan(WASH_ROUNDS[1].fullMs)
  })

  test('each round has a smaller target zone', () => {
    const width = (r: (typeof WASH_ROUNDS)[number]) => r.zone[1] - r.zone[0]
    expect(width(WASH_ROUNDS[1])).toBeLessThan(width(WASH_ROUNDS[0]))
    expect(width(WASH_ROUNDS[2])).toBeLessThan(width(WASH_ROUNDS[1]))
  })

  test('level fills over the round duration and stops at 100', () => {
    expect(washLevel(800, 0)).toBeCloseTo(50)
    expect(washLevel(600, 1)).toBeCloseTo(50)
    expect(washLevel(5000, 2)).toBe(100)
  })

  test('release window follows the round', () => {
    expect(washOk(75, 0)).toBe(true)
    expect(washOk(75, 1)).toBe(false)
    expect(washOk(50, 1)).toBe(true)
    expect(washOk(75, 2)).toBe(true)
    expect(washOk(69.9, 2)).toBe(false)
  })
})

describe('brush: scratch the plaque off the teeth', () => {
  test('a new mouth has plenty of plaque and is deterministic per seed', () => {
    const a = newPlaque(7)
    expect(a.dirty.filter(Boolean).length).toBeGreaterThanOrEqual(40)
    expect(newPlaque(7).dirty).toEqual(a.dirty)
    expect(cleanFraction(a)).toBe(0)
  })

  test('brushing clears only the cells under the brush', () => {
    const p = newPlaque(3)
    const before = p.dirty.filter(Boolean).length
    const q = brushAt(p, 2, 2, 1.2)
    const cleared = before - q.dirty.filter(Boolean).length
    expect(cleared).toBeGreaterThan(0)
    expect(cleared).toBeLessThanOrEqual(9)
  })

  test('brushing over every tooth cleans the mouth', () => {
    let p = newPlaque(5)
    for (let y = 0.5; y < PLAQUE_ROWS; y += 1) for (let x = 0.5; x < PLAQUE_COLS; x += 1) p = brushAt(p, x, y, 1.2)
    expect(cleanFraction(p)).toBe(1)
  })
})
