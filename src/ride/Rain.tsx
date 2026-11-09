import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, type LineSegments } from 'three'
import { MATERIALS, mergeParts } from '../room/Batched'
import type { Part } from '../room/parts'
import { mulberry32 } from '../story/rng'
import { ROADS_X, ROADS_Z, ROAD_HALF } from './city'

// Mưa nhẹ: ít hạt, vệt ngắn và mờ.
const DROPS = 380
const SPREAD = 26
const TOP = 16
const FALL = 22
const STREAK = 0.3

// Mưa: các vệt nước rơi trong một hộp quanh camera (một lệnh vẽ).
function Drops() {
  const ref = useRef<LineSegments>(null)
  const geom = useMemo(() => {
    const rnd = mulberry32(11)
    const pos = new Float32Array(DROPS * 6)
    for (let i = 0; i < DROPS; i++) {
      const x = (rnd() * 2 - 1) * SPREAD
      const y = rnd() * TOP
      const z = (rnd() * 2 - 1) * SPREAD
      pos.set([x, y, z, x + 0.04, y + STREAK, z], i * 6)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    return g
  }, [])
  useEffect(() => () => geom.dispose(), [geom])

  useFrame(({ camera }, dt) => {
    const lines = ref.current
    if (!lines) return
    lines.position.set(camera.position.x, 0, camera.position.z)
    const attr = geom.getAttribute('position') as BufferAttribute
    const a = attr.array as Float32Array
    const d = Math.min(dt, 0.05) * FALL
    for (let i = 0; i < DROPS; i++) {
      const o = i * 6
      let y = a[o + 1] - d
      if (y < 0) y += TOP
      a[o + 1] = y
      a[o + 4] = y + STREAK
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments ref={ref} geometry={geom} frustumCulled={false}>
      <lineBasicMaterial color="#dfe8f1" transparent opacity={0.32} />
    </lineSegments>
  )
}

// Vũng nước loang trên mặt đường (chất liệu bóng nhẹ).
function Puddles() {
  const geom = useMemo(() => {
    const rnd = mulberry32(5)
    const parts: Part[] = []
    for (let i = 0; i < 36; i++) {
      const r = 0.8 + rnd() * 1.6
      const off = (rnd() * 2 - 1) * (ROAD_HALF - r)
      const onZ = rnd() < 0.5
      const x = onZ ? rnd() * ROADS_X[ROADS_X.length - 1] : ROADS_X[Math.floor(rnd() * ROADS_X.length)] + off
      const z = onZ ? ROADS_Z[Math.floor(rnd() * ROADS_Z.length)] + off : -rnd() * -ROADS_Z[ROADS_Z.length - 1]
      parts.push({ kind: 'cyl', rTop: r, rBottom: r, h: 0.01, seg: 12, pos: [x, 0.032, z], color: '#2f3a46' })
    }
    return mergeParts(parts)
  }, [])
  useEffect(() => () => geom.dispose(), [geom])
  return <mesh geometry={geom} material={MATERIALS.metal} />
}

export function Rain() {
  return (
    <>
      <Drops />
      <Puddles />
    </>
  )
}
