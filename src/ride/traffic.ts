import type { Box } from '../room/layout'
import { LIGHTS, ROAD_HALF } from './city'

// Xe cộ chạy vòng quanh các khối nhà, đi bên phải đường, dừng đèn đỏ và chờ xe phía trước (kể cả xe của Anh).
export type VehicleKind = 'moto' | 'car' | 'bus'
export type Vehicle = { kind: VehicleKind; loop: number; s: number; speed: number }
export type VehiclePose = { x: number; z: number; heading: number; dx: number; dz: number }
export type LightColor = 'green' | 'yellow' | 'red'

export const VEHICLE: Record<VehicleKind, { w: number; l: number; speed: number }> = {
  moto: { w: 0.8, l: 1.9, speed: 9 },
  car: { w: 1.8, l: 4.2, speed: 8 },
  bus: { w: 2.5, l: 10, speed: 6 },
}

const LANE = 2
const TURN = 3
const BIKE_R = 0.45

type Seg = { x: number; z: number; dx: number; dz: number; len: number; start: number; heading: number }
type Loop = { segs: Seg[]; length: number }

const headingOf = (dx: number, dz: number) => Math.atan2(-dx, -dz)

// Các góc theo tim đường, theo thứ tự xe chạy; làn xe lệch sang bên phải hướng đi.
function makeLoop(corners: [number, number][]): Loop {
  const n = corners.length
  const dirs = corners.map((c, i) => {
    const d = corners[(i + 1) % n]
    const len = Math.hypot(d[0] - c[0], d[1] - c[1])
    return [(d[0] - c[0]) / len, (d[1] - c[1]) / len]
  })
  const pts = corners.map((c, i) => {
    const a = dirs[(i - 1 + n) % n]
    const b = dirs[i]
    return [c[0] + (-a[1] - b[1]) * LANE, c[1] + (a[0] + b[0]) * LANE]
  })
  let start = 0
  const segs = pts.map((p, i) => {
    const q = pts[(i + 1) % n]
    const len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const seg = { x: p[0], z: p[1], dx: dirs[i][0], dz: dirs[i][1], len, start, heading: headingOf(dirs[i][0], dirs[i][1]) }
    start += len
    return seg
  })
  return { segs, length: start }
}

// Vòng lớn hàng dưới và hàng trên chạy theo chiều kim đồng hồ; vòng nhỏ ở giữa hàng trên chạy ngược lại.
export const LOOPS: Loop[] = [
  makeLoop([[0, -100], [360, -100], [360, 0], [0, 0]]),
  makeLoop([[0, -200], [360, -200], [360, -100], [0, -100]]),
  makeLoop([[120, -200], [120, -100], [240, -100], [240, -200]]),
]

const SPAWN: [VehicleKind, number, number][] = [
  ['moto', 0, 0.05],
  ['car', 0, 0.2],
  ['moto', 0, 0.38],
  ['bus', 0, 0.55],
  ['moto', 0, 0.7],
  ['car', 0, 0.9],
  ['car', 1, 0.1],
  ['moto', 1, 0.35],
  ['car', 1, 0.6],
  ['moto', 1, 0.82],
  ['moto', 2, 0.25],
  ['car', 2, 0.75],
]

export function newTraffic(): Vehicle[] {
  return SPAWN.map(([kind, loop, f]) => ({ kind, loop, s: LOOPS[loop].length * f, speed: VEHICLE[kind].speed }))
}

const wrap = (s: number, len: number) => ((s % len) + len) % len

function lerpAngle(a: number, b: number, k: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + d * k
}

// Vị trí trên vòng; heading được làm mượt quanh góc cua (chỉ để vẽ), dx/dz là hướng của đoạn đường.
export function poseOf(v: Vehicle): VehiclePose {
  const loop = LOOPS[v.loop]
  const s = wrap(v.s, loop.length)
  const n = loop.segs.length
  let i = n - 1
  while (i > 0 && loop.segs[i].start > s) i--
  const seg = loop.segs[i]
  const t = s - seg.start
  let heading = seg.heading
  if (t > seg.len - TURN) heading = lerpAngle(seg.heading, loop.segs[(i + 1) % n].heading, ((t - (seg.len - TURN)) / TURN) * 0.5)
  else if (t < TURN) heading = lerpAngle(loop.segs[(i - 1 + n) % n].heading, seg.heading, 0.5 + (t / TURN) * 0.5)
  return { x: seg.x + seg.dx * t, z: seg.z + seg.dz * t, heading, dx: seg.dx, dz: seg.dz }
}

