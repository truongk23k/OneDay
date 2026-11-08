import { useFrame } from '@react-three/fiber'
import { useRef, type MutableRefObject } from 'react'
import type { Group } from 'three'
import { CHARACTER_HEIGHT } from '../room/layout'

const SKIN = '#eab88f'
const HAIR = '#18161a'

export type Motion = { speed: number }

type Props = { top: string; bottom: string; shoes: string; motion?: MutableRefObject<Motion> }

function M({ color }: { color: string }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.8} />
}

// Nhân vật Anh low-poly (mặt hướng về -z), cao CHARACTER_HEIGHT. Tay chân vung theo tốc độ đi,
// người nhún nhẹ mỗi bước, đứng yên thì thở. Tóc đen vuốt dựng hơi bù xù như ảnh.
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

  useFrame((state, dt) => {
    const target = Math.min(1, motion?.current.speed ?? 0)
    blend.current += (target - blend.current) * Math.min(1, dt * 10)
    const w = blend.current
    phase.current += dt * (4 + 7 * w) * (w > 0.02 ? 1 : 0)
    const s = Math.sin(phase.current)
    const swing = 0.65 * w
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
        {/* Chân: xoay quanh hông */}
        {[
          [-0.085, legL],
          [0.085, legR],
        ].map(([x, ref]) => (
          <group key={String(x)} ref={ref as MutableRefObject<Group>} position={[x as number, 0.5, 0]}>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.088, 0.08, 0.22, 8]} />
              <M color={bottom} />
            </mesh>
            <mesh position={[0, -0.33, 0]}>
              <cylinderGeometry args={[0.055, 0.048, 0.26, 7]} />
              <M color={SKIN} />
            </mesh>
            <mesh position={[0, -0.47, -0.025]}>
              <boxGeometry args={[0.1, 0.07, 0.19]} />
              <M color={shoes} />
            </mesh>
          </group>
        ))}
        {/* Thân: hông (quần) + áo */}
        <group ref={torso} position={[0, 0.5, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.1, 9]} />
            <M color={bottom} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.185, 0.17, 0.34, 9]} />
            <M color={top} />
          </mesh>
          <mesh position={[0, 0.42, 0]} scale={[1, 0.45, 0.85]}>
            <icosahedronGeometry args={[0.19, 1]} />
            <M color={top} />
          </mesh>
          {/* Tay: xoay quanh vai */}
          {[
            [-1, armL],
            [1, armR],
          ].map(([side, ref]) => (
            <group key={String(side)} ref={ref as MutableRefObject<Group>} position={[(side as number) * 0.215, 0.4, 0]}>
              <mesh position={[(side as number) * 0.015, -0.06, 0]}>
                <cylinderGeometry args={[0.072, 0.065, 0.13, 8]} />
                <M color={top} />
              </mesh>
              <mesh position={[(side as number) * 0.02, -0.25, 0]}>
                <cylinderGeometry args={[0.046, 0.04, 0.28, 7]} />
                <M color={SKIN} />
              </mesh>
              <mesh position={[(side as number) * 0.022, -0.41, 0]}>
                <icosahedronGeometry args={[0.048, 0]} />
                <M color={SKIN} />
              </mesh>
            </group>
          ))}
          {/* Cổ + đầu */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.05, 0.056, 0.06, 7]} />
            <M color={SKIN} />
          </mesh>
          <group ref={head} position={[0, 0.63, 0]}>
            <mesh>
              <icosahedronGeometry args={[0.155, 1]} />
              <M color={SKIN} />
            </mesh>
            {/* Mắt + lông mày */}
            {[-0.055, 0.055].map((x) => (
              <group key={x}>
                <mesh position={[x, 0.0, -0.142]}>
                  <icosahedronGeometry args={[0.021, 0]} />
                  <M color="#141414" />
                </mesh>
                <mesh position={[x, 0.045, -0.145]} rotation-z={x > 0 ? -0.12 : 0.12}>
                  <boxGeometry args={[0.055, 0.012, 0.012]} />
                  <M color={HAIR} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -0.04, -0.152]}>
              <icosahedronGeometry args={[0.018, 0]} />
              <M color="#d9a27c" />
            </mesh>
            <mesh position={[0, -0.085, -0.135]}>
              <boxGeometry args={[0.05, 0.01, 0.01]} />
              <M color="#a25a4a" />
            </mesh>
            {/* Tóc: chỏm phủ đầu + mấy lọn vuốt dựng ra phía trước */}
            <mesh position={[0, 0.045, 0.015]} scale={[1.07, 0.78, 1.07]}>
              <icosahedronGeometry args={[0.16, 1]} />
              <M color={HAIR} />
            </mesh>
            {[
              [-0.08, 0.16, -0.06, -0.6, 0.25],
              [-0.02, 0.18, -0.09, -0.75, 0.05],
              [0.05, 0.17, -0.08, -0.7, -0.15],
              [0.1, 0.13, -0.04, -0.45, -0.4],
              [0.0, 0.17, 0.02, -0.2, 0.0],
              [-0.11, 0.1, 0.0, -0.1, 0.6],
            ].map(([x, y, z, rx, rz]) => (
              <mesh key={`${x}${z}`} position={[x, y, z]} rotation={[rx, 0, rz]}>
                <coneGeometry args={[0.05, 0.13, 5]} />
                <M color={HAIR} />
              </mesh>
            ))}
            {/* Tai */}
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.155, -0.005, 0]} scale={[0.5, 1, 0.8]}>
                <icosahedronGeometry args={[0.035, 0]} />
                <M color={SKIN} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}
