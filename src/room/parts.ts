import { FURNITURE, PULLUP_BAR, RENDER_WALLS, ROOM, WINDOW, type Box, type Furniture } from './layout'
import { splitWall, type Opening } from './openings'

// Đồ đạc low-poly mô tả bằng dữ liệu (các mảnh hộp, trụ, khối cầu), sau đó gộp theo chất liệu để vẽ ít lần.
export type V3 = [number, number, number]
export type Mat = 'std' | 'emit' | 'metal'
type Common = { pos: V3; rot?: V3; color: string; mat?: Mat }
export type Part =
  | (Common & { kind: 'box'; size: V3 })
  | (Common & { kind: 'cyl'; rTop: number; rBottom: number; h: number; seg?: number })
  | (Common & { kind: 'ico'; r: number; scale?: V3 })

// Màu nằm trong từng đỉnh (vertex colour), nên chỉ cần tách theo loại chất liệu.
export const matKey = (p: Part): Mat => p.mat ?? 'std'

export function groupParts(parts: Part[]): Map<Mat, Part[]> {
  const m = new Map<Mat, Part[]>()
  for (const p of parts) {
    const k = matKey(p)
    const list = m.get(k)
    if (list) list.push(p)
    else m.set(k, [p])
  }
  return m
}

// Hộp bao (bỏ qua xoay nhẹ; đủ dùng để kiểm tra mảnh nằm trong phòng).
export function partBounds(p: Part) {
  let hx: number, hy: number, hz: number
  if (p.kind === 'box') [hx, hy, hz] = [p.size[0] / 2, p.size[1] / 2, p.size[2] / 2]
  else if (p.kind === 'cyl') {
    const r = Math.max(p.rTop, p.rBottom)
    const tilted = p.rot && (Math.abs(p.rot[0]) > 0.5 || Math.abs(p.rot[2]) > 0.5)
    ;[hx, hy, hz] = tilted ? [p.h / 2, p.h / 2, p.h / 2] : [r, p.h / 2, r]
  } else {
    const s = p.scale ?? [1, 1, 1]
    ;[hx, hy, hz] = [p.r * s[0], p.r * s[1], p.r * s[2]]
  }
  const [x, y, z] = p.pos
  return { minX: x - hx, maxX: x + hx, minY: y - hy, maxY: y + hy, minZ: z - hz, maxZ: z + hz }
}

// ---------- Trợ giúp ----------
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, mat?: Mat): Part => ({
  kind: 'box',
  size: [x1 - x0, y1 - y0, z1 - z0],
  pos: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  color,
  mat,
})
const cyl = (x: number, y0: number, y1: number, z: number, r: number, color: string, opts: Partial<Part> & { rTop?: number; seg?: number } = {}): Part => ({
  kind: 'cyl',
  rTop: opts.rTop ?? r,
  rBottom: r,
  h: y1 - y0,
  seg: opts.seg ?? 10,
  pos: [x, (y0 + y1) / 2, z],
  color,
  mat: opts.mat,
})
const ico = (x: number, y: number, z: number, r: number, color: string, scale?: V3): Part => ({ kind: 'ico', r, pos: [x, y, z], color, scale })

// Bảng màu lấy theo ảnh phòng.
const C = {
  wall: '#ebe7df',
  cornice: '#f6f4ef',
  wood: '#c79a68',
  woodDark: '#8a5a35',
  doorWood: '#5e2617',
  doorPanel: '#6f2e1c',
  white: '#f3f2ee',
  black: '#17171a',
  red: '#c8352d',
  steel: '#b9bdc2',
  fridgeDoor: '#c4c8cc',
  green: '#2f9e55',
  counterTop: '#9a4b3b',
  tile: '#f1efea',
  foil: '#c9cdd2',
  pink: '#e48fb0',
  mirror: '#d5dde2',
  screen: '#cfe3ff',
  mesh: '#25262a',
  blanketRed: '#c62f2f',
  blanketLilac: '#b9b3d9',
  pillowPink: '#f2a7b6',
  pillowNavy: '#2b3a67',
  bamboo: '#a37b4c',
  plastic: '#2f6fd6',
}

