import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { CanvasTexture, ExtrudeGeometry, RepeatWrapping, SRGBColorSpace, Shape, ShapeGeometry, type Group } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import type { Quality } from '../device'
import { Batched, PartsMesh } from './Batched'
import { BATH_DOOR, BATH_LOFT, FURNITURE, ROOM, WINDOW } from './layout'
import type { Opening } from './openings'
import { useStory } from '../story/store'
import { FRIDGE_DOOR_OPEN, bathDoorLeafParts, buildRoomParts, fridgeDoorParts, helmetParts } from './parts'
import { useWorld } from './world'

const OPENINGS: Opening[] = [WINDOW, BATH_DOOR, BATH_LOFT]

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

// Kính hai cánh cửa sổ + khoảng trời trắng bên ngoài (khung, song sắt, điều hòa nằm trong parts.ts).
function WindowGlass() {
  const { min, max, minY, maxY } = WINDOW
  const t = 0.05
  const f = 0.045
  const midZ = (min + max) / 2
  const sashes = [
    { x: -0.085, z0: min + t, z1: midZ + 0.025 },
    { x: -0.055, z0: midZ - 0.025, z1: max - t },
  ]
  return (
    <group>
      {sashes.map((s) => (
        <mesh key={s.x} position={[s.x, (minY + maxY) / 2, (s.z0 + s.z1) / 2]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[s.z1 - s.z0 - 2 * f, maxY - minY - 2 * t - 2 * f]} />
          <meshStandardMaterial color="#e8f4ff" transparent opacity={0.18} />
        </mesh>
      ))}
      <mesh position={[-1.5, 2, midZ]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Helmets() {
  const taken = useStory((st) => st.s.tasks.helmets)
  const parts = useMemo(() => helmetParts(2 - taken), [taken])
  if (!parts.length) return null
  return <PartsMesh parts={parts} />
}

// Cánh dưới tủ lạnh: bản lề mép phải, mở ra phía ngoài.
function FridgeDoor() {
  const f = FURNITURE.find((x) => x.id === 'fridge')!
  const door = useRef<Group>(null)
  const parts = useMemo(() => fridgeDoorParts(f), [f])
  useFrame((_, dt) => {
    if (!door.current) return
    const target = useWorld.getState().fridgeOpen ? FRIDGE_DOOR_OPEN : 0
    door.current.rotation.y += (target - door.current.rotation.y) * Math.min(1, dt * 6)
  })
  return (
    <group ref={door} position={[f.maxX - 0.01, 0, f.maxZ]}>
      <PartsMesh parts={parts} />
    </group>
  )
}

const LEAF_OPEN = -1.4

// Cánh cửa nhà vệ sinh: bản lề phía nam, mở vào trong; xoay mượt khi đóng/mở.
function BathDoorLeaf() {
  const leaf = useRef<Group>(null)
  const parts = useMemo(() => bathDoorLeafParts(), [])
  const w = BATH_DOOR.max - BATH_DOOR.min - 0.02
  const h = BATH_DOOR.maxY - 0.03
  useFrame((_, dt) => {
    if (!leaf.current) return
    const target = useWorld.getState().bathDoorOpen ? LEAF_OPEN : 0
    leaf.current.rotation.y += (target - leaf.current.rotation.y) * Math.min(1, dt * 6)
  })
  return (
    <group ref={leaf} position={[3.05, 0, BATH_DOOR.max]} rotation-y={LEAF_OPEN}>
      <PartsMesh parts={parts} />
      <mesh position={[0.015, (0.7 + h - 0.04) / 2, -w / 2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[w - 0.08, h - 0.04 - 0.7]} />
        <meshStandardMaterial color="#d7dde0" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

// Nước chảy khi vặn vòi lavabo, vòi bồn rửa bếp, vòi sen.
function Water() {
  const water = useWorld((w) => w.water)
  return (
    <>
      {water.lavabo && (
        <mesh position={[3.775, 0.92, 0.09]}>
          <cylinderGeometry args={[0.01, 0.014, 0.13, 8]} />
          <meshBasicMaterial color="#a9dcff" transparent opacity={0.7} />
        </mesh>
      )}
      {water.sink && (
        <mesh position={[1.07, 0.99, 1.49]}>
          <cylinderGeometry args={[0.01, 0.014, 0.24, 8]} />
          <meshBasicMaterial color="#a9dcff" transparent opacity={0.7} />
        </mesh>
      )}
      {water.shower && (
        <mesh position={[3.775, 1.0, 1.24]}>
          <cylinderGeometry args={[0.06, 0.26, 2.0, 14, 1, true]} />
          <meshBasicMaterial color="#bfe6ff" transparent opacity={0.28} side={2} depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

function TubeLights() {
  const on = useWorld((w) => w.lightsOn)
  return (
    <>
      <pointLight position={[4.0, 2.45, 1.75]} intensity={on ? 3.2 : 0} distance={7} decay={1.6} color="#f4f8ff" />
      <pointLight position={[0.3, 2.45, 2.6]} intensity={on ? 2.6 : 0} distance={7} decay={1.6} color="#f4f8ff" />
    </>
  )
}

// Mặt gương đứng (vòm trên) phản chiếu thật cả căn phòng; máy yếu dùng mặt tĩnh cho nhẹ.
function MirrorGlass({ quality }: { quality: Quality }) {
  const m = FURNITURE.find((f) => f.id === 'mirror')!
  const t = 0.04
  const r = (m.maxZ - m.minZ) / 2 - t
  const bottom = 0.14
  const archY = 1.45 - bottom
  const geometry = useMemo(() => {
    const s = new Shape()
    s.moveTo(-r, 0)
    s.lineTo(r, 0)
    s.lineTo(r, archY)
    s.absarc(0, archY, r, 0, Math.PI, false)
    s.lineTo(-r, 0)
    return new ShapeGeometry(s, 16)
  }, [r, archY])
  const reflector = useMemo(() => {
    if (quality === 'low') return null
    const size = quality === 'high' ? 1024 : 512
    return new Reflector(geometry, { textureWidth: size / 2, textureHeight: size, color: 0xc4ccd2, clipBias: 0.003 })
  }, [geometry, quality])
  useEffect(() => () => reflector?.dispose(), [reflector])
  // Vòm khung hồng: nửa vành khuyên đùn theo bề dày khung, liền một khối.
  const arch = useMemo(() => {
    const s = new Shape()
    s.absarc(0, archY, r + t, 0, Math.PI, false)
    s.absarc(0, archY, r, Math.PI, 0, true)
    return new ExtrudeGeometry(s, { depth: m.maxX - m.minX, bevelEnabled: false, curveSegments: 24 })
  }, [r, archY, m.maxX, m.minX])
  const cz = (m.minZ + m.maxZ) / 2
  const position: [number, number, number] = [m.minX + 0.012, bottom, cz]
  return (
    <>
      <mesh geometry={arch} position={[m.maxX, bottom, cz]} rotation-y={-Math.PI / 2}>
        <meshStandardMaterial color="#e48fb0" flatShading roughness={0.6} />
      </mesh>
      {reflector ? (
        <primitive object={reflector} position={position} rotation-y={-Math.PI / 2} />
      ) : (
        <mesh geometry={geometry} position={position} rotation-y={-Math.PI / 2}>
          <meshStandardMaterial color="#cfd8dd" metalness={0.6} roughness={0.15} />
        </mesh>
      )}
    </>
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

export function Room({ showLabels = false, quality = 'medium' }: { showLabels?: boolean; quality?: Quality }) {
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
      <MirrorGlass quality={quality} />
      <BathDoorLeaf />
      <FridgeDoor />
      <Helmets />
      <WindowGlass />
      <Water />
      {/* Ánh sáng 2 đèn tuýp (tắt được bằng công tắc cạnh cửa nhà vệ sinh) */}
      <TubeLights />

      {showLabels &&
        FURNITURE.filter((f) => f.label).map((f) => (
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
