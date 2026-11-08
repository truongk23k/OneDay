import { groupParts, partBounds } from '../room/parts'
import { MARKERS, OFFICES, POTHOLES, ROAD_HALF, ROADS_X, ROADS_Z, cityBounds } from './city'
import { buildCityParts } from './cityParts'
import { EM_DOOR } from './store'

const parts = buildCityParts()

test('the street is detailed but merges into a handful of draw calls', () => {
  expect(parts.length).toBeGreaterThan(1500)
  expect(groupParts(parts).size).toBeLessThanOrEqual(3)
})

test('everything stays near the city', () => {
  const b = cityBounds()
  for (const p of parts) {
    const pb = partBounds(p)
    expect(pb.minX).toBeGreaterThan(b.minX - 40)
    expect(pb.maxX).toBeLessThan(b.maxX + 40)
    expect(pb.minZ).toBeGreaterThan(b.minZ - 40)
    expect(pb.maxZ).toBeLessThan(b.maxZ + 40)
  }
})

test('nothing tall stands on the roadway', () => {
  const onRoad = (x: number, z: number) =>
    (ROADS_Z.some((rz) => Math.abs(z - rz) < 3.9) && x > ROADS_X[0] - 4 && x < ROADS_X[ROADS_X.length - 1] + 4) ||
    (ROADS_X.some((rx) => Math.abs(x - rx) < 3.9) && z < ROADS_Z[0] + 4 && z > ROADS_Z[ROADS_Z.length - 1] - 4)
  for (const p of parts) {
    const pb = partBounds(p)
    if (pb.maxY < 2.5) continue
    // Dây điện vắt ngang đường thì cao hơn 5 m.
    if (pb.minY > 5) continue
    const cx = (pb.minX + pb.maxX) / 2
    const cz = (pb.minZ + pb.maxZ) / 2
    expect(onRoad(cx, cz), JSON.stringify(p)).toBe(false)
  }
})

test('the outer edge of the map is lined with houses, not bare ground', () => {
  const b = cityBounds()
  const covered = (x: number, z: number) =>
    parts.some((p) => {
      const pb = partBounds(p)
      return pb.maxY > 6 && x > pb.minX && x < pb.maxX && z > pb.minZ && z < pb.maxZ
    })
  for (const x of [60, 180, 300]) {
    expect(covered(x, b.maxZ + 2), `south ${x}`).toBe(true)
    expect(covered(x, b.minZ - 2), `north ${x}`).toBe(true)
  }
  for (const z of [-50, -150]) {
    expect(covered(b.minX - 2, z), `west ${z}`).toBe(true)
    expect(covered(b.maxX + 2, z), `east ${z}`).toBe(true)
  }
})

test('Em’s pink house is the one she walks out of, on the south side of her street', () => {
  const pink = parts.filter((p) => p.color === '#f4a6c0').map(partBounds)
  expect(pink.length).toBeGreaterThan(0)
  for (const b of pink) expect(b.minZ).toBeGreaterThan(EM_DOOR.z - 0.5)
  expect(pink.some((b) => b.minX < EM_DOOR.x && b.maxX > EM_DOOR.x)).toBe(true)
})

test('every pothole is drawn on the road, so it can be dodged', () => {
  for (const h of POTHOLES) {
    const drawn = parts.some((p) => {
      const b = partBounds(p)
      return b.maxY < 0.1 && b.maxY > 0.02 && h.x > b.minX && h.x < b.maxX && h.z > b.minZ && h.z < b.maxZ && b.maxX - b.minX < 3
    })
    expect(drawn, JSON.stringify(h)).toBe(true)
  }
})

describe('destinations', () => {
  const tall = (minH: number) => parts.filter((p) => partBounds(p).maxY >= minH).map(partBounds)

  test('Anh’s office is a big high-rise, Em’s office a tall tower', () => {
    expect(OFFICES.anhOffice.height).toBeGreaterThanOrEqual(40)
    expect(OFFICES.emOffice.height).toBeGreaterThanOrEqual(28)
    const within = (b: ReturnType<typeof partBounds>, o: (typeof OFFICES)['emOffice']) =>
      b.minX >= o.minX - 0.5 && b.maxX <= o.maxX + 0.5 && b.minZ >= o.minZ - 0.5 && b.maxZ <= o.maxZ + 0.5
    const covers = (b: ReturnType<typeof partBounds>, o: (typeof OFFICES)['emOffice']) =>
      b.minX <= o.minX + 0.5 && b.maxX >= o.maxX - 0.5 && b.minZ <= o.minZ + 0.5 && b.maxZ >= o.maxZ - 0.5
    for (const o of Object.values(OFFICES)) {
      // Thân toà phủ kín mặt bằng gần hết chiều cao; nóc (có thể thu nhỏ) chạm đủ chiều cao.
      expect(tall(o.height * 0.8).some((b) => covers(b, o))).toBe(true)
      expect(tall(o.height).some((b) => within(b, o))).toBe(true)
    }
  })

  test('no tube house is built inside an office tower', () => {
    const houseColors = new Set(['#f2d9a6', '#e8b4a0', '#bcd9c9', '#f5e6b8', '#d6c3e6', '#f4c48a', '#cfe0ef', '#e9e2d0', '#f0b7b0', '#c7d8a8'])
    for (const o of Object.values(OFFICES)) {
      const inside = parts.filter((p) => {
        if (!houseColors.has(p.color)) return false
        const b = partBounds(p)
        return b.minX < o.maxX - 0.1 && b.maxX > o.minX + 0.1 && b.minZ < o.maxZ - 0.1 && b.maxZ > o.minZ + 0.1
      })
      expect(inside).toEqual([])
    }
  })

  test('each stop is at the kerb, right in front of its building', () => {
    const stops = [
      { m: MARKERS.emHouse, face: { axis: 'z', at: -100 + ROAD_HALF + 3 } },
      { m: MARKERS.emOffice, face: { axis: 'z', at: OFFICES.emOffice.minZ } },
      { m: MARKERS.anhOffice, face: { axis: 'x', at: OFFICES.anhOffice.minX } },
    ] as const
    for (const { m, face } of stops) {
      const gap = Math.abs((face.axis === 'z' ? m.z : m.x) - face.at)
      expect(gap, JSON.stringify(m)).toBeLessThan(6)
      // Vẫn nằm trên lòng đường, sát mép (không ở tim đường).
      const centre = face.axis === 'z' ? ROADS_Z.reduce((a, z) => (Math.abs(z - m.z) < Math.abs(a - m.z) ? z : a)) : ROADS_X.reduce((a, x) => (Math.abs(x - m.x) < Math.abs(a - m.x) ? x : a))
      const off = Math.abs((face.axis === 'z' ? m.z : m.x) - centre)
      expect(off).toBeGreaterThan(1.5)
      expect(off).toBeLessThan(ROAD_HALF)
    }
  })

  test('Em’s house stands out: a glowing heart sign above her door', () => {
    const heart = parts.filter((p) => p.mat === 'emit' && p.color === '#ff3d7f').map(partBounds)
    expect(heart.length).toBeGreaterThan(0)
    for (const b of heart) {
      expect(Math.abs((b.minX + b.maxX) / 2 - EM_DOOR.x)).toBeLessThan(2)
      expect(b.minY).toBeGreaterThan(2.5)
      expect(Math.abs(b.maxZ - EM_DOOR.z)).toBeLessThan(1.5)
    }
  })
})
