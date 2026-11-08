import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, PerspectiveCamera } from 'three'
import type { Motion } from '../player/Character'
import { useKeys } from '../player/useKeys'
import { Batched } from '../room/Batched'
import { useStory } from '../story/store'
import { EmWaiting, Riders, Scooter } from './Bike3D'
import { MARKERS } from './city'
import { buildCityParts } from './cityParts'
import { Rain } from './Rain'
import { targetFor } from './rules'
import { BIKE } from './bike'
import { readInput, stepRide, useRide } from './store'
import { Traffic } from './Traffic3D'

const CAM_BACK = 5.2
const CAM_UP = 2.3

// Vòng sáng + cột sáng đánh dấu điểm cần tới.
function TargetMarker() {
  const stage = useStory((st) => st.s.stage)
  const ring = useRef<Group>(null)
  const t = targetFor(stage)
  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08)
  })
  if (!t) return null
  return (
    <group position={[t.x, 0.05, t.z]}>
      <group ref={ring}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[3.2, 3.8, 40]} />
          <meshBasicMaterial color="#ffd23f" transparent opacity={0.85} />
        </mesh>
      </group>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 12, 12, 1, true]} />
        <meshBasicMaterial color="#ffd23f" transparent opacity={0.18} depthWrite={false} side={2} />
      </mesh>
    </group>
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
  const emWait = useRef<Motion>({ speed: 0, pose: 'none' })
  const lean = useRef(0)
  const placed = useRef(false)
  const camera = useThree((st) => st.camera) as PerspectiveCamera
  useKeys()

  // Ngoài phố cần nhìn xa hơn trong phòng; trả lại như cũ khi về phòng (chơi lại).
  useEffect(() => {
    useRide.getState().reset()
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
    const fx = -Math.sin(b.heading)
    const fz = -Math.cos(b.heading)
    // Lần đầu vào phố: đặt camera ngay sau xe thay vì bay từ trong phòng ra.
    const k = placed.current ? Math.min(1, dt * 4) : 1
    placed.current = true
    camera.position.x += (b.x - fx * CAM_BACK - camera.position.x) * k
    camera.position.y += (CAM_UP - camera.position.y) * k
    camera.position.z += (b.z - fz * CAM_BACK - camera.position.z) * k
    camera.lookAt(b.x + fx * 3, 0.9, b.z + fz * 3)
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
      {stage === 'toEm' && <EmWaiting position={[MARKERS.emHouse.x, 0.12, MARKERS.emHouse.z + 5.6]} facing={0} motion={emWait} />}
      <group ref={bikeRef}>
        <Scooter />
        <Riders outfit={outfit} helmetsTaken={helmets} emAboard={stage === 'withEm'} />
      </group>
    </>
  )
}
