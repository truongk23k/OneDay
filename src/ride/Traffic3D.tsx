import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, InstancedMesh, MeshBasicMaterial, Object3D } from 'three'
import { MATERIALS, mergeParts } from '../room/Batched'
import { groupParts, type Part, type V3 } from '../room/parts'
import { LIGHTS, ROAD_HALF } from './city'
import { useRide } from './store'
import { lightState, newTraffic, poseOf, type VehicleKind } from './traffic'

// Xe cộ low-poly, đầu xe hướng -z. Phần màu trắng được nhuộm theo từng xe (màu của instance).
const TINT = '#ffffff'
const GLASS = '#26303a'
const B = (size: V3, pos: V3, color: string, mat?: Part['mat']): Part => ({ kind: 'box', size, pos, color, mat })
const wheel = (x: number, z: number, r: number, w: number): Part => ({
  kind: 'cyl',
  rTop: r,
  rBottom: r,
  h: w,
  seg: 10,
  pos: [x, r, z],
  rot: [0, 0, Math.PI / 2],
  color: '#1a1a1a',
})

const MODELS: Record<VehicleKind, Part[]> = {
  car: [
    B([1.8, 0.6, 4.2], [0, 0.6, 0], TINT),
    B([1.58, 0.5, 2.1], [0, 1.15, 0.25], GLASS),
    B([1.62, 0.08, 1.9], [0, 1.43, 0.3], TINT),
    B([1.7, 0.2, 0.06], [0, 0.45, -2.11], '#30343a'),
    ...[-0.85, 0.85].flatMap((x) => [wheel(x, -1.35, 0.32, 0.24), wheel(x, 1.35, 0.32, 0.24)]),
    B([0.34, 0.12, 0.04], [-0.6, 0.72, -2.12], '#fff6d0', 'emit'),
    B([0.34, 0.12, 0.04], [0.6, 0.72, -2.12], '#fff6d0', 'emit'),
    B([0.34, 0.12, 0.04], [-0.62, 0.75, 2.12], '#ff3030', 'emit'),
    B([0.34, 0.12, 0.04], [0.62, 0.75, 2.12], '#ff3030', 'emit'),
  ],
  bus: [
    B([2.5, 2.6, 10], [0, 1.75, 0], TINT),
    B([2.54, 0.95, 8.4], [0, 2.25, 0.4], GLASS),
    B([2.3, 1.3, 0.06], [0, 2.05, -5.02], GLASS),
    B([2.4, 0.12, 9.6], [0, 3.1, 0], '#e9e9e9'),
    ...[-1.15, 1.15].flatMap((x) => [wheel(x, -3.4, 0.5, 0.35), wheel(x, 3.4, 0.5, 0.35)]),
    B([1.6, 0.28, 0.05], [0, 2.85, -5.04], '#ffb000', 'emit'),
    B([0.4, 0.16, 0.05], [-0.9, 0.75, -5.03], '#fff6d0', 'emit'),
    B([0.4, 0.16, 0.05], [0.9, 0.75, -5.03], '#fff6d0', 'emit'),
    B([0.3, 0.3, 0.05], [-1.0, 0.9, 5.03], '#ff3030', 'emit'),
    B([0.3, 0.3, 0.05], [1.0, 0.9, 5.03], '#ff3030', 'emit'),
  ],
  moto: [
    wheel(0, -0.65, 0.28, 0.1),
    wheel(0, 0.65, 0.28, 0.1),
    B([0.3, 0.38, 1.05], [0, 0.58, 0], TINT),
    B([0.28, 0.1, 0.6], [0, 0.82, 0.2], '#202226'),
    B([0.34, 0.5, 0.26], [0, 0.98, 0.12], '#3a3f4a'),
    B([0.4, 0.55, 0.28], [0, 1.42, 0.12], TINT),
    B([0.46, 0.1, 0.5], [0, 1.38, -0.22], TINT),
    { kind: 'ico', r: 0.16, pos: [0, 1.84, 0.1], color: '#d8d8d8' },
    B([0.12, 0.1, 0.04], [0, 0.85, -0.6], '#fff6d0', 'emit'),
    B([0.16, 0.08, 0.04], [0, 0.7, 0.55], '#ff3030', 'emit'),
  ],
}

const PALETTE: Record<VehicleKind, string[]> = {
  car: ['#c0392b', '#ecf0f1', '#2c3e50', '#95a5a6', '#2980b9'],
  bus: ['#2e9e5b', '#f2b705'],
  moto: ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c', '#ecf0f1', '#34495e'],
}

