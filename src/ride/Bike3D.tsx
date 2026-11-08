import { useMemo, useRef, type MutableRefObject } from 'react'
import { Character, type Motion } from '../player/Character'
import { PartsMesh } from '../room/Batched'
import type { Part, V3 } from '../room/parts'
import { itemById } from '../story/outfit'
import type { Outfit } from '../story/state'

// Xe tay ga đen nhám kiểu AB 2026 (không logo, không chữ). Đầu xe hướng về -z.
const BLACK = '#1d1e21'
const GREY = '#6a6f75'
const B = (size: V3, pos: V3, color: string, rot?: V3, mat?: Part['mat']): Part => ({ kind: 'box', size, pos, color, rot, mat })
const wheel = (z: number): Part[] => [
  { kind: 'cyl', rTop: 0.3, rBottom: 0.3, h: 0.11, seg: 14, pos: [0, 0.3, z], rot: [0, 0, Math.PI / 2], color: '#1a1a1a' },
  { kind: 'cyl', rTop: 0.18, rBottom: 0.18, h: 0.12, seg: 10, pos: [0, 0.3, z], rot: [0, 0, Math.PI / 2], color: GREY, mat: 'metal' },
]

export const SCOOTER: Part[] = [
  ...wheel(-0.68),
  ...wheel(0.62),
  B([0.08, 0.5, 0.08], [0, 0.55, -0.64], GREY, [0.25, 0, 0], 'metal'),
  B([0.34, 0.12, 0.9], [0, 0.4, 0], BLACK),
  B([0.38, 0.62, 0.26], [0, 0.72, -0.5], BLACK, [-0.3, 0, 0]),
  B([0.3, 0.22, 0.34], [0, 1.0, -0.62], BLACK, [-0.2, 0, 0]),
  B([0.28, 0.05, 0.04], [0, 0.98, -0.8], '#f4fbff', [-0.2, 0, 0], 'emit'),
  B([0.12, 0.08, 0.03], [-0.12, 0.88, -0.79], '#bfe6ff', [-0.2, 0, 0], 'emit'),
  B([0.12, 0.08, 0.03], [0.12, 0.88, -0.79], '#bfe6ff', [-0.2, 0, 0], 'emit'),
  { kind: 'cyl', rTop: 0.02, rBottom: 0.02, h: 0.64, pos: [0, 1.13, -0.48], rot: [0, 0, Math.PI / 2], color: '#2a2a2d' },
  B([0.05, 0.22, 0.02], [-0.25, 1.25, -0.48], '#2a2a2d'),
  B([0.05, 0.22, 0.02], [0.25, 1.25, -0.48], '#2a2a2d'),
  B([0.1, 0.06, 0.03], [-0.27, 1.37, -0.48], BLACK),
  B([0.1, 0.06, 0.03], [0.27, 1.37, -0.48], BLACK),
  B([0.36, 0.32, 0.8], [0, 0.6, 0.3], BLACK),
  B([0.33, 0.09, 0.66], [0, 0.8, 0.22], '#141414'),
  B([0.24, 0.07, 0.03], [0, 0.72, 0.71], '#ff2a2a', undefined, 'emit'),
  { kind: 'cyl', rTop: 0.05, rBottom: 0.05, h: 0.45, pos: [0.2, 0.32, 0.45], rot: [Math.PI / 2, 0, 0], color: '#9aa0a6', mat: 'metal' },
  B([0.36, 0.03, 0.35], [0, 0.47, -0.22], '#2b2c30'),
]

const EM_LOOK = { top: '#f7f3ee', bottom: '#2c3442', shoes: '#d9a6a0' }
// Áo mưa vàng (giống trong tủ đồ) trùm lên áo của Anh khi đã mặc.
const RAINCOAT = '#f2c230'

export function Scooter() {
  return <PartsMesh parts={SCOOTER} />
}

// Anh cầm lái (và Em ngồi sau nếu đã đón) trên xe.
export function Riders({ outfit, helmetsTaken, emAboard }: { outfit: Outfit; helmetsTaken: number; emAboard: boolean }) {
  const anh = useRef<Motion>({ speed: 0, pose: 'ride' })
  const em = useRef<Motion>({ speed: 0, pose: 'pillion' })
  const colors = useMemo(
    () => ({
      top: outfit.raincoat ? RAINCOAT : itemById(outfit.top).color,
      bottom: itemById(outfit.bottom).color,
      shoes: itemById(outfit.shoes).color,
    }),
    [outfit],
  )
  return (
    <>
      <group position={[0, 0.33, 0.05]}>
        <Character {...colors} motion={anh} helmet={helmetsTaken >= 1} />
      </group>
      {emAboard && (
        <group position={[0, 0.36, 0.42]}>
          <Character {...EM_LOOK} variant="em" motion={em} helmet={helmetsTaken >= 2} />
        </group>
      )}
    </>
  )
}

// Em đứng đợi trước nhà (vẫy tay nhẹ).
export function EmWaiting({ position, facing, motion }: { position: V3; facing: number; motion: MutableRefObject<Motion> }) {
  return (
    <group position={position} rotation-y={facing}>
      <Character {...EM_LOOK} variant="em" motion={motion} />
    </group>
  )
}