// ---------- Từng món đồ ----------
function door(b: Box): Part[] {
  const { minX: x0, maxX: x1 } = b
  const z = 0.05
  const p: Part[] = [
    box(x0, x1, 0, 2.2, 0, z, C.doorWood),
    box(x0 - 0.07, x0, 0, 2.27, 0, 0.06, C.woodDark),
    box(x1, x1 + 0.07, 0, 2.27, 0, 0.06, C.woodDark),
    box(x0 - 0.07, x1 + 0.07, 2.2, 2.27, 0, 0.06, C.woodDark),
  ]
  // Ô panel nổi trên cánh cửa
  const w = x1 - x0
  for (const [fx0, fx1, y0, y1] of [
    [0.1, 0.45, 1.75, 2.08],
    [0.55, 0.9, 1.75, 2.08],
    [0.1, 0.45, 0.85, 1.6],
    [0.55, 0.9, 0.85, 1.6],
    [0.1, 0.9, 0.15, 0.7],
  ]) {
    p.push(box(x0 + fx0 * w, x0 + fx1 * w, y0, y1, z, z + 0.02, C.doorPanel))
  }
  // Ô thoáng song sắt phía trên cửa
  p.push(box(x0 - 0.07, x1 + 0.07, 2.62, 2.68, 0, 0.06, C.woodDark))
  p.push(box(x0 - 0.07, x0, 2.27, 2.62, 0, 0.06, C.woodDark), box(x1, x1 + 0.07, 2.27, 2.62, 0, 0.06, C.woodDark))
  p.push(box(x0, x1, 2.27, 2.62, 0, 0.01, '#e9eef2', 'emit'))
  for (const t of [0.33, 0.66]) p.push(box(x0 + t * w - 0.01, x0 + t * w + 0.01, 2.27, 2.62, 0.01, 0.03, C.woodDark))
  p.push(box(x0, x1, 2.43, 2.45, 0.01, 0.03, C.woodDark))
  // Tay nắm + chốt
  p.push(ico(x1 - 0.1, 1.0, z + 0.04, 0.03, C.steel), box(x0 + 0.05, x0 + 0.17, 1.1, 1.13, z, z + 0.03, C.steel))
  return p
}

function counter(x0: number, x1: number, z0: number, z1: number): Part[] {
  return [box(x0, x1, 0, 0.8, z0, z1, C.white), box(x0, x1, 0.8, 0.85, z0, z1, C.counterTop), box(x0, x1, 0, 0.08, z0, z1, '#d9d6cf')]
}

function kitchenLong(b: Box): Part[] {
  const p = counter(b.minX, b.maxX, b.minZ, b.maxZ)
  // Giấy bạc dán tường
  p.push(box(0, 0.012, 0.85, 1.6, 0, b.maxZ, C.foil, 'metal'))
  // Bếp từ
  p.push(box(0.1, 0.5, 0.85, 0.88, 0.7, 1.1, C.black))
  p.push(cyl(0.3, 0.88, 0.885, 0.9, 0.12, '#3a3a3e', { seg: 16 }))
  // Giá bát inox ở góc + bát đĩa
  for (const y of [0.95, 1.17, 1.39]) p.push(box(0.08, 0.5, y, y + 0.02, 1.15, 1.6, C.steel, 'metal'))
  for (const [x, z] of [
    [0.09, 1.16],
    [0.49, 1.16],
    [0.09, 1.59],
    [0.49, 1.59],
  ]) p.push(cyl(x, 0.85, 1.5, z, 0.008, C.steel, { mat: 'metal', seg: 5 }))
  for (const z of [1.25, 1.4, 1.52]) p.push(ico(0.28, 1.02, z, 0.06, C.white, [1, 0.6, 1]))
  for (const z of [1.25, 1.45]) p.push(ico(0.25, 1.24, z, 0.06, '#f4e9d8', [1, 0.6, 1]))
  p.push({ kind: 'cyl', rTop: 0.14, rBottom: 0.14, h: 0.015, seg: 16, pos: [0.06, 1.56, 1.35], rot: [0, 0, 1.45], color: C.white })
  // Chai lọ gia vị gần cửa
  const bottles: [number, string, number][] = [
    [0.12, '#b8321f', 0.26],
    [0.2, '#e3b23c', 0.18],
    [0.28, '#7a3e1d', 0.3],
    [0.36, '#d9a441', 0.22],
    [0.44, '#c0392b', 0.16],
  ]
  for (const [z, color, h] of bottles) p.push(cyl(0.18 + (z * 10) % 0.2, 0.85, 0.85 + h, z, 0.035, color, { seg: 8 }))
  return p
}

