import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { itemById, wardrobePile, type PileCard } from '../story/outfit'
import { useStory } from '../story/store'
import { useDraft } from '../story/wardrobeDraft'
import { PartsMesh } from './Batched'
import { FURNITURE } from './layout'
import { wardrobeDoorParts, type Part, type V3 } from './parts'

const W = FURNITURE.find((f) => f.id === 'wardrobe')!
const DOOR_W = (W.maxZ - W.minZ) / 3
const OPEN = 1.75

const B = (size: V3, pos: V3, color: string, rot?: V3): Part => ({ kind: 'box', size, pos, color, rot })
const I = (r: number, pos: V3, color: string, scale?: V3): Part => ({ kind: 'ico', r, pos, color, scale })

// Quần áo dựng quanh móc treo (y = 0 ở móc), rộng theo trục X cục bộ.
function hanger(): Part[] {
  return [B([0.36, 0.015, 0.015], [0, -0.03, 0], '#c9b28f'), B([0.015, 0.05, 0.015], [0, 0, 0], '#9aa0a6')]
}

function tee(color: string, collar?: string): Part[] {
  const p = [
    ...hanger(),
    B([0.34, 0.42, 0.03], [0, -0.26, 0], color),
    B([0.12, 0.1, 0.03], [-0.21, -0.1, 0], color, [0, 0, 0.5]),
    B([0.12, 0.1, 0.03], [0.21, -0.1, 0], color, [0, 0, -0.5]),
  ]
  if (collar) p.push(B([0.13, 0.035, 0.04], [0, -0.06, 0], collar))
  return p
}

function shorts(color: string, dots?: string): Part[] {
  const p = [...hanger(), B([0.3, 0.05, 0.03], [0, -0.06, 0], color), B([0.14, 0.26, 0.03], [-0.075, -0.21, 0], color), B([0.14, 0.26, 0.03], [0.075, -0.21, 0], color)]
  if (dots) for (const [x, y] of [[-0.09, -0.15], [0.06, -0.22], [-0.05, -0.27], [0.1, -0.12]]) p.push(B([0.03, 0.03, 0.035], [x, y, 0], dots))
  return p
}

function longCoat(color: string, length: number, sleeves = true): Part[] {
  const p = [...hanger(), B([0.38, length, 0.04], [0, -0.04 - length / 2, 0], color)]
  if (sleeves) p.push(B([0.08, length * 0.75, 0.04], [-0.23, -0.06 - length * 0.37, 0], color), B([0.08, length * 0.75, 0.04], [0.23, -0.06 - length * 0.37, 0], color))
  return p
}

function hangingParts(c: PileCard): Part[] {
  if (c.kind === 'raincoat') return [...longCoat('#f2c230', 0.8), I(0.09, [0, -0.02, 0.02], '#f2c230', [1, 0.7, 0.6])]
  if (c.id === 'jacket') return longCoat('#6b7a5a', 0.62)
  if (c.id === 'tie') return [...hanger(), B([0.06, 0.45, 0.015], [0, -0.28, 0], '#1f2f5c'), B([0.05, 0.05, 0.02], [0, -0.05, 0], '#1f2f5c')]
  if (c.id === 'towel') return [B([0.3, 0.5, 0.02], [0, -0.25, 0], '#f1ebdc')]
  const item = itemById(c.id)
  if (item.slot === 'top') {
    if (c.id === 'polo') return tee(item.color, '#1a2747')
    if (c.id === 'pyjama') return [...tee(item.color), ...[-0.1, -0.2, -0.3].map((y) => B([0.025, 0.025, 0.035], [0, y, 0], '#ffffff'))]
    return tee(item.color)
  }
  return shorts(item.color, c.id === 'floral' ? '#ffd23f' : undefined)
}

