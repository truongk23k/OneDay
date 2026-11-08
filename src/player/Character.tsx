import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import type { Group } from 'three'
import { PartsMesh } from '../room/Batched'
import { CHARACTER_HEIGHT, PULLUP_BAR } from '../room/layout'
import type { Part, V3 } from '../room/parts'
import type { Pose } from './pose'

const SKIN = '#eab88f'
const HAIR = '#18161a'

export type Motion = { speed: number; pose?: Pose }

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
// Dáng gầy, nhỏ, hơi có cơ bắp: vai rộng hơn eo, bắp tay và bắp vai nổi nhẹ.
function legParts(bottom: string, shoes: string): Part[] {
  return [
    Cy(0.074, 0.068, 0.22, [0, -0.12, 0], bottom),
    Cy(0.046, 0.04, 0.26, [0, -0.33, 0], SKIN, 7),
    I(0.042, [0, -0.3, -0.012], SKIN, [1, 1.5, 0.9]),
    B([0.085, 0.06, 0.17], [0, -0.475, -0.02], shoes),
  ]
}

function armParts(side: number, top: string): Part[] {
  return [
    I(0.07, [side * 0.01, -0.01, 0], top, [1, 0.85, 0.9]),
    Cy(0.062, 0.056, 0.12, [side * 0.012, -0.07, 0], top),
    I(0.046, [side * 0.016, -0.17, -0.01], SKIN, [1, 1.45, 1.05]),
    Cy(0.04, 0.034, 0.26, [side * 0.02, -0.27, 0], SKIN, 7),
    I(0.04, [side * 0.022, -0.41, 0], SKIN),
  ]
}

function torsoParts(top: string, bottom: string): Part[] {
  return [
    Cy(0.14, 0.14, 0.1, [0, 0.04, 0], bottom, 9),
    Cy(0.168, 0.135, 0.34, [0, 0.25, 0], top, 9),
    I(0.175, [0, 0.41, -0.005], top, [1.05, 0.45, 0.78]),
    I(0.07, [-0.06, 0.33, -0.1], top, [1, 0.7, 0.5]),
    I(0.07, [0.06, 0.33, -0.1], top, [1, 0.7, 0.5]),
    Cy(0.045, 0.05, 0.06, [0, 0.48, 0], SKIN, 7),
  ]
}

