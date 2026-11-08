// Trạng thái điều khiển dùng chung giữa bàn phím, chuột, cảm ứng và Player.
// move: joystick (x phải, y tiến). look: góc xoay cộng dồn, đơn vị radian (dx > 0 nhìn sang phải, dy > 0 nhìn xuống).
export const input = {
  move: { x: 0, y: 0 },
  look: { dx: 0, dy: 0 },
}

const AXES: Record<string, [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
}

export function createKeyTracker() {
  const held = new Set<string>()
  return {
    down(code: string) {
      if (code in AXES) held.add(code)
    },
    up(code: string) {
      held.delete(code)
    },
    clear() {
      held.clear()
    },
    vector() {
      let x = 0
      let y = 0
      for (const code of held) {
        x += AXES[code][0]
        y += AXES[code][1]
      }
      return { x: Math.sign(x), y: Math.sign(y) }
    },
  }
}

export const keys = createKeyTracker()

const DEAD_ZONE = 0.12

// Độ lệch ngón tay so với tâm joystick (pixel, y màn hình hướng xuống) → vector điều khiển, dài tối đa 1.
export function joystickVector(dx: number, dy: number, radius: number) {
  let x = dx / radius
  let y = -dy / radius
  const len = Math.hypot(x, y)
  if (len < DEAD_ZONE) return { x: 0, y: 0 }
  if (len > 1) {
    x /= len
    y /= len
  }
  return { x, y }
}

export type TouchRole = 'move' | 'look'

// Mỗi ngón tay giữ vai trò từ lúc chạm: nửa trái đi lại (chỉ một ngón), còn lại xoay camera.
export function createTouchRouter() {
  const roles = new Map<number, TouchRole>()
  let moveId: number | null = null
  return {
    start(id: number, x: number, screenWidth: number): TouchRole {
      const role: TouchRole = x < screenWidth / 2 && moveId === null ? 'move' : 'look'
      if (role === 'move') moveId = id
      roles.set(id, role)
      return role
    },
    role(id: number) {
      return roles.get(id)
    },
    end(id: number) {
      if (id === moveId) moveId = null
      roles.delete(id)
    },
  }
}
