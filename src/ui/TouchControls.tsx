import { useRef, useState, type PointerEvent } from 'react'
import { createTouchRouter, input, isSprintDrag, joystickVector } from '../player/input'

const JOY_RADIUS = 60
const LOOK_SENS = 0.008

type Joy = { x: number; y: number; kx: number; ky: number; sprint?: boolean }

export function TouchControls() {
  const router = useRef(createTouchRouter())
  const last = useRef(new Map<number, { x: number; y: number }>())
  // Tâm joystick giữ trong ref để input.move được ghi ngay trong sự kiện, không chờ React render.
  const origin = useRef<{ x: number; y: number } | null>(null)
  const [joy, setJoy] = useState<Joy | null>(null)

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const role = router.current.start(e.pointerId, e.clientX, window.innerWidth)
    last.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (role === 'move') {
      origin.current = { x: e.clientX, y: e.clientY }
      setJoy({ x: e.clientX, y: e.clientY, kx: 0, ky: 0 })
    }
  }

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const role = router.current.role(e.pointerId)
    const prev = last.current.get(e.pointerId)
    if (!role || !prev) return
    if (role === 'look') {
      input.look.dx += (e.clientX - prev.x) * LOOK_SENS
      input.look.dy += (e.clientY - prev.y) * LOOK_SENS
      last.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      return
    }
    const o = origin.current
    if (!o) return
    const dx = e.clientX - o.x
    const dy = e.clientY - o.y
    input.move = joystickVector(dx, dy, JOY_RADIUS)
    input.sprint = isSprintDrag(dx, dy, JOY_RADIUS)
    const len = Math.hypot(dx, dy)
    const k = len > JOY_RADIUS ? JOY_RADIUS / len : 1
    setJoy({ x: o.x, y: o.y, kx: dx * k, ky: dy * k, sprint: input.sprint })
  }

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (router.current.role(e.pointerId) === 'move') {
      origin.current = null
      input.move = { x: 0, y: 0 }
      input.sprint = false
      setJoy(null)
    }
    router.current.end(e.pointerId)
    last.current.delete(e.pointerId)
  }

  return (
    <div className="touch-layer" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {joy && (
        <div className={joy.sprint ? 'joy-base sprint' : 'joy-base'} style={{ left: joy.x - JOY_RADIUS, top: joy.y - JOY_RADIUS }}>
          <div className="joy-knob" style={{ transform: `translate(${joy.kx}px, ${joy.ky}px)` }} />
        </div>
      )}
      {!joy && <div className="joy-hint" />}
    </div>
  )
}
