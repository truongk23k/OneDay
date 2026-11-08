import type { Box } from '../room/layout'

// Khu phố nhỏ tự nghĩ ra (mét). Đường ngang ở z = 0, -100, -200; đường dọc ở x = 0, 120, 240, 360.
// Nam (z dương) là phía nhà trọ; bắc (z âm) là phía công ty.
export const ROAD_HALF = 4
export const SIDEWALK = 3
export const ROADS_Z = [0, -100, -200]
export const ROADS_X = [0, 120, 240, 360]
const EDGE = ROAD_HALF + SIDEWALK

export type Marker = { x: number; z: number; heading?: number }

// Điểm dừng nằm sát mép đường, ngay trước cửa toà nhà (cách tim đường 2.5 m về phía nhà).
const KERB = ROAD_HALF - 1.5
export const MARKERS = {
  home: { x: 60, z: 0, heading: -Math.PI / 2 },
  emHouse: { x: 300, z: -100 + KERB },
  emOffice: { x: 80, z: -200 + KERB },
  anhOffice: { x: 0 + KERB, z: -150 },
} satisfies Record<string, Marker>

// Hai toà văn phòng cao tầng, mặt tiền sát vỉa hè: chỗ làm của Em quay ra đường z = -200,
// công ty Anh quay ra đường x = 0.
export const OFFICES = {
  emOffice: { minX: 66, maxX: 94, minZ: -200 + EDGE, maxZ: -200 + EDGE + 18, height: 32 },
  anhOffice: { minX: 0 + EDGE, maxX: EDGE + 20, minZ: -164, maxZ: -136, height: 46 },
}

// Nhà Em cao cố định 3 tầng để biểu tượng đặt vừa trên nóc.
export const EM_HOUSE_HEIGHT = 10.2

// Biểu tượng lơ lửng: ở xa thì trên nóc (far), lại gần thì hạ xuống ngay trên cửa (near).
export const BEACONS = {
  emHouse: { far: { x: 300, z: -100 + EDGE + 4, y: EM_HOUSE_HEIGHT + 3.5 }, near: { x: 300, z: -100 + EDGE - 1.6, y: 6.6 } },
  emOffice: {
    far: { x: 80, z: OFFICES.emOffice.minZ + 9, y: OFFICES.emOffice.height + 4 },
    near: { x: 80, z: OFFICES.emOffice.minZ - 1.4, y: 7.5 },
  },
  anhOffice: {
    far: { x: OFFICES.anhOffice.minX + 10, z: -150, y: OFFICES.anhOffice.height + 4 },
    near: { x: OFFICES.anhOffice.minX - 1.4, z: -150, y: 7.5 },
  },
}

// Hai đoạn đường đang sửa chắn các lối đi thẳng tới nhà Em, nên hẻm tắt mới đáng đi.
export const BARRIERS: Box[] = [
  { id: 'roadworks-240', minX: 240 - EDGE, maxX: 240 + EDGE, minZ: -70, maxZ: -30, height: 1.2 },
  { id: 'roadworks-120', minX: 120 - EDGE, maxX: 120 + EDGE, minZ: -70, maxZ: -30, height: 1.2 },
]
export const BARRIER = BARRIERS[0]

// Hẻm tắt xuyên khối nhà giữa (x 120–240, z 0 → -100).
export const ALLEY = { x: 200, half: 1.6 }

export const POTHOLES: Marker[] = [
  { x: 150, z: 0.8 },
  { x: 200, z: -60 },
  { x: 270, z: -100.8 },
  { x: 180, z: -99.2 },
  { x: 60, z: -200.8 },
  { x: 0.8, z: -175 },
]

export const LIGHTS: Marker[] = [
  { x: 120, z: 0 },
  { x: 240, z: -100 },
  { x: 120, z: -100 },
  { x: 120, z: -200 },
]

