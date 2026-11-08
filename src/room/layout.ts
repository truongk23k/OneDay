import { S } from '../strings'

// Mét. Bên trong phòng: x từ 0 (tây) đến 4.2 (đông), z từ 0 (bắc, tường có cửa chính) đến 5.0 (nam).
export type Box = { id: string; minX: number; maxX: number; minZ: number; maxZ: number; height: number }
export type Vec2 = { x: number; z: number }
export type Furniture = Box & { label: string }

export const ROOM = { width: 4.2, depth: 5.0, height: 3.0 }

const box = (id: string, minX: number, maxX: number, minZ: number, maxZ: number, height: number): Box => ({
  id,
  minX,
  maxX,
  minZ,
  maxZ,
  height,
})

export const WALLS: Box[] = [
  box('wallN', -0.1, 4.3, -0.1, 0, 3.0),
  box('wallS', -0.1, 4.3, 5.0, 5.1, 3.0),
  box('wallW', -0.1, 0, -0.1, 5.1, 3.0),
  box('wallE', 4.2, 4.3, -0.1, 5.1, 3.0),
  box('bathWallW1', 2.65, 2.75, 0, 0.6, 3.0),
  box('bathWallW2', 2.65, 2.75, 1.35, 1.55, 3.0),
  box('bathWallS', 2.75, 4.2, 1.45, 1.55, 3.0),
]

const L = S.labels

export const FURNITURE: Furniture[] = [
  { ...box('door', 1.5, 2.4, 0, 0.05, 2.2), label: L.door },
  { ...box('kitchenN', 0, 1.4, 0, 0.6, 0.85), label: L.kitchen },
  { ...box('kitchenW', 0, 0.6, 0.6, 1.6, 0.85), label: '' },
  { ...box('lavabo', 2.75, 3.25, 0, 0.4, 0.85), label: L.lavabo },
  { ...box('toilet', 3.65, 4.15, 0.05, 0.75, 0.75), label: L.toilet },
  { ...box('fridge', 2.75, 3.3, 1.55, 2.1, 1.3), label: L.fridge },
  { ...box('deskMine', 3.35, 4.2, 1.55, 2.15, 0.75), label: L.deskMine },
  { ...box('shelf', 3.9, 4.2, 2.15, 2.5, 1.2), label: L.shelf },
  { ...box('mirror', 3.95, 4.2, 2.55, 2.75, 1.6), label: L.mirror },
  { ...box('bed', 2.4, 4.2, 3.0, 5.0, 0.45), label: L.bed },
  { ...box('wardrobe', 0, 0.6, 3.6, 5.0, 2.0), label: L.wardrobe },
  { ...box('fridge2', 0, 0.6, 3.0, 3.55, 1.2), label: L.fridge2 },
  { ...box('deskFriend', 0, 0.7, 1.75, 2.95, 0.75), label: L.deskFriend },
]

export const COLLIDERS: Box[] = [...WALLS, ...FURNITURE]

// Anh đứng cạnh giường, mặt quay về phía cửa (bắc).
export const SPAWN = { x: 3.0, z: 2.6, yaw: 0 }
