import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import { Character, type Motion } from '../player/Character'
import { Batched } from '../room/Batched'
import type { Part, V3 } from '../room/parts'
import { ROAD_HALF } from './city'
import { CHECKPOINT } from './police'
import { useRide } from './store'

// Xe CSGT: ô tô trắng sọc xanh, đèn nóc nhấp nháy đỏ/xanh (đầu xe hướng -z). Không chữ, không logo.
const WHITE = '#f4f6f8'
const BLUE = '#1f4fbf'
const GLASS = '#26303a'
const B = (size: V3, pos: V3, color: string, mat?: Part['mat']): Part => ({ kind: 'box', size, pos, color, mat })
const wheel = (x: number, z: number): Part => ({
  kind: 'cyl',
  rTop: 0.33,
  rBottom: 0.33,
  h: 0.25,
  seg: 10,
  pos: [x, 0.33, z],
  rot: [0, 0, Math.PI / 2],
  color: '#1a1a1a',
})

const CAR: Part[] = [
  B([1.84, 0.62, 4.3], [0, 0.62, 0], WHITE),
  B([1.86, 0.16, 4.32], [0, 0.66, 0], BLUE),
  B([1.6, 0.52, 2.2], [0, 1.18, 0.2], GLASS),
  B([1.64, 0.08, 2.0], [0, 1.47, 0.25], WHITE),
  B([1.0, 0.1, 0.34], [0, 1.56, 0.25], '#2a2d33'),
  B([1.74, 0.2, 0.06], [0, 0.46, -2.16], '#30343a'),
  ...[-0.86, 0.86].flatMap((x) => [wheel(x, -1.4), wheel(x, 1.4)]),
  B([0.34, 0.12, 0.04], [-0.6, 0.74, -2.17], '#fff6d0', 'emit'),
  B([0.34, 0.12, 0.04], [0.6, 0.74, -2.17], '#fff6d0', 'emit'),
  B([0.34, 0.12, 0.04], [-0.62, 0.78, 2.17], '#ff3030', 'emit'),
  B([0.34, 0.12, 0.04], [0.62, 0.78, 2.17], '#ff3030', 'emit'),
]

// Đèn nóc: hai nửa đỏ / xanh thay nhau sáng.
function LightBar({ rate = 7 }: { rate?: number }) {
  const red = useRef<Mesh>(null)
  const blue = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const on = Math.floor(clock.elapsedTime * rate) % 2 === 0
    if (red.current) red.current.visible = on
    if (blue.current) blue.current.visible = !on
  })
  return (
    <>
      <mesh ref={red} position={[-0.26, 1.66, 0.25]}>
        <boxGeometry args={[0.46, 0.14, 0.3]} />
        <meshBasicMaterial color="#ff2a2a" />
      </mesh>
      <mesh ref={blue} position={[0.26, 1.66, 0.25]}>
        <boxGeometry args={[0.46, 0.14, 0.3]} />
        <meshBasicMaterial color="#2a6bff" />
      </mesh>
    </>
  )
}

function PoliceCarModel({ rate }: { rate?: number }) {
  return (
    <>
      <Batched parts={CAR} />
      <LightBar rate={rate} />
    </>
  )
}

// Xe CSGT đang đuổi / đang lập biên bản (ẩn khi không có).
export function ChaseCar() {
  const group = useRef<Group>(null)
  useFrame(() => {
    const g = group.current
    if (!g) return
    const p = useRide.getState().police
    // Lập biên bản ở chốt thì đã có xe đỗ sẵn ở chốt, không cần thêm xe.
    g.visible = p.mode === 'chase' || (p.mode === 'pullover' && p.reason !== 'helmet')
    g.position.set(p.x, 0, p.z)
    g.rotation.y = p.heading
  })
  return (
    <group ref={group} visible={false}>
      <PoliceCarModel />
    </group>
  )
}

const UNIFORM = { top: '#d9c56a', bottom: '#cdb85c', shoes: '#1c1c1e' }
// Hàng nón giao thông dọc mép đường (gộp chung một lưới).
const CONES: Part[] = [-6, -3, 0, 3, 6].flatMap((dz): Part[] => {
  const x = CHECKPOINT.x + ROAD_HALF - 0.6
  const z = CHECKPOINT.z + dz
  return [
    { kind: 'cyl', rTop: 0.03, rBottom: 0.2, h: 0.55, seg: 8, pos: [x, 0.3, z], color: '#ff6a1a' },
    { kind: 'cyl', rTop: 0.12, rBottom: 0.15, h: 0.08, seg: 8, pos: [x, 0.3, z], color: '#ffffff' },
    B([0.42, 0.04, 0.42], [x, 0.02, z], '#1c1c1e'),
  ]
})

// Chốt CSGT bên phố x = 240: xe đỗ trên vỉa hè, anh CSGT đứng soi mũ, hàng cọc nón.
export function Checkpoint() {
  const officer = useRef<Motion>({ speed: 0 })
  const kerb = CHECKPOINT.x + ROAD_HALF
  return (
    <>
      <group position={[kerb + 1.6, 0.12, CHECKPOINT.z - 5]}>
        <PoliceCarModel rate={3} />
      </group>
      <group position={[kerb + 0.7, 0.12, CHECKPOINT.z]} rotation={[0, Math.PI / 2, 0]}>
        <Character {...UNIFORM} motion={officer} helmet />
      </group>
      <Batched parts={CONES} />
    </>
  )
}