function kitchenShort(b: Box): Part[] {
  const p = counter(b.minX, b.maxX, b.minZ, b.maxZ)
  p.push(box(b.minX, b.maxX, 0.85, 1.4, 1.688, 1.7, C.foil, 'metal'))
  // Bồn rửa + vòi
  p.push(box(0.85, 1.3, 0.85, 0.87, 1.18, 1.58, '#8d9399', 'metal'))
  p.push(box(0.9, 1.25, 0.86, 0.871, 1.23, 1.53, '#5d636a', 'metal'))
  p.push(cyl(1.07, 0.85, 1.12, 1.64, 0.015, C.steel, { mat: 'metal' }))
  p.push({ kind: 'cyl', rTop: 0.012, rBottom: 0.012, h: 0.16, pos: [1.07, 1.12, 1.57], rot: [Math.PI / 2, 0, 0], color: C.steel, mat: 'metal' })
  // Thớt gỗ dựng tường
  p.push(box(0.65, 0.8, 0.86, 1.2, 1.66, 1.685, C.wood))
  return p
}

function fridge(b: Box, front: '+z' | '+x', sticker: string): Part[] {
  const p: Part[] = [box(b.minX, b.maxX, 0, b.height, b.minZ, b.maxZ, C.steel)]
  const split = b.height * 0.7
  if (front === '+z') {
    const z = b.maxZ
    p.push(box(b.minX + 0.01, b.maxX - 0.01, split + 0.01, b.height - 0.02, z, z + 0.02, C.fridgeDoor))
    p.push(box(b.minX + 0.01, b.maxX - 0.01, 0.04, split - 0.01, z, z + 0.02, C.fridgeDoor))
    p.push(box(b.minX + 0.08, b.maxX - 0.06, split + 0.08, b.height - 0.08, z + 0.02, z + 0.025, sticker))
    p.push(box(b.minX + 0.08, b.maxX - 0.06, split - 0.45, split - 0.08, z + 0.02, z + 0.025, sticker))
    p.push(box(b.minX + 0.03, b.minX + 0.05, split - 0.35, split - 0.05, z + 0.02, z + 0.05, '#6d7277'))
    p.push(box(b.minX + 0.03, b.minX + 0.05, split + 0.05, split + 0.2, z + 0.02, z + 0.05, '#6d7277'))
  } else {
    const x = b.maxX
    p.push(box(x, x + 0.02, split + 0.01, b.height - 0.02, b.minZ + 0.01, b.maxZ - 0.01, C.fridgeDoor))
    p.push(box(x, x + 0.02, 0.04, split - 0.01, b.minZ + 0.01, b.maxZ - 0.01, C.fridgeDoor))
    p.push(box(x + 0.02, x + 0.025, split - 0.45, split - 0.08, b.minZ + 0.08, b.maxZ - 0.06, sticker))
    p.push(box(x + 0.02, x + 0.05, split - 0.35, split - 0.05, b.maxZ - 0.05, b.maxZ - 0.03, '#6d7277'))
  }
  return p
}

function airFryer(x: number, y: number, z: number): Part[] {
  return [
    box(x - 0.14, x + 0.14, y, y + 0.3, z - 0.13, z + 0.13, C.black),
    box(x + 0.08, x + 0.13, y + 0.1, y + 0.2, z + 0.13, z + 0.2, '#2b2b2e'),
    ico(x - 0.05, y + 0.25, z + 0.135, 0.02, C.steel),
    ico(x + 0.03, y + 0.25, z + 0.135, 0.02, C.steel),
  ]
}

