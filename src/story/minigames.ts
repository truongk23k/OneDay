import { mulberry32 } from './rng'

// ---------- Rửa mặt: 3 lượt, mỗi lượt nước dâng nhanh hơn và vùng xanh hẹp hơn ----------
export const WASH_ROUNDS = [
  { fullMs: 1600, zone: [60, 85] },
  { fullMs: 1200, zone: [40, 56] },
  { fullMs: 900, zone: [70, 80] },
] as const

export const washLevel = (heldMs: number, round: number) => Math.min(100, (heldMs / WASH_ROUNDS[round].fullMs) * 100)

export const washOk = (level: number, round: number) => {
  const [lo, hi] = WASH_ROUNDS[round].zone
  return level >= lo && level <= hi
}

// ---------- Đánh răng: chà sạch mảng bám trên hai hàm răng (như cào thẻ) ----------
// Lưới ô: 24 cột × 8 hàng (4 hàng hàm trên, 4 hàng hàm dưới).
export const PLAQUE_COLS = 24
export const PLAQUE_ROWS = 8
export const BRUSH_DONE = 0.9

export type Plaque = { dirty: boolean[]; initial: number }

export function newPlaque(seed: number): Plaque {
  const rnd = mulberry32(seed)
  let dirty = Array.from({ length: PLAQUE_COLS * PLAQUE_ROWS }, () => rnd() < 0.55)
  // Luôn đủ bẩn để có việc mà chà.
  if (dirty.filter(Boolean).length < 40) dirty = dirty.map((d, i) => d || i % 3 === 0)
  return { dirty, initial: dirty.filter(Boolean).length }
}

// Chà tại (x, y) theo đơn vị ô; xóa mảng bám ở các ô có tâm nằm trong bán kính r.
export function brushAt(p: Plaque, x: number, y: number, r: number): Plaque {
  let changed = false
  const dirty = p.dirty.map((d, i) => {
    if (!d) return d
    const cx = (i % PLAQUE_COLS) + 0.5
    const cy = Math.floor(i / PLAQUE_COLS) + 0.5
    if (Math.hypot(cx - x, cy - y) <= r) {
      changed = true
      return false
    }
    return d
  })
  return changed ? { ...p, dirty } : p
}

export const cleanFraction = (p: Plaque) => (p.initial === 0 ? 1 : 1 - p.dirty.filter(Boolean).length / p.initial)
