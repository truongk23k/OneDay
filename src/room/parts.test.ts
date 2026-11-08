import { FURNITURE, ROOM } from './layout'
import { buildRoomParts, furnitureParts, groupParts, partBounds } from './parts'

test('every furniture item is built from several low-poly parts', () => {
  for (const f of FURNITURE) {
    expect(furnitureParts(f).length, f.id).toBeGreaterThanOrEqual(3)
  }
})

test('all room parts stay inside the room shell and above the floor', () => {
  for (const p of buildRoomParts()) {
    const b = partBounds(p)
    expect(b.minX, JSON.stringify(p)).toBeGreaterThanOrEqual(-0.11)
    expect(b.maxX, JSON.stringify(p)).toBeLessThanOrEqual(ROOM.width + 0.11)
    expect(b.minZ, JSON.stringify(p)).toBeGreaterThanOrEqual(-0.11)
    expect(b.maxZ, JSON.stringify(p)).toBeLessThanOrEqual(ROOM.depth + 0.11)
    expect(b.minY, JSON.stringify(p)).toBeGreaterThanOrEqual(-0.001)
    expect(b.maxY, JSON.stringify(p)).toBeLessThanOrEqual(ROOM.height + 0.001)
  }
})

test('merged by material (colours live in the geometry), the whole room needs a handful of draw calls', () => {
  const groups = groupParts(buildRoomParts())
  expect(groups.size).toBeLessThanOrEqual(3)
  expect(buildRoomParts().length).toBeGreaterThan(150)
})

test('groupParts groups by material only, whatever the colour', () => {
  const g = groupParts([
    { kind: 'box', size: [1, 1, 1], pos: [0, 0.5, 0], color: '#fff' },
    { kind: 'box', size: [1, 1, 1], pos: [2, 0.5, 0], color: '#f00' },
    { kind: 'box', size: [1, 1, 1], pos: [0, 0.5, 2], color: '#fff', mat: 'emit' },
  ])
  expect(g.size).toBe(2)
  expect(g.get('std')).toHaveLength(2)
})
