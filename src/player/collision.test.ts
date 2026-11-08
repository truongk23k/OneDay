import type { Box } from '../room/layout'
import { cameraDistance, rayBoxDistance, resolveCircleBoxes } from './collision'

const b = (minX: number, maxX: number, minZ: number, maxZ: number, height = 1): Box => ({
  id: 't',
  minX,
  maxX,
  minZ,
  maxZ,
  height,
})

describe('resolveCircleBoxes', () => {
  test('circle outside box is unchanged', () => {
    expect(resolveCircleBoxes({ x: 0, z: 0 }, 0.25, [b(1, 2, 1, 2)])).toEqual({ x: 0, z: 0 })
  })

  test('circle overlapping box east face is pushed to x = maxX + r', () => {
    const p = resolveCircleBoxes({ x: 2.1, z: 1.5 }, 0.25, [b(1, 2, 1, 2)])
    expect(p.x).toBeCloseTo(2.25)
    expect(p.z).toBeCloseTo(1.5)
  })

  test('circle in a corner between two boxes ends outside both', () => {
    const boxes = [b(0, 1, 0, 3), b(0, 3, 0, 1)]
    const p = resolveCircleBoxes({ x: 1.1, z: 1.1 }, 0.25, boxes)
    expect(p.x).toBeGreaterThanOrEqual(1.25 - 1e-6)
    expect(p.z).toBeGreaterThanOrEqual(1.25 - 1e-6)
  })

  test('centre inside a box is pushed out through the nearest face', () => {
    const p = resolveCircleBoxes({ x: 1.9, z: 1.5 }, 0.25, [b(1, 2, 1, 2)])
    expect(p.x).toBeCloseTo(2.25)
  })
})

describe('rayBoxDistance', () => {
  test('hits a box straight ahead', () => {
    expect(rayBoxDistance([0, 0.5, 0], [0, 0, 1], b(-1, 1, 2, 3))).toBeCloseTo(2)
  })

  test('misses a box behind the ray', () => {
    expect(rayBoxDistance([0, 0.5, 0], [0, 0, 1], b(-1, 1, -3, -2))).toBeNull()
  })

  test('passes over a box lower than the ray', () => {
    expect(rayBoxDistance([0, 1.5, 0], [0, 0, 1], b(-1, 1, 2, 3, 1))).toBeNull()
  })
})

describe('cameraDistance', () => {
  const wallS = b(-0.1, 4.3, 5.0, 5.1, 3)

  test('camera distance stops before wall', () => {
    expect(cameraDistance([2, 1.4, 2.5], [0, 0, 1], 3.2, [wallS])).toBeCloseTo(2.3)
  })

  test('no obstacle keeps the full distance', () => {
    expect(cameraDistance([2, 1.4, 2.5], [0, 0, 1], 3.2, [])).toBeCloseTo(3.2)
  })

  test('a very close wall clamps to the minimum distance', () => {
    expect(cameraDistance([2, 1.4, 2.5], [0, 0, 1], 3.2, [b(-1, 5, 2.8, 2.9, 3)])).toBeCloseTo(0.4)
  })
})

test('ceiling limits the distance when the camera rises', () => {
  const s = Math.SQRT1_2
  // 1.6 m to the ceiling along a 45° ray = 2.263 m, minus the 0.2 m margin.
  expect(cameraDistance([2, 1.4, 2.5], [0, s, s], 3.2, [], 3.0)).toBeCloseTo(2.063, 2)
})
