import type { Box, Vec2 } from '../room/layout'

type V3 = [number, number, number]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Đẩy hình tròn (người chơi nhìn từ trên xuống) ra khỏi mọi hộp nó chồng lên.
export function resolveCircleBoxes(p: Vec2, r: number, boxes: Box[]): Vec2 {
  let x = p.x
  let z = p.z
  for (let iter = 0; iter < 3; iter++) {
    for (const b of boxes) {
      const dx = x - clamp(x, b.minX, b.maxX)
      const dz = z - clamp(z, b.minZ, b.maxZ)
      const d = Math.hypot(dx, dz)
      if (d >= r) continue
      if (d > 0) {
        x += (dx / d) * (r - d)
        z += (dz / d) * (r - d)
        continue
      }
      // Tâm nằm trong hộp: đẩy ra qua mặt gần nhất.
      const faces = [x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z]
      const i = faces.indexOf(Math.min(...faces))
      if (i === 0) x = b.minX - r
      else if (i === 1) x = b.maxX + r
      else if (i === 2) z = b.minZ - r
      else z = b.maxZ + r
    }
  }
  return { x, z }
}

// Khoảng cách dọc tia tới hộp (hộp cao từ y = 0 tới height), null nếu không trúng phía trước.
export function rayBoxDistance(o: V3, d: V3, b: Box): number | null {
  const lo: V3 = [b.minX, 0, b.minZ]
  const hi: V3 = [b.maxX, b.height, b.maxZ]
  let tmin = -Infinity
  let tmax = Infinity
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-12) {
      if (o[a] < lo[a] || o[a] > hi[a]) return null
      continue
    }
    const t1 = (lo[a] - o[a]) / d[a]
    const t2 = (hi[a] - o[a]) / d[a]
    tmin = Math.max(tmin, Math.min(t1, t2))
    tmax = Math.min(tmax, Math.max(t1, t2))
  }
  if (tmax < tmin || tmin < 0) return null
  return tmin
}

const MARGIN = 0.2
const MIN_DIST = 0.4

// Camera lùi tối đa maxDist nhưng dừng trước tường, đồ đạc và trần nhà.
export function cameraDistance(o: V3, d: V3, maxDist: number, boxes: Box[], ceiling = Infinity): number {
  const len = Math.hypot(d[0], d[1], d[2])
  const n: V3 = [d[0] / len, d[1] / len, d[2] / len]
  let nearest = Infinity
  for (const b of boxes) {
    const t = rayBoxDistance(o, n, b)
    if (t !== null && t < nearest) nearest = t
  }
  if (n[1] > 1e-9) nearest = Math.min(nearest, (ceiling - o[1]) / n[1])
  return clamp(Math.min(maxDist, nearest - MARGIN), MIN_DIST, maxDist)
}
