import { BARRIERS, MARKERS, routeLength } from './city'
import { nextTurn, routeTo } from './nav'

const crossesRoadworks = (pts: { x: number; z: number }[]) =>
  pts.some((p, i) => {
    const q = pts[i + 1]
    if (!q) return false
    return BARRIERS.some((b) => {
      const minX = Math.min(p.x, q.x)
      const maxX = Math.max(p.x, q.x)
      const minZ = Math.min(p.z, q.z)
      const maxZ = Math.max(p.z, q.z)
      return minX <= b.maxX && maxX >= b.minX && minZ <= b.maxZ && maxZ >= b.minZ
    })
  })

test('from home to Em the route takes the alley, around the roadworks', () => {
  const r = routeTo(MARKERS.home, MARKERS.emHouse)
  expect(r.points[0]).toEqual({ x: MARKERS.home.x, z: MARKERS.home.z })
  expect(r.points.at(-1)).toEqual({ x: MARKERS.emHouse.x, z: MARKERS.emHouse.z })
  expect(r.points).toContainEqual({ x: 200, z: 0 })
  expect(r.points).toContainEqual({ x: 200, z: -100 })
  expect(crossesRoadworks(r.points)).toBe(false)
  // 340 m theo tim đường + 2.5 m ra sát mép đường trước cửa nhà Em.
  expect(r.length).toBeCloseTo(342.5)
})

test('the route length matches a flood fill of the real streets', () => {
  const r = routeTo(MARKERS.home, MARKERS.emHouse)
  expect(Math.abs(r.length - routeLength(MARKERS.home, MARKERS.emHouse))).toBeLessThan(6)
})

test('from Em’s house to her office, then to Anh’s office', () => {
  expect(routeTo(MARKERS.emHouse, MARKERS.emOffice).length).toBeCloseTo(320 + 5)
  expect(routeTo(MARKERS.emOffice, MARKERS.anhOffice).length).toBeCloseTo(130 + 5)
})

test('starting beside the roadworks it turns back rather than going through', () => {
  const r = routeTo({ x: 240, z: -10 }, MARKERS.emHouse)
  expect(crossesRoadworks(r.points)).toBe(false)
  expect(r.length).toBeCloseTo(250 + 2.5)
})

test('a bike slightly off the road centre still gets a route', () => {
  const r = routeTo({ x: 75, z: 2.5 }, MARKERS.emHouse)
  expect(r.length).toBeGreaterThan(300)
  expect(r.points.length).toBeGreaterThan(2)
})

test('the arrow points at the next corner, then past it once close', () => {
  const far = routeTo(MARKERS.home, MARKERS.emHouse)
  expect(nextTurn(far)).toEqual({ x: 200, z: 0 })
  const close = routeTo({ x: 196, z: 0 }, MARKERS.emHouse)
  expect(nextTurn(close)).toEqual({ x: 200, z: -100 })
})
