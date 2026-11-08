export type Quality = 'low' | 'medium' | 'high'

// Giới hạn độ phân giải hiển thị theo mức đồ họa (spec §8).
export const DPR_CAP: Record<Quality, number> = { low: 1, medium: 1.5, high: 2 }

export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}

// Thiếu thông tin thì không coi là máy yếu. Safari (iPhone) không báo RAM và báo số nhân giả (4 hoặc 2)
// để chống theo dõi, nên trên cảm ứng chỉ tin số nhân khi trình duyệt có báo RAM.
export function pickQuality(i: { isTouch: boolean; memoryGB?: number; cores?: number }): Quality {
  const fewCores = i.cores !== undefined && i.cores <= 4
  if (i.isTouch) {
    if (i.memoryGB === undefined) return 'medium'
    return i.memoryGB <= 3 || fewCores ? 'low' : 'medium'
  }
  return fewCores ? 'medium' : 'high'
}

export function hasWebGL2(make: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    return make().getContext('webgl2') !== null
  } catch {
    return false
  }
}
