import type { Box } from '../room/layout'
import type { Mat, Part } from '../room/parts'
import { mulberry32 } from '../story/rng'
import { BARRIERS, EM_HOUSE_HEIGHT, LIGHTS, MARKERS, OFFICES, POTHOLES, ROADS_X, ROADS_Z, ROAD_HALF, SIDEWALK, blockBoxes, cityBounds } from './city'

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
  const shutter = rnd() < 0.5 ? '#9aa1a8' : '#5d646b'
  rect(t0 + 0.3, t1 - 0.3, -0.04, 0, 0.1, 2.6, special ? '#f7c6d9' : shutter, 'metal')
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

// Chỗ đã dành cho toà văn phòng thì không xây nhà ống.
function insideOffice(e: Edge, t0: number, t1: number, depth: number) {
  const alongX = e.x0 !== e.x1 || e.z0 === e.z1
  const [minX, maxX, minZ, maxZ] = alongX
    ? [t0, t1, Math.min(e.z0, e.z0 - e.out[1] * depth), Math.max(e.z0, e.z0 - e.out[1] * depth)]
    : [Math.min(e.x0, e.x0 - e.out[0] * depth), Math.max(e.x0, e.x0 - e.out[0] * depth), t0, t1]
  return Object.values(OFFICES).some((o) => minX < o.maxX && maxX > o.minX && minZ < o.maxZ && maxZ > o.minZ)
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
    if (insideOffice(e, t, t + w, depth)) {
      t += w
      continue
    }
    // Nhà Em: căn màu hồng phía nam con phố, ngay sau cửa Em bước ra.
    const dz = e.z0 - MARKERS.emHouse.z
    const em = along === 'x' && t < MARKERS.emHouse.x && t + w > MARKERS.emHouse.x && dz > 0 && dz < 8
    tubeHouse(p, e, t, t + w, depth, em ? EM_HOUSE_HEIGHT : h, color, rnd, em ? '#f4a6c0' : undefined)
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

type Office = (typeof OFFICES)[keyof typeof OFFICES]
type TowerStyle = { body: string; glass: string; accent: string; crown?: boolean }

// Toà văn phòng cao tầng: kính từng tầng, sảnh kính sáng đèn, mái che lối vào, biển hiệu, nóc có ăng-ten.
// front: mặt quay ra đường ('z' = mặt minZ nhìn về -z, 'x' = mặt minX nhìn về -x).
function tower(p: Part[], o: Office, front: 'x' | 'z', s: TowerStyle) {
  const H = o.height
  // Hộp trên mặt tiền: a0..a1 dọc mặt, y0..y1 cao, d0..d1 nhô ra phía đường.
  const face = (a0: number, a1: number, y0: number, y1: number, d0: number, d1: number, color: string, mat?: Mat) =>
    p.push(front === 'z' ? box(a0, a1, y0, y1, o.minZ - d1, o.minZ - d0, color, mat) : box(o.minX - d1, o.minX - d0, y0, y1, a0, a1, color, mat))
  const [A0, A1] = front === 'z' ? [o.minX, o.maxX] : [o.minZ, o.maxZ]
  const mid = (A0 + A1) / 2
  const top = s.crown ? H - 6 : H
  p.push(box(o.minX, o.maxX, 0, top, o.minZ, o.maxZ, s.body))
  if (s.crown) p.push(box(o.minX + 3, o.maxX - 3, top, H, o.minZ + 3, o.maxZ - 3, s.body))

  // Kính từng tầng: mặt tiền và hai mặt bên.
  for (let y = 4.4; y < top - 1.5; y += 3.4) {
    face(A0 + 0.4, A1 - 0.4, y, y + 2.3, 0, 0.06, s.glass, 'metal')
    if (front === 'z') {
      p.push(box(o.minX - 0.06, o.minX, y, y + 2.3, o.minZ + 0.4, o.maxZ - 0.4, s.glass, 'metal'))
      p.push(box(o.maxX, o.maxX + 0.06, y, y + 2.3, o.minZ + 0.4, o.maxZ - 0.4, s.glass, 'metal'))
    } else {
      p.push(box(o.minX + 0.4, o.maxX - 0.4, y, y + 2.3, o.minZ - 0.06, o.minZ, s.glass, 'metal'))
      p.push(box(o.minX + 0.4, o.maxX - 0.4, y, y + 2.3, o.maxZ, o.maxZ + 0.06, s.glass, 'metal'))
    }
  }
  for (let a = A0 + 2.8; a < A1 - 1; a += 2.8) face(a - 0.08, a + 0.08, 4, top - 1, 0, 0.14, '#eef1f4')

  // Sảnh: kính tối, cửa chính sáng đèn ở giữa, mái che và hai cột đỡ, bậc thềm, chậu cây.
  face(A0 + 0.6, A1 - 0.6, 0.12, 3.8, 0, 0.03, '#2a3b4c', 'metal')
  face(mid - 1.8, mid + 1.8, 0.12, 2.8, 0.03, 0.05, '#ffe9b8', 'emit')
  face(mid - 3.6, mid + 3.6, 3.7, 3.95, 0, 2.6, s.accent)
  face(mid - 3.4, mid - 3.25, 0.12, 3.7, 2.3, 2.45, '#c8ccd0')
  face(mid + 3.25, mid + 3.4, 0.12, 3.7, 2.3, 2.45, '#c8ccd0')
  face(mid - 2.6, mid + 2.6, 0.12, 0.28, 0, 0.9, '#d9d4cb')
  for (const a of [mid - 5, mid + 5]) {
    face(a - 0.4, a + 0.4, 0.12, 0.7, 0.3, 1.1, '#6d6f73')
    const [x, z] = front === 'z' ? [a, o.minZ - 0.7] : [o.minX - 0.7, a]
    p.push(ico(x, 1.15, z, 0.55, '#2f8f4e'))
  }

  // Biển hiệu gần nóc: khung màu nhấn, giữa sáng (không chữ, không logo thật).
  face(mid - 5, mid + 5, top - 3.6, top - 1.4, 0, 0.25, s.accent)
  face(mid - 4.4, mid + 1.6, top - 3.0, top - 2.0, 0.25, 0.3, '#ffffff', 'emit')
  face(mid + 2.2, mid + 4.2, top - 3.2, top - 1.8, 0.25, 0.3, '#ffd23f', 'emit')

  // Biển dọc chìa ra vỉa hè ở góc phía xe tới: nhìn dọc phố từ xa vẫn thấy cột sáng màu của toà.
  face(A1 - 1.7, A1 - 1.3, 6, 18, 0, 1.8, s.accent)
  face(A1 - 1.75, A1 - 1.25, 7, 17, 0.25, 1.6, '#ffffff', 'emit')

  // Nóc: lan can, cục máy lạnh, ăng-ten có đèn đỏ.
  const r = s.crown ? 3 : 0
  p.push(
    box(o.minX + r, o.maxX - r, H, H + 0.6, o.minZ + r, o.minZ + r + 0.3, s.body),
    box(o.minX + r, o.maxX - r, H, H + 0.6, o.maxZ - r - 0.3, o.maxZ - r, s.body),
    box(o.minX + r, o.minX + r + 0.3, H, H + 0.6, o.minZ + r, o.maxZ - r, s.body),
    box(o.maxX - r - 0.3, o.maxX - r, H, H + 0.6, o.minZ + r, o.maxZ - r, s.body),
  )
  const cx = (o.minX + o.maxX) / 2
  const cz = (o.minZ + o.maxZ) / 2
  p.push(box(cx - 3, cx - 0.5, H, H + 1.6, cz - 2, cz + 1, '#9aa0a6', 'metal'), box(cx + 1, cx + 3.5, H, H + 1.2, cz - 1, cz + 2, '#9aa0a6', 'metal'))
  p.push(cyl(cx + 2, H, H + 7, cz - 3, 0.06, 0.12, '#c8c8c8'), {
    kind: 'ico',
    r: 0.25,
    pos: [cx + 2, H + 7.1, cz - 3],
    color: '#ff2a2a',
    mat: 'emit',
  })
}

function offices(p: Part[]) {
  tower(p, OFFICES.emOffice, 'z', { body: '#e4e1da', glass: '#3f9c9a', accent: '#c58cff', crown: true })
  tower(p, OFFICES.anhOffice, 'x', { body: '#d3d8de', glass: '#2f5f8f', accent: '#2f80ed' })
}

// Nhà Em cho thật nổi: biển trái tim sáng hồng trên cửa, mái hiên sọc hồng trắng, cửa hồng, chậu hoa, dây đèn.
function emHouseDecor(p: Part[]) {
  const x = MARKERS.emHouse.x
  const f = ROADS_Z[1] + ROAD_HALF + SIDEWALK
  const HEART = '#ff3d7f'
  p.push(box(x - 1.1, x + 1.1, 3.3, 4.9, f - 0.1, f, '#ffe1ec'))
  p.push(
    { kind: 'ico', r: 0.42, pos: [x - 0.38, 4.2, f - 0.3], color: HEART, mat: 'emit' },
    { kind: 'ico', r: 0.42, pos: [x + 0.38, 4.2, f - 0.3], color: HEART, mat: 'emit' },
    { kind: 'box', size: [0.66, 0.66, 0.3], pos: [x, 3.86, f - 0.3], rot: [0, 0, Math.PI / 4], color: HEART, mat: 'emit' },
  )
  // Biển trái tim gắn vuông góc mặt tiền (kiểu biển quán), nhìn dọc phố từ xa vẫn thấy.
  p.push(box(x - 0.05, x + 0.05, 5.55, 5.65, f - 1.7, f, '#3a3a3a'))
  p.push(
    { kind: 'ico', r: 0.42, pos: [x, 5.05, f - 1.6], color: HEART, mat: 'emit' },
    { kind: 'ico', r: 0.42, pos: [x, 5.05, f - 0.84], color: HEART, mat: 'emit' },
    { kind: 'box', size: [0.3, 0.66, 0.66], pos: [x, 4.69, f - 1.22], rot: [Math.PI / 4, 0, 0], color: HEART, mat: 'emit' },
  )
  for (let i = 0; i < 6; i++) {
    const x0 = x - 1.8 + i * 0.6
    p.push(box(x0, x0 + 0.6, 2.72, 2.86, f - 1.5, f, i % 2 ? '#ffffff' : '#ff8fb5'))
  }
  p.push(box(x - 0.6, x + 0.6, 0.12, 2.45, f - 0.09, f, '#c95b86'), box(x - 0.42, x + 0.42, 1.1, 2.25, f - 0.11, f - 0.09, '#a8d8f0', 'metal'))
  for (const px of [x - 1.75, x + 1.75]) {
    p.push(cyl(px, 0.12, 0.62, f - 0.45, 0.32, 0.24, '#b5651d', 10), ico(px, 0.95, f - 0.45, 0.42, '#2f8f4e'))
    for (const [dx, dy] of [[-0.18, 1.2], [0.2, 1.1], [0, 1.32]]) p.push(ico(px + dx, dy, f - 0.62, 0.11, '#ff6fa3'))
  }
  for (let i = 0; i <= 10; i++) {
    const lx = x - 2 + i * 0.4
    const sag = Math.sin((i / 10) * Math.PI) * 0.18
    p.push({ kind: 'ico', r: 0.07, pos: [lx, 3.12 - sag, f - 0.2], color: '#ffe9a8', mat: 'emit' })
  }
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

// Ổ gà: vành nhựa sáng + lòng tối, đủ rõ để kịp lách.
function potholes(p: Part[]) {
  for (const h of POTHOLES) {
    p.push(
      { kind: 'cyl', rTop: 1.05, rBottom: 1.05, h: 0.012, seg: 9, pos: [h.x, 0.03, h.z], color: '#6b6c70' },
      { kind: 'cyl', rTop: 0.85, rBottom: 0.85, h: 0.012, seg: 9, pos: [h.x, 0.04, h.z], rot: [0, 0.4, 0], color: '#141516' },
    )
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
  // Hàng xôi trên vỉa hè cạnh toà nhà của Em.
  const x = OFFICES.emOffice.maxX + 2.5
  const z = ROADS_Z[2] + ROAD_HALF + 1.6
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
  emHouseDecor(p)
  powerLines(p, rnd)
  trees(p)
  roadworks(p)
  potholes(p)
  lightPoles(p)
  streetLife(p)
  outerRows(p, rnd)
  return p
}