// Đầu: mặt, mắt, lông mày, mũi, miệng, tai và tóc đen vuốt dựng hơi bù xù như ảnh.
const HEAD_PARTS: Part[] = [
  I(0.148, [0, 0, 0], SKIN, [0.95, 1.02, 0.97]),
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
  // Góc hiện tại của các khớp (lerp dần tới tư thế mục tiêu).
  const j = useRef({ legL: 0, legR: 0, armL: 0, armR: 0, armRZ: 0, armLZ: 0, head: 0, rootY: 0, tilt: 0, armScale: 1, sway: 0, twist: 0 })
  const spin = useRef(0)

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
    const t = state.clock.elapsedTime
    // Tư thế mặc định: đi bộ / đứng.
    const still = { armRZ: 0, armLZ: 0, tilt: 0, armScale: 1, sway: 0, twist: 0 }
    const pose = motion?.current.pose ?? 'none'
    let tgt = { ...still, legL: s * swing, legR: -s * swing, armL: -s * swing * 0.8, armR: s * swing * 0.8, head: 0, rootY: Math.abs(s) * 0.035 * w }
    switch (pose) {
      case 'sit':
        tgt = { ...still, legL: 1.45, legR: 1.45, armL: 1.15 + Math.sin(t * 17) * 0.06, armR: 1.15 + Math.sin(t * 17 + 1.6) * 0.06, head: 0.12, rootY: 0 }
        break
      case 'brush':
        tgt = { ...still, legL: 0, legR: 0, armL: 0.15, armR: 2.25, armRZ: Math.sin(t * 22) * 0.28, head: 0, rootY: 0 }
        break
      case 'wash':
        tgt = { ...still, legL: 0, legR: 0, armL: 1.9 + Math.sin(t * 9) * 0.25, armR: 1.9 + Math.sin(t * 9) * 0.25, head: 0.3, rootY: 0 }
        break
      case 'drink':
        tgt = { ...still, legL: 0, legR: 0, armL: 0.1, armR: 2.6, armRZ: 0.2, head: -0.35, rootY: 0 }
        break
      case 'squat':
        tgt = { ...still, legL: 1.2, legR: 1.2, armL: 0.5, armR: 0.5, head: 0.1, rootY: -0.28 }
        break
      case 'pullup': {
        // Tay luôn bám thanh xà: người kéo lên tới khi cằm qua xà, tay co lại (thu ngắn) rồi duỗi ra.
        const p = (1 - Math.cos(t * 3.4)) / 2
        const local = (PULLUP_BAR.y - 0.03) / k
        const rootY = 0.8 + 0.33 * p
        tgt = { ...still, legL: 0.3, legR: 0.18, armL: Math.PI, armR: Math.PI, head: -0.12, rootY, armScale: Math.max(0.15, (local - 0.9 - rootY) / 0.41) }
        break
      }
      case 'bathe':
        tgt = { ...still, legL: 0, legR: 0, armL: 2.7 + Math.sin(t * 10) * 0.25, armR: 2.7 + Math.sin(t * 10 + 2) * 0.25, head: -0.25, rootY: 0 }
        break
      case 'flex':
        tgt = { ...still, legL: 0.05, legR: -0.05, armL: 0, armR: 0, armLZ: -1.35 + Math.sin(t * 6) * 0.1, armRZ: 1.35 - Math.sin(t * 6) * 0.1, head: -0.1, rootY: 0 }
        break
      case 'lie':
        tgt = { ...still, legL: 0, legR: 0.08, armL: 0.25, armR: -0.2, head: 0, rootY: 0.6, tilt: -Math.PI / 2 }
        break
      case 'stretch':
        tgt = { ...still, legL: 0, legR: 0, armL: 2.9 + Math.sin(t * 4) * 0.1, armR: 2.9 - Math.sin(t * 4) * 0.1, armLZ: -0.3, armRZ: 0.3, head: -0.35, rootY: 0.02 }
        break
      case 'danceTiktok': {
        // Hai tay thay nhau đẩy lên trời, hông lắc theo nhịp.
        const b = Math.sin(t * 8)
        tgt = { ...still, legL: Math.max(0, b) * 0.3, legR: Math.max(0, -b) * 0.3, armL: 2.2 + b * 0.8, armR: 2.2 - b * 0.8, armLZ: -0.3, armRZ: 0.3, head: b * 0.1, rootY: Math.abs(b) * 0.05, sway: b * 0.06, twist: b * 0.25 }
        break
      }
      case 'danceHips': {
        // Đá chân, vẫy hai tay sang hai bên, người vặn qua lại.
        const b = Math.sin(t * 6)
        tgt = { ...still, legL: Math.max(0, b) * 0.7, legR: Math.max(0, -b) * 0.7, armL: 0.6, armR: 0.6, armLZ: -1.0 - b * 0.5, armRZ: 1.0 - b * 0.5, head: 0, rootY: 0.03, sway: b * 0.08, twist: -b * 0.35 }
        break
      }
      case 'danceSpin':
        tgt = { ...still, legL: 0.1, legR: -0.1, armL: 0, armR: 0, armLZ: -1.45, armRZ: 1.45, head: -0.15, rootY: 0.02 }
        break
      case 'phone':
        tgt = { ...still, legL: 0, legR: 0, armL: 0.9, armR: 1.25, armRZ: 0.35, armLZ: -0.25, head: 0.4, rootY: 0 }
        break
    }
    const ease = Math.min(1, dt * 12)
    const cur = j.current
    for (const key of Object.keys(cur) as (keyof typeof cur)[]) cur[key] += (tgt[key] - cur[key]) * ease
    if (legL.current) legL.current.rotation.x = cur.legL
    if (legR.current) legR.current.rotation.x = cur.legR
    if (armL.current) {
      armL.current.rotation.x = cur.armL
      armL.current.rotation.z = cur.armLZ
      armL.current.scale.y = cur.armScale
    }
    if (armR.current) {
      armR.current.rotation.x = cur.armR
      armR.current.rotation.z = cur.armRZ
      armR.current.scale.y = cur.armScale
    }
    // Xoay vòng: quay liên tục khi đang nhảy xoay, ngoài ra thì về hướng cũ.
    spin.current = pose === 'danceSpin' ? spin.current + dt * 9 : spin.current * Math.max(0, 1 - dt * 10)
    if (root.current) {
      root.current.position.y = cur.rootY
      root.current.position.x = cur.sway
      root.current.rotation.x = cur.tilt
      root.current.rotation.y = cur.twist + spin.current
    }
    if (torso.current) {
      torso.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012 * (1 - w)
      torso.current.rotation.y = s * 0.08 * w
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 1.3) * 0.03 * (1 - w)
      head.current.rotation.x = cur.head
    }
  })

  return (
    <group scale={k}>
      <group ref={root}>
        <group ref={legL} position={[-0.072, 0.5, 0]}>
          <PartsMesh parts={leg} />
        </group>
        <group ref={legR} position={[0.072, 0.5, 0]}>
          <PartsMesh parts={leg} />
        </group>
        <group ref={torso} position={[0, 0.5, 0]}>
          <PartsMesh parts={body} />
          <group ref={armL} position={[-0.19, 0.4, 0]}>
            <PartsMesh parts={armLeft} />
          </group>
          <group ref={armR} position={[0.19, 0.4, 0]}>
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
