import { S } from '../strings'
import { KEY_SPOTS, type Action, type StoryState } from './state'

export type Target = { id: string; x: number; z: number }
export type Option = { label: string; action: Action }

// Chỗ đứng trước mỗi đồ vật có thể tương tác (mét).
export const INTERACTABLES: Target[] = [
  { id: 'lavabo', x: 3.75, z: 0.7 },
  { id: 'wardrobe', x: 0.95, z: 5.4 },
  { id: 'bed', x: 2.95, z: 5.2 },
  { id: 'fridge', x: 2.7, z: 1.95 },
  { id: 'deskMine', x: 3.9, z: 2.8 },
  { id: 'kitchen', x: 1.0, z: 0.7 },
  { id: 'shelf', x: 5.2, z: 3.45 },
  { id: 'door', x: 2.45, z: 0.4 },
]

export const REACH = 0.9

// Vị trí Anh, Player ghi vào mỗi khung hình.
export const player = { x: 0, z: 0 }

export function nearestInteractable(p: { x: number; z: number }): Target | null {
  let best: Target | null = null
  let bestD = REACH
  for (const t of INTERACTABLES) {
    const d = Math.hypot(t.x - p.x, t.z - p.z)
    if (d <= bestD) {
      best = t
      bestD = d
    }
  }
  return best
}

const isKeySpot = (id: string) => (KEY_SPOTS as readonly string[]).includes(id)

export function actionsFor(id: string, s: Pick<StoryState, 'tasks' | 'searched'>): Option[] {
  const o: Option[] = []
  if (id === 'lavabo') {
    if (!s.tasks.brushed) o.push({ label: S.options.brush, action: { type: 'open', overlay: 'brush' } })
    if (!s.tasks.washed) o.push({ label: S.options.wash, action: { type: 'open', overlay: 'wash' } })
  }
  if (id === 'wardrobe') o.push({ label: S.options.wardrobe, action: { type: 'open', overlay: 'wardrobe' } })
  if (id === 'door') o.push({ label: S.options.door, action: { type: 'open', overlay: 'door' } })
  if (isKeySpot(id) && !s.tasks.keys && !s.searched.includes(id)) {
    o.push({ label: S.options.search, action: { type: 'search', id } })
  }
  return o
}
