import type { PoliceReason, Stage } from '../story/state'
import { ALLEY, ROAD_HALF, ROADS_Z } from './city'
import { routeTo, snapToRoad, type Pt } from './nav'

// CSGT: vượt đèn đỏ (hay bốc đầu trước chốt) là bị xe CSGT hú còi đuổi theo.
// Xe CSGT là ô tô: nhanh hơn xe máy trên đường thẳng, phải chậm lại ở góc rẽ, và không vào được hẻm.
export type { PoliceReason }
export type Police = {
  mode: 'off' | 'chase' | 'pullover'
  x: number
  z: number
  heading: number
  speed: number
  since: number
  lostFor: number
  reason: PoliceReason | null
}
export type PoliceEvent = 'caught' | 'surrender' | 'lost'

export const POLICE = {
  speed: 15.5,
  accel: 6,
  brake: 14,
  corner: 7,
  catchDist: 3.2,
  // Xe máy đứng gần như yên lúc bị đuổi kịp = tự dừng xe chịu phạt.
  stoppedSpeed: 1.5,
  loseDist: 100,
  loseTime: 3,
  giveUp: 30,
  spawnBack: 45,
}

// Chốt CSGT trên phố x = 240, giữa nhà Em và chỗ làm của Em (soi mũ bảo hiểm, cấm bốc đầu).
export const CHECKPOINT = { x: 240, z: -150 }
export const CHECK_RADIUS = 7
export const CHECK_WATCH = 35

export const newPolice = (): Police => ({ mode: 'off', x: 0, z: 0, heading: 0, speed: 0, since: 0, lostFor: 0, reason: null })

// Thiếu mũ bảo hiểm: đi một mình cần 1 mũ, chở Em cần 2.
export const helmetsShort = (stage: Stage, helmets: number) => helmets < (stage === 'withEm' ? 2 : 1)

export const inAlley = (p: Pt) =>
  Math.abs(p.x - ALLEY.x) < ALLEY.half + 0.6 && p.z < ROADS_Z[0] - ROAD_HALF && p.z > ROADS_Z[1] + ROAD_HALF

type BikeLike = { x: number; z: number; heading: number; speed: number }

export function startChase(bike: BikeLike, time: number, reason: PoliceReason, from?: Pt): Police {
  const back = { x: bike.x + Math.sin(bike.heading) * POLICE.spawnBack, z: bike.z + Math.cos(bike.heading) * POLICE.spawnBack }
  const at = from ? { x: from.x, z: from.z } : snapToRoad(back, { alley: false })
  return {
    mode: 'chase',
    x: at.x,
    z: at.z,
    heading: Math.atan2(-(bike.x - at.x), -(bike.z - at.z)),
    speed: 0,
    since: time,
    lostFor: 0,
    reason,
  }
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z)

export function stepPolice(p: Police, bike: BikeLike, dt: number, time: number): { police: Police; event: PoliceEvent | null } {
  if (p.mode !== 'chase') return { police: p, event: null }
  if (dist(p, bike) < POLICE.catchDist) {
    return { police: { ...p, mode: 'pullover', speed: 0 }, event: Math.abs(bike.speed) < POLICE.stoppedSpeed ? 'surrender' : 'caught' }
  }
  const hiding = inAlley(bike)
  const route = routeTo(p, bike, { alley: false })
  // Xe máy trong hẻm: xe CSGT chỉ tới được đầu hẻm.
  const pts = hiding ? route.points.slice(0, -1) : route.points
  const target = pts.slice(1).find((q) => dist(p, q) > 0.05) ?? p
  const ahead = dist(p, target)
  const corner = target !== pts[pts.length - 1] && ahead < 10
  const cap = hiding && target === pts[pts.length - 1] && ahead < 6 ? 0 : corner ? POLICE.corner : POLICE.speed
  const speed = p.speed < cap ? Math.min(cap, p.speed + POLICE.accel * dt) : Math.max(cap, p.speed - POLICE.brake * dt)
  const step = Math.min(speed * dt, ahead)
  const k = ahead > 0 ? step / ahead : 0
  const x = p.x + (target.x - p.x) * k
  const z = p.z + (target.z - p.z) * k
  const heading = ahead > 0.01 ? Math.atan2(-(target.x - p.x), -(target.z - p.z)) : p.heading
  const far = hiding || route.length > POLICE.loseDist
  const lostFor = far ? p.lostFor + dt : 0
  const next: Police = { ...p, x, z, heading, speed, lostFor }
  if (lostFor > POLICE.loseTime || time - p.since > POLICE.giveUp) return { police: { ...next, mode: 'off', speed: 0 }, event: 'lost' }
  return { police: next, event: null }
}