function desk(b: Box, front: '+z' | '+x'): Part[] {
  const top = b.height
  const p: Part[] = [box(b.minX, b.maxX, top - 0.03, top, b.minZ, b.maxZ, C.black)]
  if (front === '+z') {
    p.push(box(b.minX, b.maxX, top - 0.035, top, b.maxZ - 0.02, b.maxZ, C.red))
    for (const x of [b.minX + 0.04, b.maxX - 0.08]) p.push(box(x, x + 0.04, 0, top - 0.03, b.minZ + 0.1, b.maxZ - 0.1, C.black))
    p.push(box(b.minX + 0.04, b.maxX - 0.04, 0.12, 0.15, b.minZ + 0.1, b.minZ + 0.14, C.black))
  } else {
    p.push(box(b.maxX - 0.02, b.maxX, top - 0.035, top, b.minZ, b.maxZ, C.red))
    for (const z of [b.minZ + 0.04, b.maxZ - 0.08]) p.push(box(b.minX + 0.08, b.maxX - 0.1, 0, top - 0.03, z, z + 0.04, C.black))
  }
  return p
}

function monitor(x: number, y: number, z: number, face: '+z' | '+x', w = 0.55): Part[] {
  const h = 0.33
  if (face === '+z') {
    return [
      box(x - 0.08, x + 0.08, y, y + 0.015, z - 0.08, z + 0.04, C.black),
      box(x - 0.02, x + 0.02, y, y + 0.22, z - 0.04, z - 0.01, C.black),
      box(x - w / 2, x + w / 2, y + 0.12, y + 0.12 + h, z, z + 0.025, C.black),
      box(x - w / 2 + 0.015, x + w / 2 - 0.015, y + 0.135, y + 0.105 + h, z + 0.025, z + 0.027, C.screen, 'emit'),
    ]
  }
  return [
    box(x - 0.04, x + 0.08, y, y + 0.015, z - 0.08, z + 0.08, C.black),
    box(x - 0.04, x - 0.01, y, y + 0.22, z - 0.02, z + 0.02, C.black),
    box(x, x + 0.025, y + 0.12, y + 0.12 + h, z - w / 2, z + w / 2, C.black),
    box(x + 0.025, x + 0.027, y + 0.135, y + 0.105 + h, z - w / 2 + 0.015, z + w / 2 - 0.015, C.screen, 'emit'),
  ]
}

function laptop(x: number, y: number, z: number, face: '+z' | '+x'): Part[] {
  if (face === '+z') {
    return [
      box(x - 0.17, x + 0.17, y, y + 0.02, z - 0.02, z + 0.22, '#2a2b30'),
      { kind: 'box', size: [0.34, 0.22, 0.015], pos: [x, y + 0.11, z - 0.06], rot: [-0.25, 0, 0], color: '#2a2b30' },
      { kind: 'box', size: [0.3, 0.18, 0.004], pos: [x, y + 0.11, z - 0.05], rot: [-0.25, 0, 0], color: C.screen, mat: 'emit' },
    ]
  }
  return [
    box(x - 0.02, x + 0.22, y, y + 0.02, z - 0.17, z + 0.17, '#2a2b30'),
    { kind: 'box', size: [0.015, 0.22, 0.34], pos: [x - 0.06, y + 0.11, z], rot: [0, 0, 0.25], color: '#2a2b30' },
    { kind: 'box', size: [0.004, 0.18, 0.3], pos: [x - 0.05, y + 0.11, z], rot: [0, 0, 0.25], color: C.screen, mat: 'emit' },
  ]
}

function deskMine(b: Box): Part[] {
  const y = b.height
  return [
    ...desk(b, '+z'),
    ...monitor(4.45, y, 1.7, '+z'),
    ...laptop(3.95, y, 1.75, '+z'),
    box(4.85, 5.0, y, y + 0.22, 1.62, 1.76, C.black),
    box(5.05, 5.2, y, y + 0.22, 1.62, 1.76, C.black),
    // Bàn phím hồng trắng + chuột
    box(4.2, 4.65, y, y + 0.02, 2.05, 2.2, '#f2dfe6'),
    ico(4.78, y + 0.015, 2.12, 0.03, '#f2f2f2', [1, 0.5, 1.5]),
    box(4.05, 4.85, y, y + 0.004, 1.95, 2.35, '#1d2a4a'),
    ico(5.35, y + 0.08, 1.7, 0.06, '#e8d7c3'),
    ico(5.35, y + 0.17, 1.7, 0.045, '#e8d7c3'),
  ]
}

