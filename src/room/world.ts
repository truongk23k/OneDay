import { create } from 'zustand'
import { BATH_DOOR, type Box } from './layout'

export type Tap = 'lavabo' | 'sink' | 'shower'

type World = {
  bathDoorOpen: boolean
  water: Record<Tap, boolean>
  lightsOn: boolean
  toggleDoor: () => void
  toggleWater: (tap: Tap) => void
  toggleLights: () => void
}

// Trạng thái đồ vật dùng được trong phòng (cửa, vòi nước, đèn) — không thuộc nhiệm vụ.
export const useWorld = create<World>()((set) => ({
  bathDoorOpen: true,
  water: { lavabo: false, sink: false, shower: false },
  lightsOn: true,
  toggleDoor: () => set((w) => ({ bathDoorOpen: !w.bathDoorOpen })),
  toggleWater: (tap) => set((w) => ({ water: { ...w.water, [tap]: !w.water[tap] } })),
  toggleLights: () => set((w) => ({ lightsOn: !w.lightsOn })),
}))

const CLOSED_DOOR: Box = { id: 'bathDoorClosed', minX: 2.95, maxX: 3.05, minZ: BATH_DOOR.min, maxZ: BATH_DOOR.max, height: BATH_DOOR.maxY }

// Vật cản thay đổi theo trạng thái (cửa nhà vệ sinh đóng thì chắn lối).
export function dynamicColliders(): Box[] {
  return useWorld.getState().bathDoorOpen ? [] : [CLOSED_DOOR]
}
