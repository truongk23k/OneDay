import { Html } from '@react-three/drei'
import type { CSSProperties } from 'react'
import { FURNITURE, ROOM, WALLS, type Box } from './layout'

const COLORS: Record<string, string> = {
  wall: '#e6e2da',
  furniture: '#8f949c',
  door: '#7a3b22',
  bed: '#b98a5a',
  mirror: '#e48fb0',
  fridge: '#b9bdc2',
  fridge2: '#b9bdc2',
}

function BoxMesh({ b, color }: { b: Box; color: string }) {
  const w = b.maxX - b.minX
  const d = b.maxZ - b.minZ
  return (
    <mesh position={[(b.minX + b.maxX) / 2, b.height / 2, (b.minZ + b.maxZ) / 2]}>
      <boxGeometry args={[w, b.height, d]} />
      <meshStandardMaterial color={color} />
    </mesh>
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
        <BoxMesh key={w.id} b={w} color={COLORS.wall} />
      ))}
      {FURNITURE.map((f) => (
        <BoxMesh key={f.id} b={f} color={COLORS[f.id] ?? COLORS.furniture} />
      ))}

      {/* Trang trí, không va chạm: cửa sổ + điều hòa tường tây, 2 mũ bảo hiểm trên cửa */}
      <mesh position={[0.02, 1.6, 2.4]}>
        <boxGeometry args={[0.04, 1.2, 1.0]} />
        <meshStandardMaterial color="#a9d3ee" />
      </mesh>
      <mesh position={[0.13, 2.6, 2.5]}>
        <boxGeometry args={[0.25, 0.3, 0.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[1.75, 2.15].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.08]} rotation-x={-Math.PI / 2}>
          <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}

      {FURNITURE.filter((f) => f.label).map((f) => (
        <Html
          key={f.id}
          center
          position={[(f.minX + f.maxX) / 2, Math.min(f.height + 0.3, ROOM.height - 0.2), (f.minZ + f.maxZ) / 2]}
        >
          <div style={labelStyle}>{f.label}</div>
        </Html>
      ))}
    </group>
  )
}
