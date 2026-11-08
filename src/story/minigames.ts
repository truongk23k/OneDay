// Đánh răng: mỗi lần đổi chiều chà thì thanh tăng 5%.
export type Scrub = { progress: number; lastDir: -1 | 0 | 1 }

export const newScrub = (): Scrub => ({ progress: 0, lastDir: 0 })

export function scrub(s: Scrub, dir: -1 | 1): Scrub {
  if (dir === s.lastDir) return s
  return { progress: Math.min(1, s.progress + 0.05), lastDir: dir }
}

// Rửa mặt: giữ nút để vốc nước, thả trong vùng xanh 60–85%.
export const WASH_FULL_MS = 1600
export const WASH_ZONE = [60, 85] as const

export const washLevel = (heldMs: number) => Math.min(100, (heldMs / WASH_FULL_MS) * 100)

export const washOk = (level: number) => level >= WASH_ZONE[0] && level <= WASH_ZONE[1]
