import { create } from 'zustand'
import { BATH_DOOR, type Box } from './layout'

const PLAYER_RADIUS = 0.25

export type Tap = 'lavabo' | 'sink' | 'shower'

type World = {
  bathDoorOpen: boolean
  water: Record<Tap, boolean>
  lightsOn: boolean
  // Trả về false nếu không đóng được vì Anh đang đứng giữa khe cửa.
  toggleDoor: (player?: { x: number; z: number }) => boolean
  toggleWater: (tap: Tap) => void
  toggleLights: () => void
  reset: () => void
}

export const CLOSED_DOOR: Box = { id: 'bathDoorClosed', minX: 2.95, maxX: 3.05, minZ: BATH_DOOR.min, maxZ: BATH_DOOR.max, height: BATH_DOOR.maxY }

const MORNING = { bathDoorOpen: true, water: { lavabo: false, sink: false, shower: false }, lightsOn: true }

// Trạng thái đồ vật dùng được trong phòng (cửa, vòi nước, đèn) — không thuộc nhiệm vụ.
export const useWorld = create<World>()((set, get) => ({
  ...MORNING,
  toggleDoor: (player) => {
    const closing = get().bathDoorOpen
    if (closing && player && circleHitsBox(player, CLOSED_DOOR)) return false
    set({ bathDoorOpen: !closing })
    return true
  },
  toggleWater: (tap) => set((w) => ({ water: { ...w.water, [tap]: !w.water[tap] } })),
  toggleLights: () => set((w) => ({ lightsOn: !w.lightsOn })),
  reset: () => set({ ...MORNING, water: { ...MORNING.water } }),
}))

function circleHitsBox(p: { x: number; z: number }, b: Box) {
  const dx = p.x - Math.min(b.maxX, Math.max(b.minX, p.x))
  const dz = p.z - Math.min(b.maxZ, Math.max(b.minZ, p.z))
  return Math.hypot(dx, dz) < PLAYER_RADIUS
}


// Vật cản thay đổi theo trạng thái (cửa nhà vệ sinh đóng thì chắn lối).
export function dynamicColliders(): Box[] {
  return useWorld.getState().bathDoorOpen ? [] : [CLOSED_DOOR]
}