function deskFriend(b: Box): Part[] {
  const y = b.height
  // Theo ảnh: 1 màn hình (phía gần cửa) + 1 laptop (phía gần cửa sổ), không có cây máy tính.
  return [
    ...desk(b, '+x'),
    ...monitor(0.15, y, 2.4, '+x', 0.55),
    ...laptop(0.42, y, 3.15, '+x'),
    box(0.42, 0.58, y, y + 0.02, 2.2, 2.62, '#2a2b30'),
    box(0.38, 0.72, y, y + 0.004, 2.1, 2.95, '#24303a'),
    ico(0.55, y + 0.015, 2.78, 0.03, '#2a2b30', [1, 0.5, 1.5]),
    box(0.1, 0.35, y, y + 0.06, 1.9, 2.05, '#e9e2d0'),
    cyl(0.62, y, y + 0.22, 1.98, 0.04, '#1f4aa8'),
  ]
}

function chair(b: Box, backSide: '+z' | '+x', seatColor: string, frame: string): Part[] {
  const cx = (b.minX + b.maxX) / 2
  const cz = (b.minZ + b.maxZ) / 2
  const p: Part[] = [cyl(cx, 0.05, 0.42, cz, 0.025, C.steel, { mat: 'metal' })]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    p.push({ kind: 'box', size: [0.24, 0.03, 0.04], pos: [cx + Math.cos(a) * 0.12, 0.06, cz + Math.sin(a) * 0.12], rot: [0, -a, 0], color: C.black })
    p.push(ico(cx + Math.cos(a) * 0.23, 0.03, cz + Math.sin(a) * 0.23, 0.03, C.black))
  }
  p.push(box(cx - 0.23, cx + 0.23, 0.42, 0.5, cz - 0.22, cz + 0.22, seatColor))
  if (backSide === '+z') {
    p.push(box(cx - 0.22, cx + 0.22, 0.55, 0.98, b.maxZ - 0.06, b.maxZ - 0.02, seatColor))
    p.push(box(cx - 0.24, cx + 0.24, 0.52, 1.0, b.maxZ - 0.03, b.maxZ, frame))
    for (const x of [cx - 0.24, cx + 0.2]) p.push(box(x, x + 0.04, 0.5, 0.68, cz - 0.15, cz + 0.12, C.black))
  } else {
    p.push(box(b.maxX - 0.06, b.maxX - 0.02, 0.55, 0.98, cz - 0.22, cz + 0.22, seatColor))
    p.push(box(b.maxX - 0.03, b.maxX, 0.52, 1.0, cz - 0.24, cz + 0.24, frame))
    p.push(box(b.maxX - 0.06, b.maxX - 0.01, 1.02, 1.12, cz - 0.14, cz + 0.14, seatColor))
    for (const z of [cz - 0.24, cz + 0.2]) p.push(box(cx - 0.15, cx + 0.12, 0.5, 0.68, z, z + 0.04, frame))
  }
  return p
}

function wardrobe(b: Box): Part[] {
  const x = b.maxX
  const n = 3
  const dz = (b.maxZ - b.minZ) / n
  const p: Part[] = [box(b.minX, b.maxX, 0, b.height, b.minZ, b.maxZ, C.white)]
  for (let i = 0; i < n; i++) {
    const z0 = b.minZ + i * dz
    p.push(box(x, x + 0.02, 0.05, b.height - 0.03, z0 + 0.01, z0 + dz - 0.01, i === n - 1 ? C.wood : C.white))
    p.push(box(x + 0.02, x + 0.04, 0.85, 1.25, z0 + dz - 0.08, z0 + dz - 0.06, C.steel))
  }
  // Đồ chất trên nóc
  p.push(box(0.05, 0.5, b.height, b.height + 0.25, b.minZ + 0.1, b.minZ + 0.55, '#c9a87a'))
  p.push(ico(0.3, b.height + 0.18, b.minZ + 0.9, 0.22, '#3c5a3a', [1, 0.7, 1.2]))
  p.push(box(0.05, 0.55, b.height, b.height + 0.12, b.minZ + 1.3, b.minZ + 1.9, '#e7e2d6'))
  return p
}

