import type { Box } from './layout'

// Ô khoét trên tường (cửa sổ, ô thông bếp). axis: tường chạy theo trục nào.
export type Opening = { wall: string; axis: 'x' | 'z'; min: number; max: number; minY: number; maxY: number }
export type Block = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }

// Chia một bức tường thành các khối bao quanh ô khoét (chỉ để vẽ; va chạm vẫn dùng nguyên tường).
export function splitWall(wall: Box, o: Opening): Block[] {
  const along = o.axis === 'z' ? [wall.minZ, wall.maxZ] : [wall.minX, wall.maxX]
  const spans: [number, number, number, number][] = [
    [along[0], o.min, 0, wall.height],
    [o.max, along[1], 0, wall.height],
    [o.min, o.max, 0, o.minY],
    [o.min, o.max, o.maxY, wall.height],
  ]
  return spans
    .filter(([a, b, y0, y1]) => b - a > 1e-9 && y1 - y0 > 1e-9)
    .map(([a, b, minY, maxY]) =>
      o.axis === 'z'
        ? { minX: wall.minX, maxX: wall.maxX, minY, maxY, minZ: a, maxZ: b }
        : { minX: a, maxX: b, minY, maxY, minZ: wall.minZ, maxZ: wall.maxZ },
    )
}
