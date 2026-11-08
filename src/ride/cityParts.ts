import type { Box } from '../room/layout'
import type { Mat, Part } from '../room/parts'
import { mulberry32 } from '../story/rng'
import { BARRIERS, LIGHTS, MARKERS, ROADS_X, ROADS_Z, ROAD_HALF, SIDEWALK, blockBoxes, cityBounds } from './city'

// Khu phố low-poly kiểu Việt Nam dựng bằng mảnh (gộp theo chất liệu như trong phòng).
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, mat?: Mat): Part => ({
  kind: 'box',
  size: [Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)],
  pos: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  color,
  mat,
})
const cyl = (x: number, y0: number, y1: number, z: number, rTop: number, rBottom: number, color: string, seg = 8): Part => ({
  kind: 'cyl',
  rTop,
  rBottom,
  h: y1 - y0,
  seg,
  pos: [x, (y0 + y1) / 2, z],
  color,
})
const ico = (x: number, y: number, z: number, r: number, color: string, scale?: [number, number, number]): Part => ({ kind: 'ico', r, pos: [x, y, z], color, scale })

const FACADES = ['#f2d9a6', '#e8b4a0', '#bcd9c9', '#f5e6b8', '#d6c3e6', '#f4c48a', '#cfe0ef', '#e9e2d0', '#f0b7b0', '#c7d8a8']
const SIGNS = ['#d93a2f', '#1f6fd1', '#f2b705', '#2f9e55', '#e8553e', '#7a3fb5']
const ROOF = '#7d746a'
const ASPHALT = '#3b3d42'
const PAVEMENT = '#b9b2a6'

function ground(p: Part[]) {
  const b = cityBounds()
  p.push(box(b.minX - 30, b.maxX + 30, -0.05, 0, b.minZ - 30, b.maxZ + 30, '#6f6a5c'))
  const x0 = ROADS_X[0] - ROAD_HALF
  const x1 = ROADS_X[ROADS_X.length - 1] + ROAD_HALF
  const z0 = ROADS_Z[ROADS_Z.length - 1] - ROAD_HALF
  const z1 = ROADS_Z[0] + ROAD_HALF
  for (const rz of ROADS_Z) {
    p.push(box(x0, x1, 0, 0.02, rz - ROAD_HALF, rz + ROAD_HALF, ASPHALT))
    for (let x = x0 + 6; x < x1 - 6; x += 6) {
      if (ROADS_X.some((rx) => Math.abs(x - rx) < ROAD_HALF + 2)) continue
      p.push(box(x, x + 2.2, 0.02, 0.025, rz - 0.08, rz + 0.08, '#e9e6dc'))
    }
  }
  for (const rx of ROADS_X) {
    p.push(box(rx - ROAD_HALF, rx + ROAD_HALF, 0, 0.021, z0, z1, ASPHALT))
    for (let z = z0 + 6; z < z1 - 6; z += 6) {
      if (ROADS_Z.some((rz) => Math.abs(z - rz) < ROAD_HALF + 2)) continue
      p.push(box(rx - 0.08, rx + 0.08, 0.021, 0.026, z, z + 2.2, '#e9e6dc'))
    }
  }
}

// Vỉa hè quanh mỗi khối nhà (giữa mép đường và mặt tiền).
function sidewalks(p: Part[], blocks: Box[]) {
  for (const b of blocks) {
    const s = SIDEWALK
    p.push(
      box(b.minX - s, b.maxX + s, 0, 0.12, b.minZ - s, b.minZ, PAVEMENT),
      box(b.minX - s, b.maxX + s, 0, 0.12, b.maxZ, b.maxZ + s, PAVEMENT),
      box(b.minX - s, b.minX, 0, 0.12, b.minZ, b.maxZ, PAVEMENT),
      box(b.maxX, b.maxX + s, 0, 0.12, b.minZ, b.maxZ, PAVEMENT),
    )
  }
}

type Edge = { x0: number; z0: number; x1: number; z1: number; out: [number, number] }

