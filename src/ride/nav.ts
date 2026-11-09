import { ALLEY, BARRIERS, ROADS_X, ROADS_Z } from './city'

// Chỉ đường trên lưới phố: các đoạn đường (đã trừ chỗ đang sửa) + hẻm tắt, tìm đường ngắn nhất.
export type Pt = { x: number; z: number }
export type Route = { points: Pt[]; length: number }
type Seg = [Pt, Pt]

const key = (p: Pt) => `${p.x},${p.z}`
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.z - b.z)
const ALLEY_ENDS = [ROADS_Z[0], ROADS_Z[1]]

function buildSegments(): Seg[] {
  const segs: Seg[] = []
  for (const z of ROADS_Z) {
    const xs = [...ROADS_X, ...(ALLEY_ENDS.includes(z) ? [ALLEY.x] : [])].sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i++) segs.push([{ x: xs[i], z }, { x: xs[i + 1], z }])
  }
  for (const x of ROADS_X) {
    for (let i = 0; i + 1 < ROADS_Z.length; i++) {
      const top = ROADS_Z[i]
      const bottom = ROADS_Z[i + 1]
      const block = BARRIERS.find((b) => x >= b.minX && x <= b.maxX && b.maxZ <= top && b.minZ >= bottom)
      // Đoạn có rào sửa đường: chỉ còn hai khúc cụt hai đầu.
      if (block) segs.push([{ x, z: top }, { x, z: block.maxZ }], [{ x, z: block.minZ }, { x, z: bottom }])
      else segs.push([{ x, z: top }, { x, z: bottom }])
    }
  }
  segs.push([{ x: ALLEY.x, z: ALLEY_ENDS[0] }, { x: ALLEY.x, z: ALLEY_ENDS[1] }])
  return segs
}

export const ROAD_SEGMENTS = buildSegments()
const isAlley = ([a, b]: Seg) => a.x === ALLEY.x && b.x === ALLEY.x
// Ô tô (xe CSGT) không vào được hẻm.
const CAR_SEGMENTS = ROAD_SEGMENTS.filter((s) => !isAlley(s))

// Điểm gần nhất trên mạng đường.
function snap(p: Pt, segs = ROAD_SEGMENTS): { seg: Seg; q: Pt } {
  let best = { seg: segs[0], q: segs[0][0], d: Infinity }
  for (const seg of segs) {
    const [a, b] = seg
    const len2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / len2))
    const q = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
    const d = dist(p, q)
    if (d < best.d) best = { seg, q, d }
  }
  return best
}

export const snapToRoad = (p: Pt, opts: { alley?: boolean } = {}): Pt => snap(p, opts.alley === false ? CAR_SEGMENTS : ROAD_SEGMENTS).q

// Bỏ các điểm nằm thẳng hàng: chỉ giữ chỗ phải rẽ.
function corners(pts: Pt[]): Pt[] {
  const out: Pt[] = []
  for (const p of pts) {
    if (out.length && dist(out[out.length - 1], p) < 0.01) continue
    if (out.length >= 2) {
      const a = out[out.length - 2]
      const b = out[out.length - 1]
      if (Math.abs((b.x - a.x) * (p.z - b.z) - (b.z - a.z) * (p.x - b.x)) < 1e-6) out.pop()
    }
    out.push(p)
  }
  return out
}

// alley: false = đường cho ô tô, không đi qua hẻm.
export function routeTo(from: Pt, to: Pt, opts: { alley?: boolean } = {}): Route {
  const segs = opts.alley === false ? CAR_SEGMENTS : ROAD_SEGMENTS
  const adj = new Map<string, { pt: Pt; next: { k: string; w: number }[] }>()
  const node = (p: Pt) => {
    const k = key(p)
    if (!adj.has(k)) adj.set(k, { pt: p, next: [] })
    return k
  }
  const link = (a: Pt, b: Pt) => {
    const w = dist(a, b)
    adj.get(node(a))!.next.push({ k: node(b), w })
    adj.get(node(b))!.next.push({ k: node(a), w })
  }
  for (const [a, b] of segs) link(a, b)

  const s = snap(from, segs)
  const e = snap(to, segs)
  const S = 'start'
  const E = 'end'
  adj.set(S, { pt: s.q, next: [] })
  adj.set(E, { pt: e.q, next: [] })
  for (const p of s.seg) adj.get(S)!.next.push({ k: node(p), w: dist(s.q, p) })
  for (const p of e.seg) adj.get(node(p))!.next.push({ k: E, w: dist(e.q, p) })
  if (s.seg === e.seg) adj.get(S)!.next.push({ k: E, w: dist(s.q, e.q) })

  // Dijkstra trên vài chục nút: duyệt mảng là đủ.
  const best = new Map<string, number>([[S, 0]])
  const prev = new Map<string, string>()
  const done = new Set<string>()
  for (;;) {
    let cur: string | null = null
    for (const [k, d] of best) if (!done.has(k) && (cur === null || d < best.get(cur)!)) cur = k
    if (cur === null || cur === E) break
    done.add(cur)
    for (const { k, w } of adj.get(cur)!.next) {
      const d = best.get(cur)! + w
      if (d < (best.get(k) ?? Infinity)) {
        best.set(k, d)
        prev.set(k, cur)
      }
    }
  }
  if (!best.has(E)) return { points: [from, to], length: dist(from, to) }

  const chain: Pt[] = []
  for (let k: string | undefined = E; k; k = prev.get(k)) chain.unshift(adj.get(k)!.pt)
  const points = corners([{ x: from.x, z: from.z }, ...chain, { x: to.x, z: to.z }])
  const length = points.reduce((sum, p, i) => (i ? sum + dist(points[i - 1], p) : 0), 0)
  return { points, length }
}

const TURN_AHEAD = 6

// Điểm mũi tên nên chỉ tới: góc rẽ kế tiếp, hoặc góc sau đó khi đã sát góc này.
export function nextTurn(r: Route): Pt {
  const from = r.points[0]
  return r.points.slice(1).find((p) => dist(from, p) > TURN_AHEAD) ?? r.points[r.points.length - 1]
}
