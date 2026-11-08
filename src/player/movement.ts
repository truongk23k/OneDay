import type { Vec2 } from '../room/layout'

// Hướng đi trong thế giới theo hướng camera. yaw = 0 nhìn về bắc (-z).
export function moveVector(input: { x: number; y: number }, yaw: number): Vec2 {
  const len = Math.hypot(input.x, input.y)
  const k = len > 1 ? 1 / len : 1
  const ix = input.x * k
  const iy = input.y * k
  const s = Math.sin(yaw)
  const c = Math.cos(yaw)
  return { x: -s * iy + c * ix, z: -c * iy - s * ix }
}

// Khung hình bị trễ lâu (đổi tab) không được làm người chơi xuyên tường.
export function clampDelta(dt: number): number {
  return Math.min(dt, 0.05)
}
