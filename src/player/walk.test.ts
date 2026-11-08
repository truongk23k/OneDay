import { COLLIDERS, SPAWN, type Box, type Vec2 } from '../room/layout'
import { resolveCircleBoxes } from './collision'
import { moveVector } from './movement'

const R = 0.25
const SPEED = 2.2
const DT = 1 / 60

const distToBox = (p: Vec2, b: Box) =>
  Math.hypot(Math.max(b.minX - p.x, 0, p.x - b.maxX), Math.max(b.minZ - p.z, 0, p.z - b.maxZ))

// Same per-frame step as Player: move along the input, then push out of colliders.
function walk(route: Vec2[], start: Vec2 = { x: SPAWN.x, z: SPAWN.z }) {
  let p: Vec2 = { ...start }
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

test('walks from spawn through the passage into the bathroom to the lavabo', () => {
  const { p, minClearance } = walk([
    { x: 2.45, z: 3.4 },
    { x: 2.45, z: 0.5 },
    { x: 3.2, z: 0.55 },
    { x: 3.75, z: 0.7 },
  ])
  expect(Math.hypot(p.x - 3.75, p.z - 0.7)).toBeLessThan(0.1)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})

test('walks from spawn to the wardrobe', () => {
  const { p, minClearance } = walk([
    { x: 2.45, z: 3.6 },
    { x: 1.5, z: 4.6 },
    { x: 0.95, z: 5.4 },
  ])
  expect(Math.hypot(p.x - 0.95, p.z - 5.4)).toBeLessThan(0.1)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})

test('walks from spawn through the passage into the kitchen', () => {
  const { p } = walk([
    { x: 2.45, z: 3.4 },
    { x: 2.45, z: 0.7 },
    { x: 1.0, z: 0.7 },
  ])
  expect(Math.hypot(p.x - 1.0, p.z - 0.7)).toBeLessThan(0.1)
})

test('the partition blocks walking straight from the roommate desk to the kitchen', () => {
  const { p } = walk([{ x: 1.1, z: 1.0 }], { x: 1.1, z: 2.15 })
  expect(p.z).toBeGreaterThan(1.8)
})

test('walking into the bed stops at the bed edge', () => {
  const { p, minClearance } = walk([{ x: 4.4, z: 5.5 }])
  expect(p.z).toBeCloseTo(4.2 - R, 2)
  expect(minClearance).toBeGreaterThanOrEqual(R - 1e-6)
})
