import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, PerspectiveCamera } from 'three'
import { useKeys } from '../player/useKeys'
import { Batched } from '../room/Batched'
import type { Stage } from '../story/state'
import { useStory } from '../story/store'
import { EmWalker, Riders, Scooter } from './Bike3D'
import { ChaseCar, Checkpoint } from './Police3D'
import { BEACONS } from './city'
import { buildCityParts } from './cityParts'
import { Rain } from './Rain'
import { targetFor } from './rules'
import { BIKE } from './bike'
import { readInput, stepRide, useRide } from './store'
import { Traffic } from './Traffic3D'

// Trục bánh sau của xe (đầu xe hướng -z).
const REAR_AXLE = 0.62
const CAM_BACK = 5.2
const CAM_UP = 2.3

const BEACON_FOR: Partial<Record<Stage, keyof typeof BEACONS>> = { toEm: 'emHouse', withEm: 'emOffice', sprint: 'anhOffice' }

// Trái tim (nhà Em) hoặc ghim vàng (văn phòng) lơ lửng trên nóc nơi cần tới, nhìn thấy từ xa.
function Beacon({ stage }: { stage: Stage }) {
  const ref = useRef<Group>(null)
  const key = BEACON_FOR[stage]
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g || !key) return
    const { far, near } = BEACONS[key]
    const bike = useRide.getState().bike
    // Xa thì trên nóc cho dễ thấy, lại gần (dưới 25 m) thì hạ xuống ngay trên cửa để không ra khỏi khung hình.
    const k = Math.min(1, Math.max(0, (Math.hypot(bike.x - near.x, bike.z - near.z) - 25) / 60))
    const bob = Math.sin(clock.elapsedTime * 2) * (0.25 + 0.35 * k)
    g.position.set(near.x + (far.x - near.x) * k, near.y + (far.y - near.y) * k + bob, near.z + (far.z - near.z) * k)
    g.scale.setScalar(0.55 + 0.45 * k)
    g.rotation.y = clock.elapsedTime * 0.9
  })
  if (!key) return null
  const b = BEACONS[key].far
  return (
    <group ref={ref} position={[b.x, b.y, b.z]}>
      {key === 'emHouse' ? (
        <>
          <mesh position={[-0.75, 0.55, 0]}>
            <icosahedronGeometry args={[0.95, 1]} />
            <meshBasicMaterial color="#ff3d7f" />
          </mesh>
          <mesh position={[0.75, 0.55, 0]}>
            <icosahedronGeometry args={[0.95, 1]} />
            <meshBasicMaterial color="#ff3d7f" />
          </mesh>
          <mesh position={[0, -0.25, 0]} rotation-z={Math.PI / 4}>
            <boxGeometry args={[1.5, 1.5, 0.9]} />
            <meshBasicMaterial color="#ff3d7f" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.3, 0]}>
            <icosahedronGeometry args={[1.3, 1]} />
            <meshBasicMaterial color="#ffd23f" />
          </mesh>
          <mesh position={[0, -0.6, 0]} rotation-x={Math.PI}>
            <coneGeometry args={[1.05, 2.6, 12]} />
            <meshBasicMaterial color="#ffd23f" />
          </mesh>
        </>
      )}
    </group>
  )
}

// Vòng sáng sát mép đường trước cửa nơi cần tới (dừng hẳn trong vòng này).
function TargetMarker() {
  const stage = useStory((st) => st.s.stage)
  const ring = useRef<Group>(null)
  const t = targetFor(stage)
  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08)
  })
  return (
    <>
      <Beacon stage={stage} />
      {t && (
        <group position={[t.x, 0.05, t.z]}>
          <group ref={ring}>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[2.0, 2.5, 40]} />
              <meshBasicMaterial color="#ffd23f" transparent opacity={0.85} />
            </mesh>
          </group>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 8, 12, 1, true]} />
            <meshBasicMaterial color="#ffd23f" transparent opacity={0.16} depthWrite={false} side={2} />
          </mesh>
        </group>
      )}
    </>
  )
}