const edgesOf = (b: Box): Edge[] => [
  { x0: b.minX, z0: b.minZ, x1: b.maxX, z1: b.minZ, out: [0, -1] },
  { x0: b.minX, z0: b.maxZ, x1: b.maxX, z1: b.maxZ, out: [0, 1] },
  { x0: b.minX, z0: b.minZ, x1: b.minX, z1: b.maxZ, out: [-1, 0] },
  { x0: b.maxX, z0: b.minZ, x1: b.maxX, z1: b.maxZ, out: [1, 0] },
]

// Một căn nhà ống: thân, cửa cuốn, ban công + lan can, cửa sổ các tầng, biển hiệu, cục nóng điều hòa.
function tubeHouse(p: Part[], e: Edge, t0: number, t1: number, depth: number, h: number, color: string, rnd: () => number, special?: string) {
  const along = e.x0 === e.x1 ? 'z' : 'x'
  const [ox, oz] = e.out
  const at = (t: number, d: number): [number, number] => (along === 'x' ? [t, e.z0 - oz * d] : [e.x0 - ox * d, t])
  const rect = (ta: number, tb: number, da: number, db: number, y0: number, y1: number, c: string, mat?: Mat) => {
    const [ax, az] = at(ta, da)
    const [bx, bz] = at(tb, db)
    p.push(box(Math.min(ax, bx), Math.max(ax, bx), y0, y1, Math.min(az, bz), Math.max(az, bz), c, mat))
  }
  const w = t1 - t0
  rect(t0, t1, 0, depth, 0, h, special ?? color)
  // Cửa cuốn tầng trệt (hơi nhô ra khỏi mặt tiền)
  rect(t0 + 0.3, t1 - 0.3, -0.04, 0, 0.1, 2.6, rnd() < 0.5 ? '#9aa1a8' : '#5d646b', 'metal')
  // Ban công + lan can mỗi tầng
  for (let y = 3.3; y < h - 1.5; y += 3.2) {
    rect(t0 + 0.1, t1 - 0.1, -0.7, 0, y, y + 0.15, '#d9d4cb')
    rect(t0 + 0.1, t1 - 0.1, -0.72, -0.66, y + 0.15, y + 1.05, '#4a4f55')
    rect(t0 + 0.6, t0 + w / 2 - 0.2, -0.03, 0, y + 0.5, y + 2.4, '#3b5a74')
    rect(t0 + w / 2 + 0.2, t1 - 0.6, -0.03, 0, y + 0.5, y + 2.4, '#3b5a74')
    if (rnd() < 0.35) rect(t1 - 1.0, t1 - 0.3, -0.45, -0.05, y + 1.4, y + 1.9, '#f4f4f2')
  }
  // Biển hiệu cửa hàng
  if (rnd() < 0.45) {
    const c = SIGNS[Math.floor(rnd() * SIGNS.length)]
    rect(t0 + 0.2, t1 - 0.2, -0.25, -0.05, 2.75, 3.25, c)
    rect(t0 + 0.6, t1 - 0.6, -0.27, -0.25, 2.88, 3.12, '#fff6d8', 'emit')
  }
}

// Một dãy nhà ống san sát dọc một mép.
function houseRow(p: Part[], e: Edge, depth: number, rnd: () => number) {
  const along = e.x0 === e.x1 ? 'z' : 'x'
  const start = along === 'x' ? e.x0 : e.z0
  const end = along === 'x' ? e.x1 : e.z1
  for (let t = start; t < end - 2; ) {
    const w = Math.min(end - t, 3.8 + rnd() * 1.6)
    const h = 7 + Math.floor(rnd() * 3) * 3.2 + rnd() * 1.2
    const color = FACADES[Math.floor(rnd() * FACADES.length)]
    // Nhà Em: màu hồng nổi bật, ngay trước chỗ hẹn đón.
    const mid = t + w / 2
    const em = along === 'x' && Math.abs(mid - MARKERS.emHouse.x) < 2.6 && Math.abs(e.z0 - MARKERS.emHouse.z) < 8
    tubeHouse(p, e, t, t + w, depth, h, color, rnd, em ? '#f4a6c0' : undefined)
    t += w
  }
}

