import { S } from '../strings'
import type { Tap } from '../room/world'
import { KEY_SPOTS, type Action, type StoryState } from './state'

export type Target = { id: string; x: number; z: number }
// Hành động với đồ vật (không phải nhiệm vụ): cửa, vòi nước, đèn.
export type WorldAction = { type: 'world'; do: 'door' | 'lights' | Tap }
export type Option = { label: string; action: Action | WorldAction }
export type WorldView = { bathDoorOpen: boolean; water: Record<Tap, boolean>; lightsOn: boolean }

const DEFAULT_WORLD: WorldView = { bathDoorOpen: true, water: { lavabo: false, sink: false, shower: false }, lightsOn: true }

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
  { id: 'bathDoor', x: 2.62, z: 0.73 },
  { id: 'shower', x: 3.75, z: 1.12 },
  { id: 'toilet', x: 5.15, z: 1.05 },
  { id: 'lightSwitch', x: 2.62, z: 1.42 },
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

const tap = (t: Tap, w: WorldView): Option => ({
  label: w.water[t] ? (t === 'shower' ? S.options.showerOff : S.options.tapOff) : t === 'shower' ? S.options.showerOn : S.options.tapOn,
  action: { type: 'world', do: t },
})

export function actionsFor(id: string, s: Pick<StoryState, 'tasks' | 'searched'>, w: WorldView = DEFAULT_WORLD): Option[] {
  const o: Option[] = []
  if (id === 'lavabo') {
    if (!s.tasks.brushed) o.push({ label: S.options.brush, action: { type: 'open', overlay: 'brush' } })
    if (!s.tasks.washed) o.push({ label: S.options.wash, action: { type: 'open', overlay: 'wash' } })
    o.push(tap('lavabo', w))
  }
  if (id === 'kitchen') o.push(tap('sink', w))
  if (id === 'shower') o.push(tap('shower', w))
  if (id === 'toilet') o.push({ label: S.options.toilet, action: { type: 'toilet' } })
  if (id === 'bathDoor') o.push({ label: w.bathDoorOpen ? S.options.closeDoor : S.options.openDoor, action: { type: 'world', do: 'door' } })
  if (id === 'lightSwitch') o.push({ label: w.lightsOn ? S.options.lightsOff : S.options.lightsOn, action: { type: 'world', do: 'lights' } })
  if (id === 'wardrobe') o.push({ label: S.options.wardrobe, action: { type: 'open', overlay: 'wardrobe' } })
  if (id === 'door') o.push({ label: S.options.door, action: { type: 'open', overlay: 'door' } })
  if (isKeySpot(id) && !s.tasks.keys && !s.searched.includes(id)) {
    o.push({ label: S.options.search, action: { type: 'search', id } })
  }
  return o
}
