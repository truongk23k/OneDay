import { COLLIDERS, SPAWN, type Box, type Vec2 } from '../room/layout'
import { resolveCircleBoxes } from './collision'
import { moveVector } from './movement'

const R = 0.25
const SPEED = 2.2
const DT = 1 / 60

const distToBox = (p: Vec2, b: Box) =>
  Math.hypot(Math.max(b.minX - p.x, 0, p.x - b.maxX), Math.max(b.minZ - p.z, 0, p.z - b.maxZ))

// Same per-frame step as Player: move along the input, then push out of colliders.
function walk(route: Vec2[]) {
  let p: Vec2 = { x: SPAWN.x, z: SPAWN.z }
  let minClearance = Infinity
  for (const target of route) {
    for (let frame = 0; frame < 600; frame++) {
      const dx = target.x - p.x
      const dz = target.z - p.z
      if (Math.hypot(dx, dz) < 0.05) break
      const v = moveVector({ x: dx, y: -dz }, 0)
      p = resolveCircleBoxes({ x: p.x + v.x * SPEED * DT, z: p.z + v.z * SPEED * DT }, R, COLLIDERS)
      for (const b of COLLIDERS) minClearance = Math.min(minClearance, distToBox(p, b))
    }
  }
  return { p, minClearance }
}

test('walks from spawn into the bathroom to the lavabo', () => {
  const { p, minClearance } = walk([
    { x: 2.0, z: 2.6 },
    { x: 2.0, z: 1.0 },
    { x: 2.9, z: 0.95 },
    { x: 3.0, z: 0.7 },
  ])
  expect(Math.hypot(p.x - 3.0, p.z - 0.7)).toBeLessThan(0.1)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})

test('walks from spawn to the wardrobe', () => {
  const { p, minClearance } = walk([
    { x: 2.0, z: 2.6 },
    { x: 1.2, z: 3.4 },
    { x: 0.95, z: 4.3 },
  ])
  expect(Math.hypot(p.x - 0.95, p.z - 4.3)).toBeLessThan(0.1)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})

test('walking into the bed stops at the bed edge', () => {
  const { p, minClearance } = walk([{ x: 3.0, z: 4.5 }])
  expect(p.z).toBeCloseTo(3.0 - R, 2)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})
