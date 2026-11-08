import type { Box } from './layout'
import { splitWall, type Opening } from './openings'

const vol = (b: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }) =>
  (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ)

const westWall: Box = { id: 'wallW', minX: -0.1, maxX: 0, minZ: -0.1, maxZ: 6.5, height: 3 }
const window: Opening = { wall: 'wallW', axis: 'z', min: 2.2, max: 3.2, minY: 1.0, maxY: 2.2 }

test('pieces fill the wall except the hole', () => {
  const pieces = splitWall(westWall, [window])
  const wallVol = 0.1 * 3 * 6.6
  const holeVol = 0.1 * 1.2 * 1.0
  expect(pieces.reduce((s, p) => s + vol(p), 0)).toBeCloseTo(wallVol - holeVol)
})

test('no piece overlaps the hole', () => {
  for (const p of splitWall(westWall, [window])) {
    const overlapZ = Math.min(p.maxZ, window.max) - Math.max(p.minZ, window.min)
    const overlapY = Math.min(p.maxY, window.maxY) - Math.max(p.minY, window.minY)
    expect(overlapZ > 1e-9 && overlapY > 1e-9).toBe(false)
  }
})

test('a hole along x splits an east-west wall', () => {
  const wall: Box = { id: 'kitchenWall', minX: 0, maxX: 1.95, minZ: 1.7, maxZ: 1.8, height: 3 }
  const hole: Opening = { wall: 'kitchenWall', axis: 'x', min: 0.7, max: 1.5, minY: 1.5, maxY: 2.1 }
  const pieces = splitWall(wall, [hole])
  expect(pieces).toHaveLength(4)
  expect(pieces.reduce((s, p) => s + vol(p), 0)).toBeCloseTo(1.95 * 3 * 0.1 - 0.8 * 0.6 * 0.1)
})

test('a wall with a door and a loft opening above it keeps the wall between them', () => {
  const wall: Box = { id: 'bathWallW', minX: 2.95, maxX: 3.05, minZ: 0, maxZ: 1.7, height: 3 }
  const door: Opening = { wall: 'bathWallW', axis: 'z', min: 0.325, max: 1.125, minY: 0, maxY: 2.0 }
  const loft: Opening = { wall: 'bathWallW', axis: 'z', min: 0.1, max: 0.95, minY: 2.4, maxY: 2.95 }
  const pieces = splitWall(wall, [door, loft])
  const holes = 0.8 * 2.0 + 0.85 * 0.55
  expect(pieces.reduce((s, p) => s + vol(p), 0)).toBeCloseTo((1.7 * 3 - holes) * 0.1)
  for (const p of pieces) {
    for (const h of [door, loft]) {
      const oz = Math.min(p.maxZ, h.max) - Math.max(p.minZ, h.min)
      const oy = Math.min(p.maxY, h.maxY) - Math.max(p.minY, h.minY)
      expect(oz > 1e-9 && oy > 1e-9).toBe(false)
    }
  }
  // Có tường ngay trên khung cửa (dải từ 2.0 tới 2.4 m).
  expect(pieces.some((p) => p.minY <= 2.0 + 1e-9 && p.maxY >= 2.4 - 1e-9 && p.minZ <= 0.5 && p.maxZ >= 0.5)).toBe(true)
})
