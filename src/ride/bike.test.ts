import type { Box } from '../room/layout'
import { BIKE, newBike, stepBike, type BikeInput, type BikeState } from './bike'

const GAS: BikeInput = { throttle: 1, brake: 0, steer: 0 }
const BRAKE: BikeInput = { throttle: 0, brake: 1, steer: 0 }
const IDLE: BikeInput = { throttle: 0, brake: 0, steer: 0 }

function run(s: BikeState, input: BikeInput, seconds: number, colliders: Box[] = [], dt = 1 / 60) {
  const events: string[] = []
  for (let t = 0; t < seconds; t += dt) {
    const r = stepBike(s, input, dt, colliders)
    s = r.state
    events.push(...r.events.map((e) => e.kind))
  }
  return { s, events }
}

test('full gas reaches top speed (~47 km/h) and never goes past it', () => {
  const { s } = run(newBike(0, 0, 0), GAS, 6)
  expect(s.speed).toBeCloseTo(BIKE.maxSpeed, 1)
  expect(BIKE.maxSpeed).toBe(13)
})

test('gas moves the bike forward (north at heading 0)', () => {
  const { s } = run(newBike(0, 0, 0), GAS, 1)
  expect(s.z).toBeLessThan(-1)
  expect(Math.abs(s.x)).toBeLessThan(1e-6)
})

test('braking stops the bike, holding it reverses slowly', () => {
  const fast = { ...newBike(0, 0, 0), speed: 13 }
  const stopped = run(fast, BRAKE, 1.5).s
  expect(stopped.speed).toBeLessThanOrEqual(0)
  const back = run(stopped, BRAKE, 3).s
  expect(back.speed).toBeCloseTo(-BIKE.reverseMax, 1)
})

test('letting go of the gas coasts down', () => {
  const s = run({ ...newBike(0, 0, 0), speed: 10 }, IDLE, 2).s
  expect(s.speed).toBeLessThan(10)
  expect(s.speed).toBeGreaterThan(0)
})

test('steering right turns the bike right when moving, not when standing still', () => {
  const moving = run({ ...newBike(0, 0, 0), speed: 8 }, { throttle: 0.5, brake: 0, steer: 1 }, 0.5).s
  expect(moving.heading).toBeLessThan(0)
  const still = run(newBike(0, 0, 0), { throttle: 0, brake: 0, steer: 1 }, 0.5).s
  expect(still.heading).toBeCloseTo(0)
})

test('bike never ends inside a collider at max speed, and the crash is reported', () => {
  const wall: Box = { id: 'w', minX: -5, maxX: 5, minZ: -10.2, maxZ: -10, height: 3 }
  const { s, events } = run({ ...newBike(0, 0, 0), speed: 13 }, GAS, 2, [wall], 0.05)
  expect(s.z).toBeGreaterThanOrEqual(-10 + BIKE.radius - 1e-6)
  expect(events).toContain('crash')
  expect(Math.abs(s.speed)).toBeLessThan(5)
})

test('slamming the brakes at speed is reported once as a hard brake', () => {
  const { events } = run({ ...newBike(0, 0, 0), speed: 10 }, BRAKE, 1)
  expect(events.filter((e) => e === 'hardBrake')).toHaveLength(1)
})

test('gentle braking at low speed is not a hard brake', () => {
  const { events } = run({ ...newBike(0, 0, 0), speed: 4 }, BRAKE, 1)
  expect(events).not.toContain('hardBrake')
})

test('quick taps of the brake at speed are not hard brakes', () => {
  let s: BikeState = { ...newBike(0, 0, 0), speed: 12 }
  const events: string[] = []
  for (let i = 0; i < 3; i++) {
    const tap = run(s, BRAKE, 0.3)
    const gap = run(tap.s, IDLE, 0.3)
    events.push(...tap.events, ...gap.events)
    s = gap.s
  }
  expect(events).not.toContain('hardBrake')
  expect(s.speed).toBeLessThan(9)
})

test('braking to a stop from a moderate speed is not a hard brake', () => {
  const { s, events } = run({ ...newBike(0, 0, 0), speed: 6.5 }, BRAKE, 1.5)
  expect(s.speed).toBeLessThanOrEqual(0.01)
  expect(events).not.toContain('hardBrake')
})

test('the brake bites harder the longer it is held', () => {
  const first = run({ ...newBike(0, 0, 0), speed: 12 }, BRAKE, 0.2).s
  const later = run(first, BRAKE, 0.2).s
  expect(12 - first.speed).toBeLessThan(first.speed - later.speed)
})
