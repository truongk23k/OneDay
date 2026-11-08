import { S } from '../strings'
import type { Opening } from './openings'

// Mét. Bên trong phòng: x từ 0 (tây) đến 5.6 (đông), z từ 0 (bắc, tường có cửa chính) đến 6.4 (nam).
export type Box = { id: string; minX: number; maxX: number; minZ: number; maxZ: number; height: number }
export type Vec2 = { x: number; z: number }
export type Furniture = Box & { label: string }

export const ROOM = { width: 5.6, depth: 6.4, height: 3.0 }

const box = (id: string, minX: number, maxX: number, minZ: number, maxZ: number, height: number): Box => ({
  id,
  minX,
  maxX,
  minZ,
  maxZ,
  height,
})

export const WALLS: Box[] = [
  box('wallN', -0.1, 5.7, -0.1, 0, 3.0),
  box('wallS', -0.1, 5.7, 6.4, 6.5, 3.0),
  box('wallW', -0.1, 0, -0.1, 6.5, 3.0),
  box('wallE', 5.6, 5.7, -0.1, 6.5, 3.0),
  // Tường ngăn giữa bếp và bàn bạn cùng phòng; bếp mở ra lối đi nhỏ dẫn tới cửa chính.
  box('kitchenWall', 0, 1.95, 1.7, 1.8, 3.0),
  // Nhà vệ sinh sát cạnh cửa chính, kéo tới tường đông; cửa vào nằm trong lối đi.
  box('bathWallW1', 2.95, 3.05, 0, 0.15, 3.0),
  box('bathWallW2', 2.95, 3.05, 0.85, 1.55, 3.0),
  box('bathWallS', 3.05, 5.6, 1.45, 1.55, 3.0),
]

// Ô khoét chỉ để vẽ; va chạm vẫn dùng nguyên tường.
export const WINDOW: Opening = { wall: 'wallW', axis: 'z', min: 3.5, max: 4.3, minY: 1.35, maxY: 2.25 }
export const KITCHEN_PASS: Opening = { wall: 'kitchenWall', axis: 'x', min: 0.7, max: 1.6, minY: 1.5, maxY: 2.1 }

const L = S.labels

export const FURNITURE: Furniture[] = [
  { ...box('door', 2.0, 2.9, 0, 0.05, 2.2), label: L.door },
  // Bếp chữ L: cạnh dài dọc tường tây, cạnh ngắn (có bồn rửa) dọc tường ngăn.
  { ...box('kitchenW', 0, 0.6, 0, 1.7, 0.85), label: L.kitchen },
  { ...box('kitchenS', 0.6, 1.4, 1.1, 1.7, 0.85), label: '' },
  { ...box('lavabo', 3.5, 4.0, 0, 0.4, 0.85), label: L.lavabo },
  { ...box('toilet', 4.9, 5.4, 0.05, 0.75, 0.75), label: L.toilet },
  { ...box('fridge', 3.05, 3.6, 1.55, 2.1, 1.3), label: L.fridge },
  { ...box('deskMine', 3.6, 5.6, 1.55, 2.45, 0.75), label: L.deskMine },
  { ...box('chairMine', 4.35, 4.85, 2.55, 3.05, 1.0), label: '' },
  { ...box('shelf', 5.3, 5.6, 3.3, 3.6, 1.0), label: L.shelf },
  { ...box('mirror', 5.53, 5.6, 3.7, 4.2, 1.6), label: L.mirror },
  { ...box('bed', 3.3, 5.6, 4.2, 6.4, 0.45), label: L.bed },
  { ...box('deskFriend', 0, 0.75, 1.85, 3.6, 0.75), label: L.deskFriend },
  { ...box('chairFriend', 0.85, 1.35, 2.5, 3.0, 1.0), label: '' },
  { ...box('fridge2', 0, 0.6, 3.6, 4.15, 1.2), label: L.fridge2 },
  { ...box('wardrobe', 0, 0.6, 4.3, 6.4, 2.0), label: L.wardrobe },
]

export const COLLIDERS: Box[] = [...WALLS, ...FURNITURE]

const door = FURNITURE[0]
const doorCentre = (door.minX + door.maxX) / 2

// Hai mũ bảo hiểm treo cân hai bên giữa cánh cửa.
export const HELMETS = [-0.2, 0.2].map((dx) => ({ x: doorCentre + dx, y: 1.5, z: door.maxZ + 0.06 }))

// Anh đứng giữa bàn và giường, mặt quay về phía cửa (bắc).
export const SPAWN = { x: 4.4, z: 3.9, yaw: 0 }