// Đồ để dưới đáy tủ: giày dép, tất, gấu bông.
function floorParts(c: PileCard): Part[] {
  if (c.id === 'socks') return [B([0.08, 0.04, 0.18], [-0.05, 0.02, 0], '#7a6f63'), B([0.08, 0.04, 0.18], [0.06, 0.02, 0.03], '#8a7f73')]
  if (c.id === 'teddy') return [I(0.11, [0, 0.11, 0], '#e8d7c3'), I(0.08, [0, 0.27, 0], '#e8d7c3'), I(0.03, [-0.06, 0.33, 0], '#e8d7c3'), I(0.03, [0.06, 0.33, 0], '#e8d7c3')]
  const color = itemById(c.id).color
  const pair: Part[] = []
  for (const x of [-0.06, 0.06]) {
    if (c.id === 'sneakers') pair.push(B([0.09, 0.07, 0.22], [x, 0.035, 0], color), B([0.092, 0.02, 0.222], [x, 0.01, 0], '#d0d0d0'))
    else pair.push(B([0.09, 0.025, 0.22], [x, 0.0125, 0], color), B([0.092, 0.03, 0.05], [x, 0.035, -0.03], c.id === 'slides' ? '#202020' : '#d9cfa8'))
  }
  return pair
}

const ON_FLOOR = new Set(['sneakers', 'slides', 'honeycomb', 'socks', 'teddy'])

// Một món đồ bấm được; món đang chọn nhô ra phía người xem.
function Garment({ c, base, rotY, parts }: { c: PileCard; base: V3; rotY: number; parts: Part[] }) {
  const g = useRef<Group>(null)
  useFrame((_, dt) => {
    if (!g.current) return
    const out = useDraft.getState().isPicked(c) ? 0.14 : 0
    g.current.position.x += (base[0] + out - g.current.position.x) * Math.min(1, dt * 10)
  })
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (useDraft.getState().pick(c) === 'junk') useStory.getState().dispatch({ type: 'junk', id: c.id })
  }
  return (
    <group
      ref={g}
      position={base}
      rotation-y={rotY}
      onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <PartsMesh parts={parts} />
    </group>
  )
}

// Cửa tủ quần áo mở/đóng + quần áo treo bên trong (chỉ vẽ khi tủ mở).
export function WardrobeScene() {
  const open = useStory((st) => st.s.overlay === 'wardrobe')
  const seed = useStory((st) => st.s.seed)
  const doors = useRef<(Group | null)[]>([])
  // Hai cánh trắng mở ra hai bên (bản lề ở mép ngoài), ngăn gỗ bên phải cố định.
  const doorParts = useMemo(
    () => [wardrobeDoorParts(DOOR_W, 1, false), wardrobeDoorParts(DOOR_W, -1, false), wardrobeDoorParts(DOOR_W, 1, true)],
    [],
  )
  const pile = useMemo(() => wardrobePile(seed), [seed])
  const hanging = pile.filter((c) => !ON_FLOOR.has(c.id))
  const floor = pile.filter((c) => ON_FLOOR.has(c.id))
  const hangingParts_ = useMemo(() => hanging.map(hangingParts), [hanging])
  const floorParts_ = useMemo(() => floor.map(floorParts), [floor])

  useFrame((_, dt) => {
    doors.current.forEach((d, i) => {
      if (!d) return
      const target = open && i < 2 ? (i === 1 ? -OPEN : OPEN) : 0
      d.rotation.y += (target - d.rotation.y) * Math.min(1, dt * 5)
    })
  })

  // Ngăn treo đồ: hai cánh trắng đầu tiên.
  const span = 2 * DOOR_W - 0.2
  const hingeZ = [W.minZ, W.minZ + 2 * DOOR_W, W.minZ + 2 * DOOR_W]
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => (doors.current[i] = el)} position={[W.maxX, 0, hingeZ[i]]}>
          <PartsMesh parts={doorParts[i]} />
        </group>
      ))}
      {open &&
        hanging.map((c, i) => (
          <Garment
            key={c.id}
            c={c}
            base={[0.32, 1.77, W.minZ + 0.12 + (i + 0.5) * (span / hanging.length)]}
            rotY={-0.95}
            parts={hangingParts_[i]}
          />
        ))}
      {open &&
        floor.map((c, i) => (
          <Garment key={c.id} c={c} base={[0.32, 0.48, W.minZ + 0.22 + i * ((span - 0.1) / floor.length)]} rotY={-Math.PI / 2} parts={floorParts_[i]} />
        ))}
    </group>
  )
}
