import { S } from '../strings'
import type { Opening } from './openings'

// Mét. Bên trong phòng: x từ 0 (tây) đến 5.6 (đông), z từ 0 (bắc, tường có cửa chính) đến 6.4 (nam).
export type Box = { id: string; minX: number; maxX: number; minZ: number; maxZ: number; height: number }
export type Vec2 = { x: number; z: number }
export type Furniture = Box & { label: string }

export const ROOM = { width: 5.6, depth: 6.4, height: 3.0 }

// Nhân vật cao ngang tủ lạnh.
export const CHARACTER_HEIGHT = 1.22

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
  // Ngăn bếp với bàn bạn cùng phòng: tường thấp, phía trên hở hết, đầu tường là cột sát lối đi.
  box('kitchenWall', 0, 1.75, 1.7, 1.8, 1.4),
  box('kitchenPillar', 1.75, 1.95, 1.65, 1.85, 3.0),
  // Nhà vệ sinh sát cạnh cửa chính, kéo tới tường đông; cửa vào nằm trong lối đi.
  box('bathWallW1', 2.95, 3.05, 0, 0.325, 3.0),
  box('bathWallW2', 2.95, 3.05, 1.125, 1.7, 3.0),
  box('bathWallS', 3.05, 5.6, 1.45, 1.55, 3.0),
]

// Ô khoét chỉ để vẽ; va chạm vẫn dùng nguyên tường.
export const WINDOW: Opening = { wall: 'wallW', axis: 'z', min: 3.5, max: 4.3, minY: 1.35, maxY: 2.25 }

// Cửa nhà vệ sinh (cao 2 m) và ô gác xép phía trên, cùng nằm trên tường tây của nhà vệ sinh.
export const BATH_DOOR: Opening = { wall: 'bathWallW', axis: 'z', min: 0.325, max: 1.125, minY: 0, maxY: 2.0 }
export const BATH_LOFT: Opening = { wall: 'bathWallW', axis: 'z', min: 0.1, max: 0.95, minY: 2.4, maxY: 2.95 }

// Trần nhà vệ sinh thấp (sàn gác xép để chậu, rổ).
export const BATH_CEILING = 2.35

// Xà đơn màu đen ngang miệng lối đi, từ cột bếp sang tường cạnh tủ lạnh; cao khoảng 1.65 lần người để nhảy lên đu.
export const PULLUP_BAR = { x0: 1.95, x1: 2.95, y: 1.65 * CHARACTER_HEIGHT, z: 1.675, radius: 0.02 }

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
  { ...box('shelf', 5.42, 5.6, 3.267, 3.6, 1.0), label: L.shelf },
  { ...box('mirror', 5.53, 5.6, 3.7, 4.2, 1.6), label: L.mirror },
  { ...box('bed', 3.3, 5.6, 4.2, 6.4, 0.45), label: L.bed },
  { ...box('deskFriend', 0, 0.75, 1.85, 3.6, 0.75), label: L.deskFriend },
  { ...box('chairFriend', 0.85, 1.35, 2.5, 3.0, 1.0), label: '' },
  { ...box('fridge2', 0, 0.6, 3.6, 4.15, 1.2), label: L.fridge2 },
  { ...box('wardrobe', 0, 0.6, 4.3, 6.4, 2.0), label: L.wardrobe },
]

export const COLLIDERS: Box[] = [...WALLS, ...FURNITURE]

// Khi vẽ, tường tây nhà vệ sinh là một khối liền có khoét cửa và ô gác xép (va chạm vẫn dùng 2 đoạn).
export const RENDER_WALLS: Box[] = [
  ...WALLS.filter((w) => w.id !== 'bathWallW1' && w.id !== 'bathWallW2'),
  box('bathWallW', 2.95, 3.05, 0, 1.7, 3.0),
]

// Độ cao trần tại một điểm (camera không được chui lên trần).
export function ceilingAt(x: number, z: number): number {
  const bath = WALLS.find((w) => w.id === 'bathWallS')!
  return x > 3.05 && z < bath.minZ ? BATH_CEILING : ROOM.height
}

const door = FURNITURE[0]
const doorCentre = (door.minX + door.maxX) / 2

// Hai mũ bảo hiểm treo cân hai bên giữa cánh cửa.
export const HELMETS = [-0.2, 0.2].map((dx) => ({ x: doorCentre + dx, y: 1.5, z: door.maxZ + 0.06 }))

// Anh đứng giữa bàn và giường, mặt quay về phía cửa (bắc).
export const SPAWN = { x: 4.4, z: 3.9, yaw: 0 }
