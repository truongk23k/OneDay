import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { COLLIDERS, SPAWN, ceilingAt } from '../room/layout'
import { useGame } from '../store'
import { player } from '../story/interact'
import { itemById } from '../story/outfit'
import { useStory } from '../story/store'
import { Character } from './Character'
import { cameraDistance, resolveCircleBoxes } from './collision'
import { input, keys } from './input'
import { clampDelta, moveVector } from './movement'

const RADIUS = 0.25
const SPEED = 2.2
const CAM_DIST = 2.0
const LOOK_HEIGHT = 1.1
const PITCH_MIN = 0.15
const PITCH_MAX = 1.1
const MOUSE_SENS = 0.005
const TURN_RATE = 12

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Đưa góc về khoảng (-π, π] để nhân vật quay theo đường ngắn nhất.
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export function Player() {
  const body = useRef<Group>(null)
  const state = useRef({ x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw, pitch: 0.45, facing: SPAWN.yaw })
  const gl = useThree((s) => s.gl)
  const outfit = useStory((st) => st.s.outfit)

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
      const speed = Math.hypot(v.x, v.z)
      if (speed > 0.01) {
        const next = resolveCircleBoxes({ x: s.x + v.x * SPEED * dt, z: s.z + v.z * SPEED * dt }, RADIUS, COLLIDERS)
        s.x = next.x
        s.z = next.z
        const target = Math.atan2(-v.x, -v.z)
        s.facing += wrapAngle(target - s.facing) * Math.min(1, TURN_RATE * dt)
      }
    }

    player.x = s.x
    player.z = s.z
    body.current?.position.set(s.x, 0, s.z)
    if (body.current) body.current.rotation.y = s.facing

    const cp = Math.cos(s.pitch)
    const back: [number, number, number] = [Math.sin(s.yaw) * cp, Math.sin(s.pitch), Math.cos(s.yaw) * cp]
    const origin: [number, number, number] = [s.x, LOOK_HEIGHT, s.z]
    const dist = cameraDistance(origin, back, CAM_DIST, COLLIDERS, ceilingAt(s.x, s.z))
    camera.position.set(s.x + back[0] * dist, LOOK_HEIGHT + back[1] * dist, s.z + back[2] * dist)
    camera.lookAt(s.x, LOOK_HEIGHT, s.z)
  })

  return (
    <group ref={body}>
      <Character
        top={itemById(outfit.top).color}
        bottom={itemById(outfit.bottom).color}
        shoes={itemById(outfit.shoes).color}
      />
    </group>
  )
}
