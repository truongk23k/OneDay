export type Quality = 'low' | 'medium' | 'high'

// Giới hạn độ phân giải hiển thị theo mức đồ họa (spec §8).
export const DPR_CAP: Record<Quality, number> = { low: 1, medium: 1.5, high: 2 }

export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}

// Thiếu thông tin (Safari không báo RAM) thì không coi là máy yếu.
export function pickQuality(i: { isTouch: boolean; memoryGB?: number; cores?: number }): Quality {
  const fewCores = i.cores !== undefined && i.cores <= 4
  if (i.isTouch) {
    const lowMemory = i.memoryGB !== undefined && i.memoryGB <= 3
    return lowMemory || fewCores ? 'low' : 'medium'
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
