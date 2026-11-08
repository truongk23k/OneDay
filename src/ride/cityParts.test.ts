import { groupParts, partBounds } from '../room/parts'
import { ROADS_X, ROADS_Z, cityBounds } from './city'
import { buildCityParts } from './cityParts'

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
