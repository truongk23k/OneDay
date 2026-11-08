import type { Box } from '../room/layout'
import { BARRIER, MARKERS, STREET_COLLIDERS, cityBounds, routeLength } from './city'

const R = 0.45

test('every stop is on the road', () => {
  for (const [name, m] of Object.entries(MARKERS)) {
    const free = STREET_COLLIDERS.every((b) => {
      const dx = Math.max(b.minX - m.x, 0, m.x - b.maxX)
      const dz = Math.max(b.minZ - m.z, 0, m.z - b.maxZ)
      return Math.hypot(dx, dz) >= R
    })
    expect(free, name).toBe(true)
  }
})

test('the road works block the direct road to Em', () => {
  const blocked = (x: number, z: number, b: Box) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ
  expect(blocked(240, -50, BARRIER)).toBe(true)
})

test('each leg of the ride can be driven', () => {
  expect(routeLength(MARKERS.home, MARKERS.emHouse)).toBeLessThan(Infinity)
  expect(routeLength(MARKERS.emHouse, MARKERS.emOffice)).toBeLessThan(Infinity)
  expect(routeLength(MARKERS.emOffice, MARKERS.anhOffice)).toBeLessThan(Infinity)
})

test('legs are roughly 330 m, 300 m and 110 m long', () => {
  expect(routeLength(MARKERS.home, MARKERS.emHouse)).toBeLessThan(400)
  const leg2 = routeLength(MARKERS.emHouse, MARKERS.emOffice)
  expect(leg2).toBeGreaterThan(250)
  expect(leg2).toBeLessThan(380)
  const leg3 = routeLength(MARKERS.emOffice, MARKERS.anhOffice)
  expect(leg3).toBeGreaterThan(80)
  expect(leg3).toBeLessThan(160)
})

test('the alley is a real shortcut to Em’s house', () => {
  const withAlley = routeLength(MARKERS.home, MARKERS.emHouse)
  const withoutAlley = routeLength(MARKERS.home, MARKERS.emHouse, { closeAlley: true })
  expect(withoutAlley - withAlley).toBeGreaterThan(70)
})

test('the city is enclosed', () => {
  const b = cityBounds()
  expect(b.maxX - b.minX).toBeGreaterThan(350)
  expect(b.maxZ - b.minZ).toBeGreaterThan(200)
})
