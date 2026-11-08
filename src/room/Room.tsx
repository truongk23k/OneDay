import { Html } from '@react-three/drei'
import type { CSSProperties } from 'react'
import { FURNITURE, HELMETS, ROOM, WALLS, WINDOW, type Box } from './layout'
import { splitWall, type Block, type Opening } from './openings'

const COLORS: Record<string, string> = {
  wall: '#e6e2da',
  furniture: '#8f949c',
  door: '#7a3b22',
  bed: '#b98a5a',
  mirror: '#e48fb0',
  fridge: '#b9bdc2',
  fridge2: '#b9bdc2',
  chairMine: '#2b2b2e',
  chairFriend: '#3a3a3e',
}

const WHITE = '#f7f7f5'
const OPENINGS: Opening[] = [WINDOW]

function Block3({ b, color }: { b: Block; color: string }) {
  return (
    <mesh position={[(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2]}>
      <boxGeometry args={[b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

const toBlock = (b: Box): Block => ({ minX: b.minX, maxX: b.maxX, minY: 0, maxY: b.height, minZ: b.minZ, maxZ: b.maxZ })

function Wall({ w }: { w: Box }) {
  const hole = OPENINGS.find((o) => o.wall === w.id)
  const blocks = hole ? splitWall(w, hole) : [toBlock(w)]
  return (
    <>
      {blocks.map((b, i) => (
        <Block3 key={i} b={b} color={COLORS.wall} />
      ))}
    </>
  )
}

// Cửa sổ tường tây: song sắt trắng phía trong, hai cánh kính lùa khung trắng; bên ngoài sáng trắng.
function Window() {
  const { min, max, minY, maxY } = WINDOW
  const x0 = -0.1
  const x1 = 0.02
  const t = 0.05
  const bar = 0.02
  const bars: Block[] = [
    { minX: x0, maxX: x1, minY, maxY: minY + t, minZ: min, maxZ: max },
    { minX: x0, maxX: x1, minY: maxY - t, maxY, minZ: min, maxZ: max },
    { minX: x0, maxX: x1, minY, maxY, minZ: min, maxZ: min + t },
    { minX: x0, maxX: x1, minY, maxY, minZ: max - t, maxZ: max },
  ]
  for (let z = min + 0.16; z < max - 0.1; z += 0.16) {
    bars.push({ minX: x0 + 0.02, maxX: x1, minY, maxY, minZ: z - bar / 2, maxZ: z + bar / 2 })
  }
  for (let y = minY + 0.22; y < maxY - 0.1; y += 0.22) {
    bars.push({ minX: x0 + 0.02, maxX: x1, minY: y - bar / 2, maxY: y + bar / 2, minZ: min, maxZ: max })
  }
  const midZ = (min + max) / 2
  // Hai cánh lùa chồng lên nhau 5 cm ở giữa, mỗi cánh nằm trên một ray khác nhau.
  const sashes = [
    { x: -0.085, z0: min + t, z1: midZ + 0.025 },
    { x: -0.055, z0: midZ - 0.025, z1: max - t },
  ]
  const f = 0.045
  for (const s of sashes) {
    const sx0 = s.x - 0.012
    const sx1 = s.x + 0.012
    bars.push(
      { minX: sx0, maxX: sx1, minY: minY + t, maxY: minY + t + f, minZ: s.z0, maxZ: s.z1 },
      { minX: sx0, maxX: sx1, minY: maxY - t - f, maxY: maxY - t, minZ: s.z0, maxZ: s.z1 },
      { minX: sx0, maxX: sx1, minY: minY + t, maxY: maxY - t, minZ: s.z0, maxZ: s.z0 + f },
      { minX: sx0, maxX: sx1, minY: minY + t, maxY: maxY - t, minZ: s.z1 - f, maxZ: s.z1 },
    )
  }
  return (
    <group>
      {bars.map((b, i) => (
        <Block3 key={i} b={b} color={WHITE} />
      ))}
      {sashes.map((s) => (
        <mesh key={s.x} position={[s.x, (minY + maxY) / 2, (s.z0 + s.z1) / 2]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[s.z1 - s.z0 - 2 * f, maxY - minY - 2 * t - 2 * f]} />
          <meshStandardMaterial color="#e8f4ff" transparent opacity={0.18} />
        </mesh>
      ))}
      {/* Điều hòa ngay trên cửa sổ */}
      <Block3 b={{ minX: 0, maxX: 0.24, minY: 2.45, maxY: 2.75, minZ: midZ - 0.4, maxZ: midZ + 0.4 }} color="#ffffff" />
      {/* Bên ngoài: ánh sáng ban ngày trắng xóa như trong ảnh */}
      <mesh position={[-1.5, 2, midZ]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

const labelStyle: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 10,
  background: 'rgba(20, 22, 28, 0.75)',
  color: '#fff',
  fontSize: 12,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
}

export function Room() {
  const cx = ROOM.width / 2
  const cz = ROOM.depth / 2
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0, cz]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#d9d9d4" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[cx, ROOM.height, cz]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#f4f2ee" />
      </mesh>

      {WALLS.map((w) => (
        <Wall key={w.id} w={w} />
      ))}
      {FURNITURE.map((f) => (
        <Block3 key={f.id} b={toBlock(f)} color={COLORS[f.id] ?? COLORS.furniture} />
      ))}
      <Window />

      {/* 2 mũ bảo hiểm treo trên cửa */}
      {HELMETS.map((h) => (
        <mesh key={h.x} position={[h.x, h.y, h.z]} rotation-x={-Math.PI / 2}>
          <sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}

      {FURNITURE.filter((f) => f.label).map((f) => (
        <Html
          key={f.id}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
          position={[(f.minX + f.maxX) / 2, Math.min(f.height + 0.3, ROOM.height - 0.2), (f.minZ + f.maxZ) / 2]}
        >
          <div style={labelStyle}>{f.label}</div>
        </Html>
      ))}
    </group>
  )
}
