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