function buildings(p: Part[], blocks: Box[], rnd: () => number) {
  for (const b of blocks) {
    const thin = Math.min(b.maxX - b.minX, b.maxZ - b.minZ)
    const depth = Math.min(10, thin / 2)
    p.push(box(b.minX + depth * 0.5, b.maxX - depth * 0.5, 0, 6, b.minZ + depth * 0.5, b.maxZ - depth * 0.5, ROOF))
    for (const e of edgesOf(b)) houseRow(p, e, depth, rnd)
  }
}

// Bên ngoài các đường vành đai: vỉa hè + dãy nhà quay mặt vào phố, để mép bản đồ không trơ đất trống.
function outerRows(p: Part[], rnd: () => number) {
  const b = cityBounds()
  const d = 10
  const zS = ROADS_Z[0] + ROAD_HALF
  const zN = ROADS_Z[ROADS_Z.length - 1] - ROAD_HALF
  const xW = ROADS_X[0] - ROAD_HALF
  const xE = ROADS_X[ROADS_X.length - 1] + ROAD_HALF
  p.push(
    box(b.minX, b.maxX, 0, 0.12, zS, b.maxZ, PAVEMENT),
    box(b.minX, b.maxX, 0, 0.12, b.minZ, zN, PAVEMENT),
    box(b.minX, xW, 0, 0.12, zN, zS, PAVEMENT),
    box(xE, b.maxX, 0, 0.12, zN, zS, PAVEMENT),
  )
  const edges: Edge[] = [
    { x0: b.minX - d, z0: b.maxZ, x1: b.maxX + d, z1: b.maxZ, out: [0, -1] },
    { x0: b.minX - d, z0: b.minZ, x1: b.maxX + d, z1: b.minZ, out: [0, 1] },
    { x0: b.minX, z0: b.minZ, x1: b.minX, z1: b.maxZ, out: [1, 0] },
    { x0: b.maxX, z0: b.minZ, x1: b.maxX, z1: b.maxZ, out: [-1, 0] },
  ]
  for (const e of edges) houseRow(p, e, d, rnd)
}

// Văn phòng của Em và công ty phần mềm của Anh: nhà cao, kính xanh.
function offices(p: Part[]) {
  const em = MARKERS.emOffice
  p.push(box(em.x - 12, em.x + 12, 0, 16, em.z + 7, em.z + 16, '#9fb8c8'))
  for (let y = 3; y < 15; y += 3) p.push(box(em.x - 11.5, em.x + 11.5, y, y + 2, em.z + 6.95, em.z + 7, '#bfe3ff', 'emit'))
  const anh = MARKERS.anhOffice
  p.push(box(anh.x + 7, anh.x + 17, 0, 21, anh.z - 12, anh.z + 12, '#7f93a6'))
  for (let y = 3; y < 20; y += 3) p.push(box(anh.x + 6.95, anh.x + 7, y, y + 2, anh.z - 11.5, anh.z + 11.5, '#a9d8ff', 'emit'))
}

// Cột điện bê tông dọc vỉa hè và bó dây chằng chịt giữa các cột.
function powerLines(p: Part[], rnd: () => number) {
  const x0 = ROADS_X[0]
  const x1 = ROADS_X[ROADS_X.length - 1]
  for (const rz of ROADS_Z) {
    const z = rz + ROAD_HALF + 1.2
    let prev: number | null = null
    for (let x = x0 + 12; x < x1 - 6; x += 24) {
      if (ROADS_X.some((rx) => Math.abs(x - rx) < ROAD_HALF + 2)) continue
      p.push(cyl(x, 0, 7.5, z, 0.1, 0.14, '#9a968e'), box(x - 0.6, x + 0.6, 6.9, 7.0, z - 0.06, z + 0.06, '#77736b'))
      if (rnd() < 0.5) p.push(ico(x, 6.2, z, 0.35, '#141414', [1.2, 0.8, 1]))
      if (prev !== null) for (const y of [6.3, 6.6, 6.95]) p.push(box(prev, x, y - 0.025, y + 0.025, z - 0.03 + y * 0.02, z + 0.03 + y * 0.02, '#111111'))
      prev = x
    }
  }
}

