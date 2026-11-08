import type { Box } from './layout'
import { splitWall, type Opening } from './openings'

const vol = (b: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }) =>
  (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ)

const westWall: Box = { id: 'wallW', minX: -0.1, maxX: 0, minZ: -0.1, maxZ: 6.5, height: 3 }
const window: Opening = { wall: 'wallW', axis: 'z', min: 2.2, max: 3.2, minY: 1.0, maxY: 2.2 }

test('pieces fill the wall except the hole', () => {
  const pieces = splitWall(westWall, window)
  const wallVol = 0.1 * 3 * 6.6
  const holeVol = 0.1 * 1.2 * 1.0
  expect(pieces.reduce((s, p) => s + vol(p), 0)).toBeCloseTo(wallVol - holeVol)
})

test('no piece overlaps the hole', () => {
  for (const p of splitWall(westWall, window)) {
    const overlapZ = Math.min(p.maxZ, window.max) - Math.max(p.minZ, window.min)
    const overlapY = Math.min(p.maxY, window.maxY) - Math.max(p.minY, window.minY)
    expect(overlapZ > 1e-9 && overlapY > 1e-9).toBe(false)
  }
})

test('a hole along x splits an east-west wall', () => {
  const wall: Box = { id: 'kitchenWall', minX: 0, maxX: 1.95, minZ: 1.7, maxZ: 1.8, height: 3 }
  const hole: Opening = { wall: 'kitchenWall', axis: 'x', min: 0.7, max: 1.5, minY: 1.5, maxY: 2.1 }
  const pieces = splitWall(wall, hole)
  expect(pieces).toHaveLength(4)
  expect(pieces.reduce((s, p) => s + vol(p), 0)).toBeCloseTo(1.95 * 3 * 0.1 - 0.8 * 0.6 * 0.1)
})
