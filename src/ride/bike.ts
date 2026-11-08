import { resolveCircleBoxes } from '../player/collision'
import type { Box } from '../room/layout'

// Xe máy kiểu arcade (không mô phỏng vật lý thật). heading 0 = hướng bắc (-z), giống yaw của nhân vật.
export const BIKE = {
  accel: 4,
  maxSpeed: 13,
  brake: 9,
  drag: 0.8,
  reverseMax: 2,
  reverseAccel: 2.5,
  steerRate: 1.9,
  radius: 0.45,
  crashSpeed: 4,
  hardBrakeSpeed: 5,
}

export type BikeState = { x: number; z: number; heading: number; speed: number; braking: boolean }
export type BikeInput = { throttle: number; brake: number; steer: number }
export type BikeEvent = { kind: 'crash'; impact: number } | { kind: 'hardBrake' }

export const newBike = (x: number, z: number, heading: number): BikeState => ({ x, z, heading, speed: 0, braking: false })

const SUBSTEP = 0.15

export function stepBike(s: BikeState, input: BikeInput, dt: number, colliders: Box[]): { state: BikeState; events: BikeEvent[] } {
  const events: BikeEvent[] = []
  let speed = s.speed
  const braking = input.brake > 0.5

  // Phanh gấp: bắt đầu bóp phanh khi đang chạy nhanh.
  if (braking && !s.braking && speed > BIKE.hardBrakeSpeed) events.push({ kind: 'hardBrake' })

  if (input.throttle > 0 && speed >= 0) {
    speed = Math.min(BIKE.maxSpeed, speed + BIKE.accel * input.throttle * dt)
  } else if (input.brake > 0) {
    if (speed > 0) speed = Math.max(0, speed - BIKE.brake * input.brake * dt)
    else speed = Math.max(-BIKE.reverseMax, speed - BIKE.reverseAccel * input.brake * dt)
  } else {
    const d = BIKE.drag * dt
    speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d
    if (input.throttle > 0 && speed < 0) speed = Math.min(0, speed + BIKE.brake * dt)
  }

  // Rẽ: chỉ khi xe lăn bánh; đi lùi thì tay lái ngược chiều.
  const grip = Math.min(1, Math.abs(speed) / 3)
  const heading = s.heading - input.steer * BIKE.steerRate * grip * Math.sign(speed || 1) * dt

  // Di chuyển theo từng bước nhỏ để không xuyên tường khi chạy nhanh.
  const dist = speed * dt
  const steps = Math.max(1, Math.ceil(Math.abs(dist) / SUBSTEP))
  const fx = -Math.sin(heading)
  const fz = -Math.cos(heading)
  let x = s.x
  let z = s.z
  let travelled = 0
  for (let i = 0; i < steps; i++) {
    const want = { x: x + (fx * dist) / steps, z: z + (fz * dist) / steps }
    const got = resolveCircleBoxes(want, BIKE.radius, colliders)
    travelled += (got.x - x) * fx + (got.z - z) * fz
    x = got.x
    z = got.z
  }

  // Đâm: quãng đi được theo hướng xe ít hơn nhiều so với dự định.
  if (Math.abs(dist) > 1e-9 && travelled / dist < 0.5) {
    if (Math.abs(speed) > BIKE.crashSpeed) events.push({ kind: 'crash', impact: Math.abs(speed) })
    speed *= 0.15
  }

  return { state: { x, z, heading, speed, braking }, events }
}
