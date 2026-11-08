import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { COLLIDERS, SPAWN, ceilingAt } from '../room/layout'
import { dynamicColliders, nowSeconds, useWorld } from '../room/world'
import { useGame } from '../store'
import { player } from '../story/interact'
import { itemById } from '../story/outfit'
import { useStory } from '../story/store'
import { useDraft } from '../story/wardrobeDraft'
import { Character, type Motion } from './Character'
import { cameraDistance, resolveCircleBoxes } from './collision'
import { input, keys } from './input'
import { clampDelta, moveVector } from './movement'
import { poseFor, type Pose } from './pose'

const RADIUS = 0.25
const SPEED = 2.2
const SPRINT = 1.65
const CAM_DIST = 2.0
const LOOK_HEIGHT = 1.1
const PITCH_MIN = 0.15
const PITCH_MAX = 1.1
const MOUSE_SENS = 0.005
const TURN_RATE = 12

// Thử đồ: Anh đứng trước tủ đang mở, quay mặt ra phía camera; camera lệch để chừa chỗ cho bảng bên phải.
const DRESS_SPOT = { x: 1.05, z: 5.0, facing: -Math.PI / 2 }
const WARDROBE_CAM: [number, number, number] = [2.75, 1.05, 5.0]
const WARDROBE_LOOK: [number, number, number] = [0.9, 0.85, 4.5]

// Động tác cần đứng đúng chỗ: đu xà dưới xà, tắm dưới vòi sen, soi gương trước gương, nằm trên giường.
const SNAP: Partial<Record<Pose, { x: number; z: number; facing: number; after?: { x: number; z: number } }>> = {
  pullup: { x: 2.45, z: 1.675, facing: 0 },
  bathe: { x: 3.78, z: 1.12, facing: Math.PI },
  flex: { x: 5.15, z: 3.95, facing: -Math.PI / 2 },
  lie: { x: 3.9, z: 5.3, facing: -Math.PI / 2, after: { x: 3.0, z: 5.3 } },
}