const dummy = new Object3D()

function Fleet({ kind }: { kind: VehicleKind }) {
  // Thứ tự xe trong mảng traffic không đổi, nên chỉ cần nhớ vị trí các xe thuộc loại này.
  const slots = useMemo(() => newTraffic().flatMap((v, i) => (v.kind === kind ? [i] : [])), [kind])
  const meshes = useMemo(() => [...groupParts(MODELS[kind])].map(([mat, list]) => ({ mat, geom: mergeParts(list) })), [kind])
  const refs = useRef<(InstancedMesh | null)[]>([])
  useEffect(() => () => meshes.forEach((m) => m.geom.dispose()), [meshes])

  useEffect(() => {
    const c = new Color()
    refs.current.forEach((m, k) => {
      if (!m || meshes[k].mat === 'emit') return
      slots.forEach((_, j) => m.setColorAt(j, c.set(PALETTE[kind][j % PALETTE[kind].length])))
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    })
  }, [kind, meshes, slots])

  useFrame(() => {
    const traffic = useRide.getState().traffic
    slots.forEach((i, j) => {
      const v = traffic[i]
      if (!v) return
      const p = poseOf(v)
      dummy.position.set(p.x, 0, p.z)
      dummy.rotation.set(0, p.heading, 0)
      dummy.updateMatrix()
      refs.current.forEach((m) => m?.setMatrixAt(j, dummy.matrix))
    })
    refs.current.forEach((m) => m && (m.instanceMatrix.needsUpdate = true))
  })

  return (
    <>
      {meshes.map((m, k) => (
        <instancedMesh
          key={m.mat}
          ref={(el) => {
            refs.current[k] = el
          }}
          args={[m.geom, MATERIALS[m.mat], slots.length]}
          frustumCulled={false}
        />
      ))}
    </>
  )
}

// Đèn giao thông: 3 bóng trên mỗi mặt của hộp đèn ở góc giao lộ; mặt ±x cho xe chạy dọc trục x, ±z cho trục z.
const LAMP_Y = [4.15, 3.9, 3.65]
const LIT: Record<string, string> = { red: '#ff2d2d', yellow: '#ffc21a', green: '#2dff6a' }
const COLOR_AT = ['red', 'yellow', 'green']
const FACES: { axis: 'x' | 'z'; dx: number; dz: number }[] = [
  { axis: 'x', dx: -0.27, dz: 0 },
  { axis: 'x', dx: 0.27, dz: 0 },
  { axis: 'z', dx: 0, dz: -0.22 },
  { axis: 'z', dx: 0, dz: 0.22 },
]
const lampGeom = new BoxGeometry(1, 1, 1)
const lampMat = new MeshBasicMaterial({ color: '#ffffff' })

function TrafficLamps() {
  const ref = useRef<InstancedMesh>(null)
  const count = LIGHTS.length * FACES.length * LAMP_Y.length
  useEffect(() => {
    const m = ref.current
    if (!m) return
    let n = 0
    for (const l of LIGHTS) {
      const x = l.x + ROAD_HALF + 1
      const z = l.z + ROAD_HALF + 1
      for (const f of FACES) {
        for (const y of LAMP_Y) {
          dummy.position.set(x + f.dx, y, z + f.dz)
          dummy.rotation.set(0, 0, 0)
          dummy.scale.set(f.axis === 'x' ? 0.03 : 0.2, 0.2, f.axis === 'x' ? 0.2 : 0.03)
          dummy.updateMatrix()
          m.setMatrixAt(n++, dummy.matrix)
        }
      }
    }
    dummy.scale.set(1, 1, 1)
    m.instanceMatrix.needsUpdate = true
  }, [])

  const dim = useMemo(() => new Color('#2b2b2b'), [])
  const c = useMemo(() => new Color(), [])
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const t = useRide.getState().time
    let n = 0
    LIGHTS.forEach((_, i) => {
      for (const f of FACES) {
        const state = lightState(i, t, f.axis)
        COLOR_AT.forEach((name) => m.setColorAt(n++, state === name ? c.set(LIT[name]) : dim))
      }
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[lampGeom, lampMat, count]} frustumCulled={false} />
}

export function Traffic() {
  return (
    <>
      <Fleet kind="car" />
      <Fleet kind="bus" />
      <Fleet kind="moto" />
      <TrafficLamps />
    </>
  )
}