export function vehicleBox(v: Vehicle): Box {
  const p = poseOf(v)
  const { w, l } = VEHICLE[v.kind]
  const alongX = Math.abs(p.dx) > Math.abs(p.dz)
  const hx = (alongX ? l : w) / 2
  const hz = (alongX ? w : l) / 2
  return { id: `vehicle-${v.kind}`, minX: p.x - hx, maxX: p.x + hx, minZ: p.z - hz, maxZ: p.z + hz, height: 2 }
}

// Chu kỳ đèn 16 s: trục x xanh 6.5 s → vàng 1.5 s → đỏ 8 s; trục z ngược lại. Mỗi đèn lệch pha 4 s.
export const LIGHT_CYCLE = 16
export function lightState(i: number, t: number, axis: 'x' | 'z'): LightColor {
  const c = wrap(t + i * 4, LIGHT_CYCLE)
  const local = axis === 'x' ? c : wrap(c - 8, LIGHT_CYCLE)
  return local < 6.5 ? 'green' : local < 8 ? 'yellow' : 'red'
}

export const axisOf = (dx: number, dz: number): 'x' | 'z' => (Math.abs(dx) > Math.abs(dz) ? 'x' : 'z')

// Quãng còn được chạy trước khi tới vạch dừng của đèn đỏ/vàng phía trước (Infinity nếu không phải dừng).
function lightLimit(p: VehiclePose, half: number, t: number): number {
  const axis = axisOf(p.dx, p.dz)
  let limit = Infinity
  LIGHTS.forEach((l, i) => {
    const side = axis === 'x' ? Math.abs(p.z - l.z) : Math.abs(p.x - l.x)
    if (side > ROAD_HALF) return
    const ahead = (l.x - p.x) * p.dx + (l.z - p.z) * p.dz
    const gap = ahead - ROAD_HALF - 1 - half
    if (gap < -0.01 || gap > 15) return
    const color = lightState(i, t, axis)
    if (color === 'green' || (color === 'yellow' && gap < 3)) return
    limit = Math.min(limit, Math.max(0, gap))
  })
  return limit
}

// Khoảng trống tới một vật ở phía trước cùng làn (rel: từ tâm xe tới vật).
function aheadGap(p: VehiclePose, rel: [number, number], reach: number, lateral: number): number {
  const ahead = rel[0] * p.dx + rel[1] * p.dz
  const side = Math.abs(rel[0] * p.dz - rel[1] * p.dx)
  if (ahead <= 0 || side > lateral) return Infinity
  return Math.max(0, ahead - reach)
}

export function stepTraffic(cars: Vehicle[], dt: number, t: number, bike: { x: number; z: number } | null): Vehicle[] {
  const poses = cars.map(poseOf)
  return cars.map((v, i) => {
    const p = poses[i]
    const size = VEHICLE[v.kind]
    let adv = Math.min(v.speed * dt, lightLimit(p, size.l / 2, t))
    cars.forEach((o, k) => {
      if (k === i) return
      const q = poses[k]
      if (q.dx * p.dx + q.dz * p.dz < 0.7) return
      const other = VEHICLE[o.kind]
      adv = Math.min(adv, aheadGap(p, [q.x - p.x, q.z - p.z], size.l / 2 + other.l / 2 + 1.5, (size.w + other.w) / 2 + 0.3))
    })
    if (bike) adv = Math.min(adv, aheadGap(p, [bike.x - p.x, bike.z - p.z], size.l / 2 + BIKE_R + 1.2, size.w / 2 + BIKE_R + 0.3))
    return adv > 0 ? { ...v, s: wrap(v.s + adv, LOOPS[v.loop].length) } : v
  })
}
