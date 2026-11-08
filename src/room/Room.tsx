import { Html } from '@react-three/drei'
import { useMemo, type CSSProperties } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { Batched } from './Batched'
import { BATH_CEILING, BATH_DOOR, BATH_LOFT, FURNITURE, HELMETS, PULLUP_BAR, ROOM, WINDOW } from './layout'
import type { Block, Opening } from './openings'
import { buildRoomParts } from './parts'

const COLORS = { wall: '#ebe7df' }

const WHITE = '#f7f7f5'
const OPENINGS: Opening[] = [WINDOW, BATH_DOOR, BATH_LOFT]

function Block3({ b, color }: { b: Block; color: string }) {
  return (
    <mesh position={[(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2]}>
      <boxGeometry args={[b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Gạch lát nền 60 cm màu trắng ngà, ron xám nhạt.
function useTileTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    g.fillStyle = '#e9e6df'
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = '#f3f1ec'
    g.fillRect(3, 3, 122, 122)
    g.fillStyle = '#c9c5bc'
    g.fillRect(0, 0, 128, 2)
    g.fillRect(0, 0, 2, 128)
    const t = new CanvasTexture(c)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(ROOM.width / 0.6, ROOM.depth / 0.6)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])
}

// Cửa sổ tường tây: song sắt trắng phía trong, hai cánh kính lùa khung trắng; bên ngoài sáng trắng.
function Window() {
  const { min, max, minY, maxY } = WINDOW
  const t = 0.05
  // Khung, song sắt và điều hòa nằm trong parts.ts; ở đây chỉ còn hai cánh kính lùa và khung cánh.
  const bars: Block[] = []
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
      {/* Bên ngoài: ánh sáng ban ngày trắng xóa như trong ảnh */}
      <mesh position={[-1.5, 2, midZ]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

// Cửa nhà vệ sinh: khung nhôm trắng, cánh kính mờ mở vào trong; gác xép phía trên có chậu đỏ, rổ xanh.
function Bathroom() {
  const { min, max, maxY } = BATH_DOOR
  const xFace = 2.95
  const j = 0.05
  const frame: Block[] = [
    { minX: xFace - 0.03, maxX: xFace, minY: 0, maxY: maxY + j, minZ: min - j, maxZ: min },
    { minX: xFace - 0.03, maxX: xFace, minY: 0, maxY: maxY + j, minZ: max, maxZ: max + j },
    { minX: xFace - 0.03, maxX: xFace, minY: maxY, maxY: maxY + j, minZ: min - j, maxZ: max + j },
  ]
  const w = max - min - 0.02
  const h = maxY - 0.03
  const f = 0.04
  const leaf: Block[] = [
    { minX: 0, maxX: 0.03, minY: 0.02, maxY: 0.02 + f, minZ: -w, maxZ: 0 },
    { minX: 0, maxX: 0.03, minY: h - f, maxY: h, minZ: -w, maxZ: 0 },
    { minX: 0, maxX: 0.03, minY: 0.02, maxY: h, minZ: -f, maxZ: 0 },
    { minX: 0, maxX: 0.03, minY: 0.02, maxY: h, minZ: -w, maxZ: -w + f },
    // Phần dưới cánh là tấm nhựa trắng, phần trên là kính mờ.
    { minX: 0.005, maxX: 0.025, minY: 0.02, maxY: 0.7, minZ: -w, maxZ: 0 },
  ]
  return (
    <group>
      {frame.map((b, i) => (
        <Block3 key={i} b={b} color={WHITE} />
      ))}
      {/* Bản lề phía nam, cánh mở vào trong nhà vệ sinh */}
      <group position={[3.05, 0, max]} rotation-y={-1.4}>
        {leaf.map((b, i) => (
          <Block3 key={i} b={b} color={WHITE} />
        ))}
        <mesh position={[0.015, (0.7 + h - f) / 2, -w / 2]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[w - 2 * f, h - f - 0.7]} />
          <meshStandardMaterial color="#d7dde0" transparent opacity={0.75} />
        </mesh>
      </group>
      {/* Trần nhà vệ sinh = sàn gác xép */}
      <Block3 b={{ minX: 3.05, maxX: 5.6, minY: BATH_CEILING, maxY: BATH_CEILING + 0.05, minZ: 0, maxZ: 1.45 }} color={COLORS.wall} />
      <mesh position={[3.3, BATH_CEILING + 0.12, 0.35]}>
        <cylinderGeometry args={[0.2, 0.16, 0.14, 16]} />
        <meshStandardMaterial color="#d8322b" />
      </mesh>
      <Block3 b={{ minX: 3.15, maxX: 3.6, minY: BATH_CEILING + 0.05, maxY: BATH_CEILING + 0.13, minZ: 0.6, maxZ: 0.92 }} color="#2f6fd6" />
      {/* Công tắc bên phải cửa, bông tắm đen bên trái */}
      <Block3 b={{ minX: 2.93, maxX: 2.95, minY: 1.3, maxY: 1.42, minZ: max + 0.2, maxZ: max + 0.28 }} color={WHITE} />
      <Block3 b={{ minX: 2.93, maxX: 2.95, minY: 1.15, maxY: 1.25, minZ: max + 0.2, maxZ: max + 0.28 }} color={WHITE} />
      <mesh position={[2.9, 1.25, min - 0.18]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#151515" />
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

export function Room({ showLabels = false }: { showLabels?: boolean }) {
  const cx = ROOM.width / 2
  const cz = ROOM.depth / 2
  const tiles = useTileTexture()
  const parts = useMemo(() => buildRoomParts(OPENINGS), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0, cz]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial map={tiles} roughness={0.35} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[cx, ROOM.height, cz]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color="#f4f2ee" />
      </mesh>

      <Batched parts={parts} />
      {/* Ánh sáng 2 đèn tuýp */}
      <pointLight position={[4.0, 2.45, 1.75]} intensity={3.2} distance={7} decay={1.6} color="#f4f8ff" />
      <pointLight position={[0.3, 2.45, 2.6]} intensity={2.6} distance={7} decay={1.6} color="#f4f8ff" />
      <Window />
      <Bathroom />
      <mesh position={[(PULLUP_BAR.x0 + PULLUP_BAR.x1) / 2, PULLUP_BAR.y, PULLUP_BAR.z]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[PULLUP_BAR.radius, PULLUP_BAR.radius, PULLUP_BAR.x1 - PULLUP_BAR.x0, 10]} />
        <meshStandardMaterial color="#141414" />
      </mesh>

      {/* 2 mũ bảo hiểm treo trên cửa */}
      {HELMETS.map((h) => (
        <mesh key={h.x} position={[h.x, h.y, h.z]} rotation-x={-Math.PI / 2}>
          <sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}

      {showLabels && FURNITURE.filter((f) => f.label).map((f) => (
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