function bed(b: Box): Part[] {
  // Khung gỗ thấp, đệm dày 17 cm, chiếu trúc trải trên đệm.
  const frameTop = 0.25
  const top = 0.42
  const p: Part[] = [
    box(b.minX, b.maxX, 0, frameTop, b.minZ, b.maxZ, C.wood),
    box(b.minX + 0.04, b.maxX - 0.02, frameTop, top, b.minZ + 0.04, b.maxZ - 0.06, '#eeeae2'),
    box(b.minX + 0.06, b.maxX - 0.04, top, top + 0.02, b.minZ + 0.06, b.maxZ - 0.08, C.bamboo),
    // Đầu giường gỗ dọc tường nam + đệm đen tựa tường đông
    box(b.minX, b.maxX, frameTop, 0.95, b.maxZ - 0.05, b.maxZ, C.wood),
    box(b.maxX - 0.06, b.maxX, top, 0.8, b.maxZ - 1.0, b.maxZ - 0.05, '#222226'),
  ]
  // Sọc chiếu trúc
  for (let x = b.minX + 0.12; x < b.maxX - 0.06; x += 0.12) p.push(box(x, x + 0.01, top + 0.02, top + 0.025, b.minZ + 0.07, b.maxZ - 0.09, '#8a6538'))
  // Gối + chăn
  p.push(ico(b.minX + 0.7, top + 0.1, b.maxZ - 0.3, 0.22, C.pillowPink, [1.4, 0.45, 0.8]))
  p.push(ico(b.minX + 1.5, top + 0.1, b.maxZ - 0.3, 0.22, C.pillowNavy, [1.4, 0.45, 0.8]))
  p.push(ico(b.minX + 0.9, top + 0.14, b.minZ + 0.9, 0.42, C.blanketRed, [1.3, 0.35, 1.2]))
  p.push(ico(b.minX + 1.6, top + 0.12, b.minZ + 1.2, 0.38, C.blanketLilac, [1.1, 0.32, 1.3]))
  return p
}

function lavabo(b: Box): Part[] {
  const cx = (b.minX + b.maxX) / 2
  return [
    cyl(cx, 0, 0.7, b.minZ + 0.15, 0.08, C.white, { rTop: 0.06 }),
    box(b.minX, b.maxX, 0.7, b.height, b.minZ, b.maxZ, C.white),
    box(b.minX + 0.06, b.maxX - 0.06, b.height - 0.005, b.height + 0.002, b.minZ + 0.06, b.maxZ - 0.05, '#d8dcdf'),
    cyl(cx, b.height, b.height + 0.15, b.minZ + 0.04, 0.015, C.steel, { mat: 'metal' }),
    // Khăn đen treo trên tường nam nhà vệ sinh
    box(4.4, 4.8, 1.2, 1.75, 1.42, 1.445, '#1b1b1e'),
    box(4.35, 4.85, 1.74, 1.77, 1.41, 1.445, C.steel, 'metal'),
  ]
}

function toilet(b: Box): Part[] {
  const cx = (b.minX + b.maxX) / 2
  return [
    box(b.minX + 0.05, b.maxX - 0.05, 0.4, 0.75, b.minZ, b.minZ + 0.2, C.white),
    cyl(cx, 0, 0.35, b.minZ + 0.42, 0.14, C.white, { rTop: 0.2, seg: 12 }),
    cyl(cx, 0.35, 0.4, b.minZ + 0.42, 0.21, '#fbfbf9', { seg: 12 }),
    { kind: 'cyl', rTop: 0.2, rBottom: 0.2, h: 0.02, seg: 12, pos: [cx, 0.6, b.minZ + 0.22], rot: [-1.35, 0, 0], color: '#fbfbf9' },
  ]
}