// Màn 3–5: khu phố, xe AB đen, Em, camera bám sau xe.
export default function StreetScene() {
  const city = useMemo(() => buildCityParts(), [])
  const stage = useStory((st) => st.s.stage)
  const outfit = useStory((st) => st.s.outfit)
  const helmets = useStory((st) => st.s.tasks.helmets)
  const weather = useStory((st) => st.s.weather)
  const bikeRef = useRef<Group>(null)
  const pivotRef = useRef<Group>(null)
  const lean = useRef(0)
  const orbit = useRef(0)
  const placed = useRef(false)
  const camera = useThree((st) => st.camera) as PerspectiveCamera
  useKeys()

  // Ngoài phố cần nhìn xa hơn trong phòng; trả lại như cũ khi về phòng (chơi lại).
  useEffect(() => {
    const { near, far, fov } = camera
    camera.near = 0.1
    camera.far = 260
    camera.updateProjectionMatrix()
    return () => {
      Object.assign(camera, { near, far, fov })
      camera.updateProjectionMatrix()
    }
  }, [camera])

  useFrame(({ camera, clock }, dt) => {
    stepRide(Math.min(dt, 0.05), clock.elapsedTime)
    const b = useRide.getState().bike
    // Nghiêng nhẹ khi ôm cua (rẽ phải thì nghiêng phải), càng nhanh nghiêng càng nhiều.
    const want = -readInput().steer * Math.min(1, Math.abs(b.speed) / BIKE.maxSpeed) * 0.22
    lean.current += (want - lean.current) * Math.min(1, dt * 6)
    if (bikeRef.current) {
      bikeRef.current.position.set(b.x, 0, b.z)
      bikeRef.current.rotation.y = b.heading
      bikeRef.current.rotation.z = lean.current
    }
    if (pivotRef.current) pivotRef.current.rotation.x = b.pitch
    // Lúc bốc đầu camera lượn chéo sang bên và hạ thấp để thấy rõ bánh trước nhấc lên.
    const lift = b.pitch / BIKE.wheelieMax
    orbit.current += (lift * 0.75 - orbit.current) * Math.min(1, dt * 3)
    const fx = -Math.sin(b.heading + orbit.current)
    const fz = -Math.cos(b.heading + orbit.current)
    // Lần đầu vào phố: đặt camera ngay sau xe thay vì bay từ trong phòng ra.
    const k = placed.current ? Math.min(1, dt * 4) : 1
    placed.current = true
    camera.position.x += (b.x - fx * CAM_BACK - camera.position.x) * k
    camera.position.y += (CAM_UP - orbit.current * 0.8 - camera.position.y) * k
    camera.position.z += (b.z - fz * CAM_BACK - camera.position.z) * k
    // Nhìn hơi xa và cao hơn tay lái: bầu trời và biểu tượng nơi cần tới nằm dưới ô đồng hồ.
    camera.lookAt(b.x + fx * 6, 1.5, b.z + fz * 6)
    const cam = camera as PerspectiveCamera
    const fov = 70 + Math.min(12, Math.abs(b.speed) * 0.9)
    if (Math.abs(cam.fov - fov) > 0.1) {
      cam.fov += (fov - cam.fov) * k
      cam.updateProjectionMatrix()
    }
  })

  const sky = weather === 'rain' ? '#9aa6b2' : '#bfe3ff'
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 60, 220]} />
      <hemisphereLight args={['#fffaf0', '#7c7466', weather === 'rain' ? 1.0 : 1.3]} />
      <directionalLight position={[60, 120, 40]} intensity={weather === 'rain' ? 0.6 : 1.2} color="#fff4e0" />
      <Batched parts={city} />
      <Traffic />
      {weather === 'rain' && <Rain />}
      <TargetMarker />
      <Checkpoint />
      <ChaseCar />
      {stage === 'toEm' && <EmWalker />}
      <group ref={bikeRef}>
        {/* Bốc đầu: xoay quanh trục bánh sau. */}
        <group ref={pivotRef} position={[0, 0, REAR_AXLE]}>
          <group position={[0, 0, -REAR_AXLE]}>
            <Scooter />
            <Riders outfit={outfit} helmetsTaken={helmets} emAboard={stage === 'withEm'} />
          </group>
        </group>
      </group>
    </>
  )
}
