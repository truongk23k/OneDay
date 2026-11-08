import { resolveCircleBoxes } from '../player/collision'
import type { Box } from '../room/layout'

// Xe máy kiểu arcade (không mô phỏng vật lý thật). heading 0 = hướng bắc (-z), giống yaw của nhân vật.
export const BIKE = {
  accel: 4,
  maxSpeed: 13,
  // Phanh ăn dần: bóp nhẹ 3 m/s², giữ 0.4 s thì tới tối đa 11 m/s².
  brake: 11,
  brakeSoft: 3,
  brakeRamp: 0.4,
  drag: 0.8,
  reverseMax: 2,
  reverseAccel: 2.5,
  steerRate: 1.9,
  radius: 0.45,
  crashSpeed: 4,
  // Phanh gấp: đang chạy trên 7 m/s mà mất 6 m/s trong vòng 1 s của cùng một lần bóp phanh.
  hardFrom: 7,
  hardDrop: 6,
  hardWindow: 1,
}

export type BikeState = {
  x: number
  z: number
  heading: number
  speed: number
  braking: boolean
  // Lần bóp phanh hiện tại: đã giữ bao lâu, tốc độ lúc bắt đầu bóp, đã tính là phanh gấp chưa.
  brakeFor: number
  brakeFrom: number
  hardDone: boolean
}
export type BikeInput = { throttle: number; brake: number; steer: number }
export type BikeEvent = { kind: 'crash'; impact: number } | { kind: 'hardBrake' }

export const newBike = (x: number, z: number, heading: number): BikeState => ({
  x,
  z,
  heading,
  speed: 0,
  braking: false,
  brakeFor: 0,
  brakeFrom: 0,
  hardDone: false,
})

const SUBSTEP = 0.15

export function stepBike(s: BikeState, input: BikeInput, dt: number, colliders: Box[]): { state: BikeState; events: BikeEvent[] } {
  const events: BikeEvent[] = []
  let speed = s.speed
  const braking = input.brake > 0.5

  const brakeFor = braking ? (s.braking ? s.brakeFor + dt : 0) : 0
  const brakeFrom = braking && !s.braking ? speed : s.brakeFrom
  let hardDone = braking && s.braking ? s.hardDone : false

  if (input.throttle > 0 && speed >= 0) {
    speed = Math.min(BIKE.maxSpeed, speed + BIKE.accel * input.throttle * dt)
  } else if (input.brake > 0) {
    const bite = BIKE.brakeSoft + (BIKE.brake - BIKE.brakeSoft) * Math.min(1, brakeFor / BIKE.brakeRamp)
    if (speed > 0) speed = Math.max(0, speed - bite * input.brake * dt)
    else speed = Math.max(-BIKE.reverseMax, speed - BIKE.reverseAccel * input.brake * dt)
  } else {
    const d = BIKE.drag * dt
    speed = Math.abs(speed) <= d ? 0 : speed - Math.sign(speed) * d
    if (input.throttle > 0 && speed < 0) speed = Math.min(0, speed + BIKE.brake * dt)
  }

  // Tính phanh gấp trước khi va chạm làm tụt tốc độ (đâm xe không tính thêm là phanh gấp).
  if (braking && !hardDone && brakeFrom > BIKE.hardFrom && brakeFrom - speed >= BIKE.hardDrop && brakeFor <= BIKE.hardWindow) {
    events.push({ kind: 'hardBrake' })
    hardDone = true
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

  return { state: { x, z, heading, speed, braking, brakeFor, brakeFrom, hardDone }, events }
}