function shelf(b: Box): Part[] {
  const p: Part[] = [box(b.minX, b.maxX, 0, b.height, b.minZ, b.minZ + 0.02, C.wood), box(b.minX, b.maxX, 0, b.height, b.maxZ - 0.02, b.maxZ, C.wood)]
  for (const y of [0.05, 0.4, 0.7, 0.98]) p.push(box(b.minX, b.maxX, y, y + 0.02, b.minZ, b.maxZ, C.wood))
  const cz = (b.minZ + b.maxZ) / 2
  p.push(ico(b.minX + 0.09, 0.53, cz, 0.08, '#e8d7c3'), ico(b.minX + 0.09, 0.64, cz, 0.055, '#e8d7c3'))
  p.push(box(b.minX + 0.02, b.maxX - 0.02, 0.07, 0.3, b.minZ + 0.04, b.maxZ - 0.04, '#c9a87a'))
  p.push(box(b.minX + 0.03, b.maxX - 0.03, 0.72, 0.84, b.minZ + 0.05, b.maxZ - 0.05, '#7fb3d9'))
  return p
}

function mirror(b: Box): Part[] {
  const t = 0.04
  const p: Part[] = [
    box(b.minX, b.maxX, 0.1, 1.45, b.minZ, b.minZ + t, C.pink),
    box(b.minX, b.maxX, 0.1, 1.45, b.maxZ - t, b.maxZ, C.pink),
    box(b.minX, b.maxX, 0.1, 0.14, b.minZ, b.maxZ, C.pink),
    box(b.minX - 0.15, b.maxX, 0, 0.03, b.minZ, b.minZ + 0.03, C.pink),
    box(b.minX - 0.15, b.maxX, 0, 0.03, b.maxZ - 0.03, b.maxZ, C.pink),
  ]
  // Vòm trên của khung là một dải cong liền (MirrorGlass trong Room.tsx).
  // Tấm lưng gương (phía sau mặt kính phản chiếu).
  p.push(box(b.maxX - 0.015, b.maxX, 0.14, 1.45, b.minZ + t, b.maxZ - t, '#c97a99'))
  return p
}

export function furnitureParts(f: Furniture): Part[] {
  switch (f.id) {
    case 'door':
      return door(f)
    case 'kitchenW':
      return kitchenLong(f)
    case 'kitchenS':
      return kitchenShort(f)
    case 'lavabo':
      return lavabo(f)
    case 'toilet':
      return toilet(f)
    case 'fridge':
      return [...fridge(f, '+z', C.green), ...airFryer(3.3, f.height, 1.82), box(3.47, 3.58, f.height, f.height + 0.1, 1.95, 2.06, C.red)]
    case 'fridge2':
      return fridge(f, '+x', '#4f8fc0')
    case 'deskMine':
      return deskMine(f)
    case 'deskFriend':
      return deskFriend(f)
    case 'chairMine':
      return chair(f, '+z', C.mesh, C.black)
    case 'chairFriend':
      return chair(f, '+x', C.mesh, C.white)
    case 'wardrobe':
      return wardrobe(f)
    case 'bed':
      return bed(f)
    case 'shelf':
      return shelf(f)
    case 'mirror':
      return mirror(f)
    default:
      return [box(f.minX, f.maxX, 0, f.height, f.minZ, f.maxZ, '#8f949c'), box(f.minX, f.maxX, 0, 0.02, f.minZ, f.maxZ, '#8f949c'), box(f.minX, f.maxX, f.height - 0.02, f.height, f.minZ, f.maxZ, '#8f949c')]
  }
}

// Tường (khoét cửa sổ/cửa đi) + phào chỉ trần.
function wallParts(openings: Opening[]): Part[] {
  const p: Part[] = []
  for (const w of RENDER_WALLS) {
    const holes = openings.filter((o) => o.wall === w.id)
    const blocks = holes.length ? splitWall(w, holes) : [{ minX: w.minX, maxX: w.maxX, minY: 0, maxY: w.height, minZ: w.minZ, maxZ: w.maxZ }]
    for (const b of blocks) p.push(box(b.minX, b.maxX, b.minY, b.maxY, b.minZ, b.maxZ, C.wall))
  }
  const W = ROOM.width
  const D = ROOM.depth
  const y0 = ROOM.height - 0.08
  const y1 = ROOM.height
  p.push(box(0, W, y0, y1, 0, 0.06, C.cornice), box(0, W, y0, y1, D - 0.06, D, C.cornice))
  p.push(box(0, 0.06, y0, y1, 0, D, C.cornice), box(W - 0.06, W, y0, y1, 0, D, C.cornice))
  return p
}