// Ghế ở bàn của Anh: ngồi quay về phía bàn (bắc); đứng dậy thì ra sau ghế.
const CHAIR = { x: 4.6, z: 2.8 }
const STAND_Z = 3.35

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Đưa góc về khoảng (-π, π] để nhân vật quay theo đường ngắn nhất.
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export function Player() {
  const body = useRef<Group>(null)
  const state = useRef({ x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw, pitch: 0.45, facing: SPAWN.yaw })
  const gl = useThree((s) => s.gl)
  const worn = useStory((st) => st.s.outfit)
  const trying = useDraft((d) => d.draft)
  const dressing = useStory((st) => st.s.overlay === 'wardrobe')
  // Đang thử đồ thì mặc luôn bộ đang thử.
  const outfit = dressing ? trying : worn
  const seed = useStory((st) => st.s.seed)

  // Lượt chơi mới: Anh về chỗ cạnh giường, camera quay về hướng cửa.
  useEffect(() => {
    state.current = { x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw, pitch: 0.45, facing: SPAWN.yaw }
    wasSitting.current = false
  }, [seed])
  const motion = useRef<Motion>({ speed: 0 })
  // 0 = camera theo Anh, 1 = camera đứng trước tủ quần áo đang mở.
  const wardrobeCam = useRef(0)
  const wasSitting = useRef(false)
  const lastSnap = useRef<(typeof SNAP)[Pose] | null>(null)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.down(e.code)
    const onUp = (e: KeyboardEvent) => keys.up(e.code)
    const onBlur = () => keys.clear()
    const onVisibility = () => document.hidden && keys.clear()
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Chuột: giữ nút trái và kéo để xoay camera. Cảm ứng do TouchControls xử lý.
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      dragging = true
      el.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      input.look.dx += e.movementX * MOUSE_SENS
      input.look.dy += e.movementY * MOUSE_SENS
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  useFrame(({ camera }, rawDt) => {
    const s = state.current
    const st = useStory.getState().s
    // Chỉ đi lại được trong phòng và khi không mở bảng nào (báo thức, mini-game, tủ đồ, điện thoại…).
    const paused = useGame.getState().paused || st.phase !== 'room' || st.overlay !== null
    const world = useWorld.getState()
    motion.current.pose = poseFor({ overlay: st.overlay, sitting: world.sitting, transient: world.transient, now: nowSeconds() })

    motion.current.speed = 0
    if (paused) {
      input.look.dx = 0
      input.look.dy = 0
    } else {
      const dt = clampDelta(rawDt)
      s.yaw -= input.look.dx
      s.pitch = clamp(s.pitch + input.look.dy, PITCH_MIN, PITCH_MAX)
      input.look.dx = 0
      input.look.dy = 0

      const k = keys.vector()
      const v = moveVector(k.x || k.y ? k : input.move, s.yaw)
      const busyPose = SNAP[motion.current.pose ?? 'none'] !== undefined
      const speed = world.sitting || busyPose ? 0 : Math.hypot(v.x, v.z)
      if (world.sitting) {
        s.x = CHAIR.x
        s.z = CHAIR.z
        s.facing = 0
        wasSitting.current = true
      } else if (wasSitting.current) {
        s.x = CHAIR.x
        s.z = STAND_Z
        wasSitting.current = false
      }
      if (speed > 0.01) {
        const run = keys.sprinting() || input.sprint ? SPRINT : 1
        motion.current.speed = speed * run
        const step = SPEED * run * dt
        const next = resolveCircleBoxes({ x: s.x + v.x * step, z: s.z + v.z * step }, RADIUS, [...COLLIDERS, ...dynamicColliders()])
        s.x = next.x
        s.z = next.z
        const target = Math.atan2(-v.x, -v.z)
        s.facing += wrapAngle(target - s.facing) * Math.min(1, TURN_RATE * dt)
      }
    }

    // Đánh răng, rửa mặt: quay mặt vào lavabo.
    if (st.overlay === 'brush' || st.overlay === 'wash') s.facing = 0
    // Động tác cần đứng đúng chỗ; xong (ví dụ nằm giường) thì bước ra chỗ an toàn.
    const snap = SNAP[motion.current.pose ?? 'none']
    if (snap) {
      s.x = snap.x
      s.z = snap.z
      s.facing = snap.facing
      lastSnap.current = snap
    } else if (lastSnap.current) {
      if (lastSnap.current.after) {
        s.x = lastSnap.current.after.x
        s.z = lastSnap.current.after.z
      }
      lastSnap.current = null
    }
    player.x = s.x
    player.z = s.z
    body.current?.position.set(s.x, 0, s.z)
    if (body.current) body.current.rotation.y = s.facing

    const toWardrobe = st.overlay === 'wardrobe' ? 1 : 0
    wardrobeCam.current += (toWardrobe - wardrobeCam.current) * Math.min(1, rawDt * 4)
    const wc = wardrobeCam.current
    if (toWardrobe) {
      s.x = DRESS_SPOT.x
      s.z = DRESS_SPOT.z
      s.facing = DRESS_SPOT.facing
      body.current?.position.set(s.x, 0, s.z)
      if (body.current) body.current.rotation.y = s.facing
    }

    const cp = Math.cos(s.pitch)
    const back: [number, number, number] = [Math.sin(s.yaw) * cp, Math.sin(s.pitch), Math.cos(s.yaw) * cp]
    const origin: [number, number, number] = [s.x, LOOK_HEIGHT, s.z]
    const dist = cameraDistance(origin, back, CAM_DIST, COLLIDERS, ceilingAt(s.x, s.z))
    const fx = s.x + back[0] * dist
    const fy = LOOK_HEIGHT + back[1] * dist
    const fz = s.z + back[2] * dist
    const mix = (a: number, b: number) => a + (b - a) * wc
    camera.position.set(mix(fx, WARDROBE_CAM[0]), mix(fy, WARDROBE_CAM[1]), mix(fz, WARDROBE_CAM[2]))
    camera.lookAt(mix(s.x, WARDROBE_LOOK[0]), mix(LOOK_HEIGHT, WARDROBE_LOOK[1]), mix(s.z, WARDROBE_LOOK[2]))
  })

  return (
    <group ref={body}>
      <Character
        top={itemById(outfit.top).color}
        bottom={itemById(outfit.bottom).color}
        shoes={itemById(outfit.shoes).color}
        motion={motion}
      />
    </group>
  )
}
