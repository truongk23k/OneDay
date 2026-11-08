import { LIGHTS, ROAD_HALF, ROADS_X, ROADS_Z, STREET_COLLIDERS } from './city'
import { LOOPS, LIGHT_CYCLE, lightState, newTraffic, poseOf, stepTraffic, vehicleBox, type Vehicle } from './traffic'

const overlaps = (a: { minX: number; maxX: number; minZ: number; maxZ: number }, b: typeof a) =>
  a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ

// Mọi vị trí dọc một vòng chạy, cách nhau 1 m.
function* along(kind: Vehicle['kind'], loop: number) {
  for (let s = 0; s < LOOPS[loop].length; s += 1) yield { kind, loop, s, speed: 8 } satisfies Vehicle
}

test('a dozen vehicles at most, the same every ride', () => {
  const a = newTraffic()
  expect(a.length).toBeGreaterThan(6)
  expect(a.length).toBeLessThanOrEqual(12)
  expect(newTraffic()).toEqual(a)
})

test('vehicles keep to the right-hand lane of a road', () => {
  for (let l = 0; l < LOOPS.length; l++) {
    for (const v of along('car', l)) {
      const p = poseOf(v)
      const fx = -Math.sin(p.heading)
      const fz = -Math.cos(p.heading)
      const onX = Math.abs(fx) > 0.9
      const rz = ROADS_Z.find((z) => Math.abs(p.z - z) < ROAD_HALF)
      const rx = ROADS_X.find((x) => Math.abs(p.x - x) < ROAD_HALF)
      if (onX) expect(rz, JSON.stringify(p)).toBeDefined()
      else expect(rx, JSON.stringify(p)).toBeDefined()
      // Bên phải của hướng đi (−fz, fx) phải trùng phía lệch khỏi tim đường.
      const off = onX ? (p.z - rz!) * fx : -(p.x - rx!) * fz
      if (Math.abs(fx) > 0.99 || Math.abs(fz) > 0.99) expect(off, JSON.stringify(p)).toBeGreaterThan(0.5)
    }
  }
})

test('vehicles never drive through buildings or roadworks', () => {
  for (let l = 0; l < LOOPS.length; l++) {
    for (const v of along('bus', l)) {
      const box = vehicleBox(v)
      const hit = STREET_COLLIDERS.find((c) => overlaps(box, c))
      expect(hit, `${l} ${v.s} ${hit?.id}`).toBeUndefined()
    }
  }
})

test('each light is never green both ways, and every way gets green, yellow and red', () => {
  for (let i = 0; i < LIGHTS.length; i++) {
    const seen = { x: new Set<string>(), z: new Set<string>() }
    for (let t = 0; t < LIGHT_CYCLE; t += 0.25) {
      const x = lightState(i, t, 'x')
      const z = lightState(i, t, 'z')
      expect(x === 'green' && z === 'green').toBe(false)
      seen.x.add(x)
      seen.z.add(z)
    }
    expect([...seen.x].sort()).toEqual(['green', 'red', 'yellow'])
    expect([...seen.z].sort()).toEqual(['green', 'red', 'yellow'])
  }
})

// Xe đang chạy dọc trục x tiến về đèn số 0 (giao lộ x 120, z 0), cách vạch dừng vài mét.
function approachingLight0(): Vehicle {
  const l = LIGHTS[0]
  for (let loop = 0; loop < LOOPS.length; loop++) {
    for (const v of along('car', loop)) {
      const p = poseOf(v)
      const d = Math.abs(p.x - l.x)
      const towards = -Math.sin(p.heading) * (l.x - p.x) > 0
      if (Math.abs(p.z - l.z) < ROAD_HALF && towards && d >= 12 && d < 13) return v
    }
  }
  throw new Error('no loop passes light 0 along x')
}

const redStart = (axis: 'x' | 'z') => {
  for (let t = 0; t < LIGHT_CYCLE; t += 0.05) if (lightState(0, t, axis) === 'red' && lightState(0, t - 0.05, axis) !== 'red') return t
  throw new Error('never red')
}

test('a vehicle stops at a red light and goes on green', () => {
  let cars = [approachingLight0()]
  const l = LIGHTS[0]
  let t = redStart('x')
  for (let i = 0; i < 60; i++, t += 0.05) cars = stepTraffic(cars, 0.05, t, null)
  let p = poseOf(cars[0])
  expect(lightState(0, t, 'x')).toBe('red')
  // Còn đứng trước giao lộ (khoảng cách có dấu theo hướng đi).
  expect(-Math.sin(p.heading) * (l.x - p.x)).toBeGreaterThan(ROAD_HALF + 2)
  while (lightState(0, t, 'x') !== 'green') {
    cars = stepTraffic(cars, 0.05, t, null)
    t += 0.05
  }
  for (let i = 0; i < 80; i++, t += 0.05) cars = stepTraffic(cars, 0.05, t, null)
  p = poseOf(cars[0])
  const passed = -Math.sin(p.heading) * (p.x - l.x) > ROAD_HALF
  expect(passed).toBe(true)
})

test('a vehicle waits behind the bike instead of driving through it', () => {
  let cars = [approachingLight0()]
  const p0 = poseOf(cars[0])
  const fx = -Math.sin(p0.heading)
  const bike = { x: p0.x + fx * 6, z: p0.z }
  // Đèn xanh suốt: chỉ có xe máy của Anh chắn đường.
  let t = 0
  while (lightState(0, t, 'x') !== 'green') t += 0.05
  for (let i = 0; i < 40; i++) cars = stepTraffic(cars, 0.05, t, bike)
  const box = vehicleBox(cars[0])
  const r = 0.45
  const clear = bike.x + r < box.minX || bike.x - r > box.maxX || bike.z + r < box.minZ || bike.z - r > box.maxZ
  expect(clear).toBe(true)
  expect((bike.x - poseOf(cars[0]).x) * fx).toBeGreaterThan(0)
})

test('a follower queues behind a stopped leader', () => {
  const lead = approachingLight0()
  const follow = { ...lead, s: lead.s - 12 }
  let cars = [lead, follow]
  let t = redStart('x')
  for (let i = 0; i < 100; i++, t += 0.05) cars = stepTraffic(cars, 0.05, t, null)
  expect(lightState(0, t, 'x')).toBe('red')
  expect(overlaps(vehicleBox(cars[0]), vehicleBox(cars[1]))).toBe(false)
  expect(cars[0].s - cars[1].s).toBeGreaterThan(4.2)
})
