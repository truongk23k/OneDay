import { ALLEY, ROADS_Z } from './city'
import { CHECKPOINT, POLICE, helmetsShort, newPolice, startChase, stepPolice, type Police } from './police'

const bikeAt = (x: number, z: number, heading = -Math.PI / 2, speed = 0) => ({ x, z, heading, speed })

test('a chase starts on the road some way behind the bike', () => {
  // Đi về phía đông (heading -π/2) trên đường z = 0: CSGT xuất hiện phía tây, trên đường.
  const p = startChase(bikeAt(150, 0), 10, 'redLight')
  expect(p.mode).toBe('chase')
  expect(p.reason).toBe('redLight')
  expect(p.z).toBeCloseTo(0)
  expect(150 - p.x).toBeGreaterThan(POLICE.spawnBack - 1)
})

test('a chase can start from a given spot (the checkpoint)', () => {
  const p = startChase(bikeAt(240, -120), 0, 'wheelie', CHECKPOINT)
  expect(p.x).toBe(CHECKPOINT.x)
  expect(p.z).toBe(CHECKPOINT.z)
})

function run(p: Police, bike: (t: number) => ReturnType<typeof bikeAt>, seconds: number, t0 = 0) {
  const dt = 1 / 30
  let t = t0
  for (let i = 0; i < seconds / dt; i++) {
    t += dt
    const r = stepPolice(p, bike(t), dt, t)
    p = r.police
    if (r.event) return { p, event: r.event, t }
  }
  return { p, event: null, t }
}

test('on a straight road the police catch a bike that keeps riding slower than them', () => {
  const p = startChase(bikeAt(120, 0), 0, 'redLight')
  const r = run(p, (t) => bikeAt(120 + 9 * t, 0, -Math.PI / 2, 9), 30)
  expect(r.event).toBe('caught')
})

test('stopping and waiting counts as pulling over, not being caught', () => {
  const p = startChase(bikeAt(150, 0), 0, 'redLight')
  const r = run(p, () => bikeAt(150, 0, -Math.PI / 2, 0), 20)
  expect(r.event).toBe('surrender')
})

test('the police car follows the streets round a corner', () => {
  // Xe máy rẽ từ z = 0 xuống x = 360 rồi đứng chờ: CSGT phải tới được góc rẽ.
  const p = startChase(bikeAt(340, 0), 0, 'redLight')
  const r = run(p, () => bikeAt(360, -25, Math.PI, 0), 20)
  expect(r.event).toBe('surrender')
})

test('the police car cannot follow into the alley, so hiding there loses them', () => {
  const p = startChase(bikeAt(200, 0), 0, 'redLight')
  const hide = bikeAt(ALLEY.x, (ROADS_Z[0] + ROADS_Z[1]) / 2, Math.PI, 0)
  const r = run(p, () => hide, 30)
  expect(r.event).toBe('lost')
  expect(Math.abs(r.p.x - ALLEY.x) > 1 || r.p.z > ROADS_Z[0] - 3).toBe(true)
})

test('a bike far ahead for a few seconds gets away', () => {
  const p = startChase(bikeAt(150, 0), 0, 'redLight')
  const r = run(p, (t) => bikeAt(150 + POLICE.loseDist + 20 + 30 * t, 0, -Math.PI / 2, 13), 10)
  expect(r.event).toBe('lost')
})

test('the police give up after a long chase', () => {
  const p = startChase(bikeAt(150, 0), 0, 'redLight')
  // Luôn giữ khoảng cách ~30 m: không bắt được mà cũng không mất dấu.
  let police = p
  let event = null
  for (let t = 0; t < POLICE.giveUp + 2 && !event; t += 0.1) {
    const r = stepPolice(police, bikeAt(police.x + 30, 0, -Math.PI / 2, 13), 0.1, t)
    police = r.police
    event = r.event
  }
  expect(event).toBe('lost')
})

test('stepping an idle police does nothing', () => {
  const p = newPolice()
  expect(stepPolice(p, bikeAt(0, 0), 0.1, 1)).toEqual({ police: p, event: null })
})

test('helmets: riding alone needs one, with Em needs two', () => {
  expect(helmetsShort('toEm', 0)).toBe(true)
  expect(helmetsShort('toEm', 1)).toBe(false)
  expect(helmetsShort('withEm', 1)).toBe(true)
  expect(helmetsShort('withEm', 2)).toBe(false)
  expect(helmetsShort('sprint', 1)).toBe(false)
})

test('the checkpoint stands beside a street that leads from Em’s house to her office', () => {
  expect(CHECKPOINT.x === 240 || CHECKPOINT.z === -200).toBe(true)
})