const box = (id: string, minX: number, maxX: number, minZ: number, maxZ: number, height = 12): Box => ({ id, minX, maxX, minZ, maxZ, height })

// Khối nhà (ống) giữa các con đường; khối giữa hàng dưới có hẻm tắt chạy dọc.
export function blockBoxes(opts: { closeAlley?: boolean } = {}): Box[] {
  const out: Box[] = []
  for (let c = 0; c < ROADS_X.length - 1; c++) {
    for (let r = 0; r < ROADS_Z.length - 1; r++) {
      const minX = ROADS_X[c] + EDGE
      const maxX = ROADS_X[c + 1] - EDGE
      const maxZ = ROADS_Z[r] - EDGE
      const minZ = ROADS_Z[r + 1] + EDGE
      const id = `block-${c}-${r}`
      if (c === 1 && r === 0 && !opts.closeAlley) {
        out.push(box(`${id}-w`, minX, ALLEY.x - ALLEY.half, minZ, maxZ), box(`${id}-e`, ALLEY.x + ALLEY.half, maxX, minZ, maxZ))
      } else out.push(box(id, minX, maxX, minZ, maxZ))
    }
  }
  return out
}

export function cityBounds() {
  return {
    minX: ROADS_X[0] - EDGE,
    maxX: ROADS_X[ROADS_X.length - 1] + EDGE,
    minZ: ROADS_Z[ROADS_Z.length - 1] - EDGE,
    maxZ: ROADS_Z[0] + EDGE,
  }
}

// Nhà bao quanh rìa khu phố để xe không chạy ra ngoài bản đồ.
function boundaryBoxes(): Box[] {
  const b = cityBounds()
  const t = 20
  return [
    box('edge-w', b.minX - t, b.minX, b.minZ - t, b.maxZ + t),
    box('edge-e', b.maxX, b.maxX + t, b.minZ - t, b.maxZ + t),
    box('edge-n', b.minX - t, b.maxX + t, b.minZ - t, b.minZ),
    box('edge-s', b.minX - t, b.maxX + t, b.maxZ, b.maxZ + t),
  ]
}

export function streetColliders(opts: { closeAlley?: boolean } = {}): Box[] {
  return [...blockBoxes(opts), ...BARRIERS, ...boundaryBoxes()]
}

export const STREET_COLLIDERS = streetColliders()

// Độ dài đường đi ngắn nhất (lưới 1 m, xe bán kính 0.45 m) — dùng để kiểm tra bản đồ.
export function routeLength(a: Marker, b: Marker, opts: { closeAlley?: boolean } = {}): number {
  const colliders = streetColliders(opts)
  const bounds = cityBounds()
  const step = 1
  const nx = Math.ceil((bounds.maxX - bounds.minX) / step)
  const nz = Math.ceil((bounds.maxZ - bounds.minZ) / step)
  const free = (x: number, z: number) =>
    colliders.every((c) => Math.hypot(Math.max(c.minX - x, 0, x - c.maxX), Math.max(c.minZ - z, 0, z - c.maxZ)) >= 0.45)
  const idx = (i: number, j: number) => j * nx + i
  const cell = (m: Marker) => [Math.round((m.x - bounds.minX) / step), Math.round((m.z - bounds.minZ) / step)]
  const dist = new Int32Array(nx * nz).fill(-1)
  const [si, sj] = cell(a)
  const [ti, tj] = cell(b)
  dist[idx(si, sj)] = 0
  const queue = [si, sj]
  for (let q = 0; q < queue.length; q += 2) {
    const i = queue[q]
    const j = queue[q + 1]
    if (i === ti && j === tj) return dist[idx(i, j)] * step
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di
      const nj = j + dj
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || dist[idx(ni, nj)] >= 0) continue
      if (!free(bounds.minX + ni * step, bounds.minZ + nj * step)) continue
      dist[idx(ni, nj)] = dist[idx(i, j)] + 1
      queue.push(ni, nj)
    }
  }
  return Infinity
}
