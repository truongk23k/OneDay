// App Camera: camera ảo đặt ở đâu, nhìn về đâu. Camera sau = mắt Anh nhìn ra trước (kéo để ngắm);
// camera trước = điện thoại đưa ra trước mặt, quay lại chụp Anh (trên xe thì lùi xa hơn để có cả Em).
export type Lens = 'back' | 'front'
export type Subject = { x: number; z: number; facing: number; head: number; pair?: boolean }
export type Aim = { yaw: number; pitch: number }
type V3 = [number, number, number]

export const AIM_YAW = 1.2
export const AIM_PITCH = 0.6

export function lensPose(lens: Lens, s: Subject, aim: Aim): { pos: V3; look: V3; fov: number } {
  const fx = -Math.sin(s.facing)
  const fz = -Math.cos(s.facing)
  if (lens === 'back') {
    const yaw = s.facing + aim.yaw
    const dx = -Math.sin(yaw) * Math.cos(aim.pitch)
    const dz = -Math.cos(yaw) * Math.cos(aim.pitch)
    const pos: V3 = [s.x + fx * 0.45, s.head, s.z + fz * 0.45]
    return { pos, look: [pos[0] + dx * 10, pos[1] + Math.sin(aim.pitch) * 10, pos[2] + dz * 10], fov: 62 }
  }
  // Selfie: tay cầm máy chếch sang phải, cao hơn đầu một chút; kéo để xoay quanh.
  const reach = s.pair ? 1.25 : 0.8
  const yaw = s.facing + aim.yaw * 0.5
  const ax = -Math.sin(yaw)
  const az = -Math.cos(yaw)
  const back = s.pair ? 0.2 : 0
  const cx = s.x - fx * back
  const cz = s.z - fz * back
  const pos: V3 = [cx + ax * reach + -az * 0.12, s.head + 0.12 + aim.pitch * 0.4, cz + az * reach + ax * 0.12]
  return { pos, look: [cx, s.head - (s.pair ? 0.12 : 0.03), cz], fov: s.pair ? 72 : 64 }
}
