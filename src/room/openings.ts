import type { Box } from './layout'

// Ô khoét trên tường (cửa sổ, cửa đi, ô gác xép). axis: tường chạy theo trục nào.
export type Opening = { wall: string; axis: 'x' | 'z'; min: number; max: number; minY: number; maxY: number }
export type Block = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

// Hình chữ nhật trên mặt tường: a = toạ độ dọc tường, y = chiều cao.
type Rect = { a0: number; a1: number; y0: number; y1: number }

const EPS = 1e-9

function subtract(r: Rect, h: Rect): Rect[] {
  const a0 = Math.max(r.a0, h.a0)
  const a1 = Math.min(r.a1, h.a1)
  const y0 = Math.max(r.y0, h.y0)
  const y1 = Math.min(r.y1, h.y1)
  if (a1 - a0 <= EPS || y1 - y0 <= EPS) return [r]
  return [
    { a0: r.a0, a1: a0, y0: r.y0, y1: r.y1 },
    { a0: a1, a1: r.a1, y0: r.y0, y1: r.y1 },
    { a0, a1, y0: r.y0, y1: y0 },
    { a0, a1, y0: y1, y1: r.y1 },
  ].filter((p) => p.a1 - p.a0 > EPS && p.y1 - p.y0 > EPS)
}

// Chia một bức tường thành các khối bao quanh các ô khoét (chỉ để vẽ; va chạm vẫn dùng nguyên tường).
export function splitWall(wall: Box, holes: Opening[]): Block[] {
  const alongZ = holes[0]?.axis !== 'x'
  let rects: Rect[] = [
    alongZ
      ? { a0: wall.minZ, a1: wall.maxZ, y0: 0, y1: wall.height }
      : { a0: wall.minX, a1: wall.maxX, y0: 0, y1: wall.height },
  ]
  for (const h of holes) {
    const hole = { a0: h.min, a1: h.max, y0: h.minY, y1: h.maxY }
    rects = rects.flatMap((r) => subtract(r, hole))
  }
  return rects.map((r) =>
    alongZ
      ? { minX: wall.minX, maxX: wall.maxX, minY: r.y0, maxY: r.y1, minZ: r.a0, maxZ: r.a1 }
      : { minX: r.a0, maxX: r.a1, minY: r.y0, maxY: r.y1, minZ: wall.minZ, maxZ: wall.maxZ },
  )
}
