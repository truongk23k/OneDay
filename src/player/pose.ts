import type { Overlay } from '../story/state'

// Động tác của Anh: đi/đứng bình thường, ngồi máy tính, đánh răng, rửa mặt, uống nước, ngồi xổm (đi vệ sinh).
export type Pose = 'none' | 'sit' | 'brush' | 'wash' | 'drink' | 'squat' | 'pullup' | 'bathe' | 'flex' | 'lie' | 'stretch' | 'phone'
export type Transient = { pose: Pose; until: number } | null

export function poseFor(i: { overlay: Overlay | null; sitting: boolean; transient: Transient; now: number }): Pose {
  if (i.transient && i.now < i.transient.until) return i.transient.pose
  if (i.sitting) return 'sit'
  if (i.overlay === 'brush') return 'brush'
  if (i.overlay === 'wash') return 'wash'
  if (i.overlay === 'phone') return 'phone'
  return 'none'
}
