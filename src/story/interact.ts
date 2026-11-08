import { S } from '../strings'
import type { Tap } from '../room/world'
import { KEY_SPOTS, type Action, type StoryState } from './state'

export type Target = { id: string; x: number; z: number }
// Hành động với đồ vật (không phải nhiệm vụ): cửa, vòi nước, đèn.
export type WorldAction = { type: 'world'; do: 'door' | 'lights' | 'fridge' | 'sit' | 'stand' | 'stove' | Tap }
export type Option = { label: string; action: Action | WorldAction }
export type WorldView = {
  bathDoorOpen: boolean
  water: Record<Tap, boolean>
  lightsOn: boolean
  fridgeOpen?: boolean
  sitting?: boolean
  stoveOn?: boolean
}

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
  { id: 'bathDoorIn', x: 3.3, z: 0.73 },
  { id: 'shower', x: 3.75, z: 1.12 },
  { id: 'toilet', x: 5.15, z: 1.05 },
  { id: 'lightSwitch', x: 2.62, z: 1.42 },
  { id: 'pullupBar', x: 2.45, z: 1.72 },
  { id: 'mirror', x: 5.15, z: 3.95 },
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
  if (id === 'kitchen') {
    o.push({ label: S.options.cook, action: { type: 'cook' } })
    o.push({ label: w.stoveOn ? S.options.stoveOff : S.options.stoveOn, action: { type: 'world', do: 'stove' } })
    o.push(tap('sink', w))
  }
  if (id === 'fridge') {
    if (w.fridgeOpen) {
      o.push({ label: S.options.drink, action: { type: 'drink' } })
      o.push({ label: S.options.fridgeClose, action: { type: 'world', do: 'fridge' } })
    } else o.push({ label: S.options.fridgeOpen, action: { type: 'world', do: 'fridge' } })
  }
  if (id === 'deskMine') {
    // Đang ngồi thì chỉ còn việc trên máy tính và đứng dậy.
    if (w.sitting) {
      return [
        { label: S.options.browse, action: { type: 'browse' } },
        { label: S.options.mail, action: { type: 'mail' } },
        { label: S.options.stand, action: { type: 'world', do: 'stand' } },
      ]
    }
    o.push({ label: S.options.sit, action: { type: 'world', do: 'sit' } })
  }
  if (id === 'shower') {
    o.push({ label: S.options.bathe, action: { type: 'bathe' } })
    o.push(tap('shower', w))
  }
  if (id === 'pullupBar') o.push({ label: S.options.pullup, action: { type: 'pullup' } })
  if (id === 'mirror') o.push({ label: S.options.flex, action: { type: 'flex' } })
  if (id === 'bed') o.push({ label: S.options.nap, action: { type: 'nap' } })
  if (id === 'toilet') {
    o.push({ label: S.options.pee, action: { type: 'pee' } })
    o.push({ label: S.options.poop, action: { type: 'poop' } })
  }
  if (id === 'bathDoor' || id === 'bathDoorIn') o.push({ label: w.bathDoorOpen ? S.options.closeDoor : S.options.openDoor, action: { type: 'world', do: 'door' } })
  if (id === 'lightSwitch') o.push({ label: w.lightsOn ? S.options.lightsOff : S.options.lightsOn, action: { type: 'world', do: 'lights' } })
  if (id === 'wardrobe') o.push({ label: S.options.wardrobe, action: { type: 'open', overlay: 'wardrobe' } })
  if (id === 'door') {
    if (s.tasks.helmets < 2) o.push({ label: S.options.helmets2, action: { type: 'takeHelmets', n: 2 } })
    if (s.tasks.helmets === 0) o.push({ label: S.options.helmets1, action: { type: 'takeHelmets', n: 1 } })
    o.push({ label: S.options.leave, action: { type: 'leave' } })
  }
  if (isKeySpot(id) && !s.tasks.keys && !s.searched.includes(id)) {
    o.push({ label: S.options.search, action: { type: 'search', id } })
  }
  return o
}
