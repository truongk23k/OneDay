import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import type { Group } from 'three'
import { PartsMesh } from '../room/Batched'
import { CHARACTER_HEIGHT } from '../room/layout'
import type { Part, V3 } from '../room/parts'

const SKIN = '#eab88f'
const HAIR = '#18161a'

export type Motion = { speed: number }

type Props = { top: string; bottom: string; shoes: string; motion?: MutableRefObject<Motion> }

const B = (size: V3, pos: V3, color: string, rot?: V3): Part => ({ kind: 'box', size, pos, color, rot })
const Cy = (rTop: number, rBottom: number, h: number, pos: V3, color: string, seg = 8, rot?: V3): Part => ({
  kind: 'cyl',
  rTop,
  rBottom,
  h,
  pos,
  color,
  seg,
  rot,
})
const I = (r: number, pos: V3, color: string, scale?: V3): Part => ({ kind: 'ico', r, pos, color, scale })

// Mỗi bộ phận là một lưới gộp (vài lệnh vẽ cho cả nhân vật); tọa độ tính từ khớp xoay của bộ phận đó.
function legParts(bottom: string, shoes: string): Part[] {
  return [Cy(0.088, 0.08, 0.22, [0, -0.12, 0], bottom), Cy(0.055, 0.048, 0.26, [0, -0.33, 0], SKIN, 7), B([0.1, 0.07, 0.19], [0, -0.47, -0.025], shoes)]
}

function armParts(side: number, top: string): Part[] {
  return [
    Cy(0.072, 0.065, 0.13, [side * 0.015, -0.06, 0], top),
    Cy(0.046, 0.04, 0.28, [side * 0.02, -0.25, 0], SKIN, 7),
    I(0.048, [side * 0.022, -0.41, 0], SKIN),
  ]
}

function torsoParts(top: string, bottom: string): Part[] {
  return [
    Cy(0.17, 0.17, 0.1, [0, 0.04, 0], bottom, 9),
    Cy(0.185, 0.17, 0.34, [0, 0.25, 0], top, 9),
    I(0.19, [0, 0.42, 0], top, [1, 0.45, 0.85]),
    Cy(0.05, 0.056, 0.06, [0, 0.48, 0], SKIN, 7),
  ]
}

// Đầu: mặt, mắt, lông mày, mũi, miệng, tai và tóc đen vuốt dựng hơi bù xù như ảnh.
const HEAD_PARTS: Part[] = [
  I(0.155, [0, 0, 0], SKIN),
  ...[-0.055, 0.055].flatMap((x) => [
    I(0.021, [x, 0, -0.142], '#141414'),
    B([0.055, 0.012, 0.012], [x, 0.045, -0.145], HAIR, [0, 0, x > 0 ? -0.12 : 0.12]),
  ]),
  I(0.018, [0, -0.04, -0.152], '#d9a27c'),
  B([0.05, 0.01, 0.01], [0, -0.085, -0.135], '#a25a4a'),
  I(0.16, [0, 0.045, 0.015], HAIR, [1.07, 0.78, 1.07]),
  ...(
    [
      [-0.08, 0.16, -0.06, -0.6, 0.25],
      [-0.02, 0.18, -0.09, -0.75, 0.05],
      [0.05, 0.17, -0.08, -0.7, -0.15],
      [0.1, 0.13, -0.04, -0.45, -0.4],
      [0.0, 0.17, 0.02, -0.2, 0.0],
      [-0.11, 0.1, 0.0, -0.1, 0.6],
    ] as const
  ).map(([x, y, z, rx, rz]) => Cy(0, 0.05, 0.13, [x, y, z], HAIR, 5, [rx, 0, rz])),
  I(0.035, [-0.155, -0.005, 0], SKIN, [0.5, 1, 0.8]),
  I(0.035, [0.155, -0.005, 0], SKIN, [0.5, 1, 0.8]),
]

// Nhân vật Anh low-poly (mặt hướng về -z), cao CHARACTER_HEIGHT. Tay chân vung theo tốc độ đi,
// người nhún nhẹ mỗi bước, đứng yên thì thở.
export function Character({ top, bottom, shoes, motion }: Props) {
  const k = CHARACTER_HEIGHT / 1.3
  const root = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const head = useRef<Group>(null)
  const phase = useRef(0)
  const blend = useRef(0)

  const leg = useMemo(() => legParts(bottom, shoes), [bottom, shoes])
  const armLeft = useMemo(() => armParts(-1, top), [top])
  const armRight = useMemo(() => armParts(1, top), [top])
  const body = useMemo(() => torsoParts(top, bottom), [top, bottom])

  useFrame((state, dt) => {
    // speed: 0 đứng yên, 1 đi bộ, ~1.65 chạy nhanh.
    const target = Math.min(1.7, motion?.current.speed ?? 0)
    blend.current += (target - blend.current) * Math.min(1, dt * 10)
    const run = blend.current
    const w = Math.min(1, run)
    phase.current += dt * (4 + 7 * run) * (run > 0.02 ? 1 : 0)
    const s = Math.sin(phase.current)
    const swing = 0.65 * w + 0.35 * Math.max(0, run - 1)
    if (legL.current) legL.current.rotation.x = s * swing
    if (legR.current) legR.current.rotation.x = -s * swing
    if (armL.current) armL.current.rotation.x = -s * swing * 0.8
    if (armR.current) armR.current.rotation.x = s * swing * 0.8
    const t = state.clock.elapsedTime
    if (root.current) root.current.position.y = Math.abs(s) * 0.035 * w
    if (torso.current) {
      torso.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012 * (1 - w)
      torso.current.rotation.y = s * 0.08 * w
    }
    if (head.current) head.current.rotation.z = Math.sin(t * 1.3) * 0.03 * (1 - w)
  })

  return (
    <group scale={k}>
      <group ref={root}>
        <group ref={legL} position={[-0.085, 0.5, 0]}>
          <PartsMesh parts={leg} />
        </group>
        <group ref={legR} position={[0.085, 0.5, 0]}>
          <PartsMesh parts={leg} />
        </group>
        <group ref={torso} position={[0, 0.5, 0]}>
          <PartsMesh parts={body} />
          <group ref={armL} position={[-0.215, 0.4, 0]}>
            <PartsMesh parts={armLeft} />
          </group>
          <group ref={armR} position={[0.215, 0.4, 0]}>
            <PartsMesh parts={armRight} />
          </group>
          <group ref={head} position={[0, 0.63, 0]}>
            <PartsMesh parts={HEAD_PARTS} />
          </group>
        </group>
      </group>
    </group>
  )
}