function trees(p: Part[]) {
  for (const rz of ROADS_Z) {
    const z = rz - ROAD_HALF - 1.4
    for (let x = ROADS_X[0] + 20; x < ROADS_X[ROADS_X.length - 1]; x += 32) {
      if (ROADS_X.some((rx) => Math.abs(x - rx) < ROAD_HALF + 3)) continue
      p.push(cyl(x, 0.1, 2.6, z, 0.12, 0.16, '#6b4a2f'), ico(x, 3.4, z, 1.3, '#4f8a3c', [1, 0.85, 1]))
    }
  }
}

// Rào sửa đường sọc cam trắng, cọc tiêu, đống cát.
function roadworks(p: Part[]) {
  for (const b of BARRIERS) {
    for (const z of [b.minZ, b.maxZ]) {
      for (let x = b.minX; x < b.maxX; x += 1) p.push(box(x, x + 1, 0.2, 1.1, z - 0.1, z + 0.1, Math.round(x) % 2 === 0 ? '#f07b1d' : '#f5f5f0'))
    }
    for (let z = b.minZ + 4; z < b.maxZ - 2; z += 6) p.push(cyl((b.minX + b.maxX) / 2, 0, 0.7, z, 0.04, 0.22, '#f07b1d', 10))
    p.push(ico((b.minX + b.maxX) / 2 + 2, 0.4, (b.minZ + b.maxZ) / 2, 1.4, '#c8a46a', [1, 0.45, 1]))
  }
}

function lightPoles(p: Part[]) {
  for (const l of LIGHTS) {
    const x = l.x + ROAD_HALF + 1
    const z = l.z + ROAD_HALF + 1
    p.push(cyl(x, 0, 4.2, z, 0.07, 0.09, '#2e3134'), box(x - 0.25, x + 0.25, 3.4, 4.4, z - 0.2, z + 0.2, '#1d1f22'))
  }
}

// Hàng xôi trước văn phòng của Em, trạm xe buýt.
function streetLife(p: Part[]) {
  const em = MARKERS.emOffice
  const x = em.x + 16
  const z = em.z + ROAD_HALF + 1.6
  p.push(box(x - 0.7, x + 0.7, 0.12, 0.85, z - 0.45, z + 0.45, '#8a5a35'), cyl(x, 0.85, 1.05, z, 0.28, 0.24, '#d8d2c4', 12))
  p.push(cyl(x, 0.85, 2.6, z + 0.6, 0.03, 0.03, '#d9d9d9'), cyl(x, 2.5, 2.9, z + 0.6, 0, 1.3, '#2f8f4e', 12))
  p.push(cyl(x - 1.3, 0.12, 0.55, z, 0.18, 0.18, '#3a7bd5', 10), cyl(x + 1.3, 0.12, 0.55, z, 0.18, 0.18, '#d93a2f', 10))
  const bx = 175
  const bz = -100 - ROAD_HALF - 1.6
  p.push(box(bx - 2, bx + 2, 2.4, 2.55, bz - 0.8, bz + 0.8, '#2b6cb0'), cyl(bx - 1.9, 0.12, 2.4, bz - 0.7, 0.05, 0.05, '#c8c8c8'), cyl(bx + 1.9, 0.12, 2.4, bz - 0.7, 0.05, 0.05, '#c8c8c8'))
  p.push(box(bx - 1.6, bx + 1.6, 0.5, 0.58, bz - 0.5, bz - 0.2, '#e0e0e0'))
}

export function buildCityParts(): Part[] {
  const rnd = mulberry32(2026)
  const p: Part[] = []
  const blocks = blockBoxes()
  ground(p)
  sidewalks(p, blocks)
  buildings(p, blocks, rnd)
  offices(p)
  powerLines(p, rnd)
  trees(p)
  roadworks(p)
  lightPoles(p)
  streetLife(p)
  outerRows(p, rnd)
  return p
}
