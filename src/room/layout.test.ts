import { CHARACTER_HEIGHT, COLLIDERS, FURNITURE, HELMETS, PULLUP_BAR, ROOM, SPAWN, WALLS, WINDOW, type Box } from './layout'

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

const get = (id: string) => FURNITURE.find((f) => f.id === id)!
const wall = (id: string) => WALLS.find((w) => w.id === id)!

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
  ['lavabo front', 3.75, 0.7],
  ['wardrobe front', 0.95, 5.4],
  ['bed side', 2.95, 5.2],
  ['fridge front', 2.7, 1.95],
  ['deskMine side', 3.9, 2.8],
  ['mirror front', 5.2, 3.9],
  ['main door front', 2.45, 0.4],
  ['kitchen front', 1.0, 0.7],
  ['roommate desk front', 1.1, 2.15],
])('reachable with radius 0.25: %s', (_name, x, z) => {
  expect(reachableSet()(x, z)).toBe(true)
})

test('room is 5.6 m by 6.4 m', () => {
  expect(ROOM.width).toBe(5.6)
  expect(ROOM.depth).toBe(6.4)
})

test('a wall separates the kitchen from the roommate desk', () => {
  // Đi thẳng từ bàn bạn cùng phòng lên bếp phải cắt qua một bức tường.
  const blocking = WALLS.filter((w) => w.minX <= 1.0 && w.maxX >= 1.0 && w.minZ >= 1.0 && w.maxZ <= 2.5)
  expect(blocking.length).toBeGreaterThan(0)
})

test('the passage to the main door is narrow, about 1 m', () => {
  const width = wall('bathWallW1').minX - wall('kitchenPillar').maxX
  expect(width).toBeGreaterThanOrEqual(0.9)
  expect(width).toBeLessThanOrEqual(1.1)
})

test('the bathroom sits right next to the main door', () => {
  const gap = wall('bathWallW1').minX - get('door').maxX
  expect(gap).toBeGreaterThanOrEqual(0)
  expect(gap).toBeLessThanOrEqual(0.1)
})

test('the kitchen L runs along the west wall and the partition wall', () => {
  const long = get('kitchenW')
  const short = get('kitchenS')
  expect(long.minX).toBe(0)
  expect(long.maxZ - long.minZ).toBeGreaterThan(short.maxX - short.minX)
  expect(short.maxZ).toBeCloseTo(wall('kitchenWall').minZ)
  expect(FURNITURE.some((f) => f.id === 'kitchenN')).toBe(false)
})

test('the kitchen partition is a low wall, open above, ending in a full-height pillar at the passage', () => {
  const low = wall('kitchenWall')
  const pillar = wall('kitchenPillar')
  expect(low.height).toBeLessThanOrEqual(1.5)
  expect(pillar.height).toBe(ROOM.height)
  expect(pillar.minX).toBeCloseTo(low.maxX)
  expect(pillar.maxX - pillar.minX).toBeLessThanOrEqual(0.25)
})

test('my desk is big: about 2 m long and 0.9 m deep', () => {
  const d = get('deskMine')
  expect(d.maxX - d.minX).toBeGreaterThanOrEqual(1.9)
  expect(d.maxZ - d.minZ).toBeGreaterThanOrEqual(0.85)
})

test('the bed is big: at least 2.2 m wide', () => {
  const b = get('bed')
  expect(b.maxX - b.minX).toBeGreaterThanOrEqual(2.2)
})

test('the mirror is flat against the wall and touches the bed', () => {
  const m = get('mirror')
  expect(m.maxX - m.minX).toBeLessThanOrEqual(0.08)
  expect(m.maxZ).toBeCloseTo(get('bed').minZ)
})

test('the shelf is small, right next to the mirror', () => {
  const s = get('shelf')
  expect(s.maxX - s.minX).toBeLessThanOrEqual(0.35)
  expect(s.maxZ - s.minZ).toBeLessThanOrEqual(0.35)
  expect(get('mirror').minZ - s.maxZ).toBeGreaterThanOrEqual(0)
  expect(get('mirror').minZ - s.maxZ).toBeLessThanOrEqual(0.15)
})

test('each desk has a chair right in front of it', () => {
  for (const [desk, chair] of [
    ['deskMine', 'chairMine'],
    ['deskFriend', 'chairFriend'],
  ]) {
    const d = get(desk)
    const c = get(chair)
    const gap = Math.max(c.minX - d.maxX, d.minX - c.maxX, c.minZ - d.maxZ, d.minZ - c.maxZ)
    expect(gap, chair).toBeGreaterThanOrEqual(0)
    expect(gap, chair).toBeLessThanOrEqual(0.3)
  }
})

test('the roommate desk runs from the kitchen wall to the roommate fridge', () => {
  const d = get('deskFriend')
  expect(d.minZ - wall('kitchenWall').maxZ).toBeLessThanOrEqual(0.1)
  expect(d.maxZ).toBeCloseTo(get('fridge2').minZ)
})

test('the window is above the roommate fridge, on the west wall', () => {
  const f = get('fridge2')
  expect(WINDOW.wall).toBe('wallW')
  expect(WINDOW.min).toBeLessThan(f.maxZ)
  expect(WINDOW.max).toBeGreaterThan(f.minZ)
  expect(WINDOW.minY).toBeGreaterThan(f.height)
  expect(WINDOW.maxY).toBeLessThan(ROOM.height)
})

test('both helmets hang on the door, evenly spaced around its centre', () => {
  const d = get('door')
  const centre = (d.minX + d.maxX) / 2
  expect(HELMETS).toHaveLength(2)
  for (const h of HELMETS) {
    expect(h.x).toBeGreaterThan(d.minX + 0.1)
    expect(h.x).toBeLessThan(d.maxX - 0.1)
  }
  expect(HELMETS[0].x + HELMETS[1].x).toBeCloseTo(2 * centre)
  expect(HELMETS[0].y).toBeCloseTo(HELMETS[1].y)
})

test('the shelf is 2/3 as wide as the mirror', () => {
  const s = get('shelf')
  const m = get('mirror')
  expect(s.maxZ - s.minZ).toBeCloseTo(((m.maxZ - m.minZ) * 2) / 3, 2)
})

test('the shelf is shallow: sticks out at most 0.2 m from the wall', () => {
  const s = get('shelf')
  expect(s.maxX - s.minX).toBeLessThanOrEqual(0.2)
})

test('a pull-up bar spans the passage mouth from the pillar to the wall beside the fridge', () => {
  const pillar = wall('kitchenPillar')
  const side = wall('bathWallW2')
  expect(PULLUP_BAR.x0).toBeCloseTo(pillar.maxX)
  expect(PULLUP_BAR.x1).toBeCloseTo(side.minX)
  // Bám vào cả cột lẫn tường.
  expect(PULLUP_BAR.z).toBeGreaterThanOrEqual(pillar.minZ)
  expect(PULLUP_BAR.z).toBeLessThanOrEqual(pillar.maxZ)
  expect(PULLUP_BAR.z).toBeGreaterThanOrEqual(side.minZ)
  expect(PULLUP_BAR.z).toBeLessThanOrEqual(side.maxZ)
})

test('the pull-up bar hangs about 1.65 times the character height, just under the door top', () => {
  expect(PULLUP_BAR.y).toBeCloseTo(1.65 * CHARACTER_HEIGHT)
  expect(PULLUP_BAR.y).toBeLessThan(get('door').height)
  expect(PULLUP_BAR.radius).toBeLessThanOrEqual(0.03)
})
