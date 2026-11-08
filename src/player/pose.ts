import type { Overlay } from '../story/state'

// Động tác của Anh: đi/đứng bình thường, ngồi máy tính, đánh răng, rửa mặt, uống nước, ngồi xổm (đi vệ sinh).
export type Pose =
  | 'none'
  | 'sit'
  | 'brush'
  | 'wash'
  | 'drink'
  | 'squat'
  | 'pullup'
  | 'bathe'
  | 'flex'
  | 'lie'
  | 'stretch'
  | 'phone'
  | 'pee'
  | 'poop'
  | 'cook'
  | 'ride'
  | 'pillion'
  | 'danceTiktok'
  | 'danceHips'
  | 'danceSpin'

// Các điệu nhảy (nút 💃 hoặc phím G).
export const DANCES = ['danceTiktok', 'danceHips', 'danceSpin'] as const satisfies readonly Pose[]
export type Dance = (typeof DANCES)[number]
export type Transient = { pose: Pose; until: number } | null

export function poseFor(i: { overlay: Overlay | null; sitting: boolean; transient: Transient; now: number }): Pose {
  if (i.transient && i.now < i.transient.until) return i.transient.pose
  if (i.sitting) return 'sit'
  if (i.overlay === 'brush') return 'brush'
  if (i.overlay === 'wash') return 'wash'
  if (i.overlay === 'phone') return 'phone'
  return 'none'
}
