import { COLLIDERS, FURNITURE, ROOM, SPAWN, type Box } from './layout'

const R = 0.25

function distToBox(x: number, z: number, b: Box) {
  const dx = Math.max(b.minX - x, 0, x - b.maxX)
  const dz = Math.max(b.minZ - z, 0, z - b.maxZ)
  return Math.hypot(dx, dz)
}

function free(x: number, z: number) {
  return COLLIDERS.every((b) => distToBox(x, z, b) >= R)
}

// Flood fill on a 5 cm grid from the spawn point over cells the player can stand in.
function reachableSet() {
  const step = 0.05
  const nx = Math.round(ROOM.width / step)
  const nz = Math.round(ROOM.depth / step)
  const seen = new Uint8Array(nx * nz)
  const cell = (x: number, z: number) => [Math.floor(x / step), Math.floor(z / step)] as const
  const [sx, sz] = cell(SPAWN.x, SPAWN.z)
  const queue: [number, number][] = [[sx, sz]]
  seen[sz * nx + sx] = 1
  while (queue.length) {
    const [i, j] = queue.pop()!
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di
      const b = j + dj
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen[b * nx + a]) continue
      if (!free((a + 0.5) * step, (b + 0.5) * step)) continue
      seen[b * nx + a] = 1
      queue.push([a, b])
    }
  }
  return (x: number, z: number) => {
    const [i, j] = cell(x, z)
    return seen[j * nx + i] === 1
  }
}

test('every furniture box lies inside the room interior', () => {
  for (const f of FURNITURE) {
    expect(f.minX, f.id).toBeGreaterThanOrEqual(0)
    expect(f.minZ, f.id).toBeGreaterThanOrEqual(0)
    expect(f.maxX, f.id).toBeLessThanOrEqual(ROOM.width)
    expect(f.maxZ, f.id).toBeLessThanOrEqual(ROOM.depth)
  }
})

test('no two furniture boxes overlap', () => {
  for (let i = 0; i < FURNITURE.length; i++) {
    for (let j = i + 1; j < FURNITURE.length; j++) {
      const a = FURNITURE[i]
      const b = FURNITURE[j]
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
      const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ)
      expect(overlapX > 1e-9 && overlapZ > 1e-9, `${a.id} overlaps ${b.id}`).toBe(false)
    }
  }
})

test('spawn is at least 0.25 m from every collider', () => {
  expect(free(SPAWN.x, SPAWN.z)).toBe(true)
})

test.each([
  ['lavabo front', 3.0, 0.7],
  ['wardrobe front', 0.95, 4.3],
  ['bed side', 2.1, 4.0],
  ['fridge front', 2.45, 1.8],
  ['deskMine front', 3.6, 2.5],
  ['mirror front', 3.65, 2.65],
  ['main door front', 1.95, 0.4],
  ['kitchen front', 1.0, 1.0],
])('reachable with radius 0.25: %s', (_name, x, z) => {
  expect(reachableSet()(x, z)).toBe(true)
})