function windowParts(): Part[] {
  const { min, max, minY, maxY } = WINDOW
  const p: Part[] = []
  const x0 = -0.1
  const x1 = 0.02
  const t = 0.05
  p.push(
    box(x0, x1, minY, minY + t, min, max, C.white),
    box(x0, x1, maxY - t, maxY, min, max, C.white),
    box(x0, x1, minY, maxY, min, min + t, C.white),
    box(x0, x1, minY, maxY, max - t, max, C.white),
  )
  for (let z = min + 0.16; z < max - 0.1; z += 0.16) p.push(box(x0 + 0.02, x1, minY, maxY, z - 0.01, z + 0.01, C.white))
  for (let y = minY + 0.22; y < maxY - 0.1; y += 0.22) p.push(box(x0 + 0.02, x1, y - 0.01, y + 0.01, min, max, C.white))
  // Điều hòa phía trên
  const mid = (min + max) / 2
  p.push(box(0, 0.24, 2.45, 2.75, mid - 0.4, mid + 0.4, '#fbfbfb'), box(0.2, 0.245, 2.47, 2.5, mid - 0.36, mid + 0.36, '#d6d8da'))
  return p
}

// Đồ lặt vặt sát tường, không chắn lối đi.
function decorParts(): Part[] {
  const p: Part[] = []
  // Đèn tuýp
  p.push(box(3.4, 4.6, 2.55, 2.6, 1.56, 1.6, '#ffffff', 'emit'), box(0.01, 0.05, 2.55, 2.6, 2.0, 3.2, '#ffffff', 'emit'))
  // Xà đơn: tay cầm mút đen + đầu ống inox
  const { x0, x1, y, z } = PULLUP_BAR
  for (const x of [x0 + 0.2, x1 - 0.2]) p.push({ kind: 'cyl', rTop: 0.03, rBottom: 0.03, h: 0.25, pos: [x, y, z], rot: [0, 0, Math.PI / 2], color: '#111' })
  p.push({ kind: 'cyl', rTop: 0.035, rBottom: 0.035, h: 0.04, pos: [x0 + 0.02, y, z], rot: [0, 0, Math.PI / 2], color: C.steel, mat: 'metal' })
  p.push({ kind: 'cyl', rTop: 0.035, rBottom: 0.035, h: 0.04, pos: [x1 - 0.02, y, z], rot: [0, 0, Math.PI / 2], color: C.steel, mat: 'metal' })
  // Ghế nhựa đỏ, chồng ghế xanh, nồi cơm, ấm siêu tốc, vali
  p.push(cyl(2.45, 0, 0.45, 6.1, 0.15, C.red, { rTop: 0.12, seg: 4 }))
  p.push(cyl(2.9, 0, 0.6, 6.1, 0.16, C.plastic, { rTop: 0.13, seg: 4 }))
  p.push(cyl(2.55, 0, 0.22, 5.75, 0.13, '#f4f1e6', { seg: 12 }), cyl(2.55, 0.22, 0.27, 5.75, 0.11, '#a4c639', { seg: 12 }))
  p.push(cyl(2.85, 0, 0.22, 5.75, 0.08, '#2b2b2b', { rTop: 0.07 }), box(2.9, 2.96, 0.08, 0.2, 5.72, 5.78, '#ff8a00'))
  p.push(box(1.0, 1.4, 0, 0.62, 6.15, 6.38, '#1e1e22'))
  return p
}

export function buildRoomParts(openings: Opening[] = []): Part[] {
  return [...wallParts(openings), ...FURNITURE.flatMap(furnitureParts), ...windowParts(), ...decorParts()]
}

