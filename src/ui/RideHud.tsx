import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { LIGHTS, ROAD_HALF } from '../ride/city'
import { nextTurn, routeTo, type Route } from '../ride/nav'
import { STOP_RADIUS, targetFor } from '../ride/rules'
import { rideInput, useRide } from '../ride/store'
import { axisOf, lightState, type LightColor } from '../ride/traffic'
import { format } from '../story/clock'
import type { BikeState } from '../ride/bike'
import type { Stage } from '../story/state'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { S } from '../strings'
import { RideMap } from './RideMap'

type Pedal = 'left' | 'right' | 'gas' | 'brake'

function clearRideInput() {
  rideInput.throttle = 0
  rideInput.brake = 0
  rideInput.steer = 0
}

// Nút lái trên điện thoại: mỗi nút tự giữ ngón của nó, nên ga + rẽ cùng lúc được.
function Pedals() {
  const held = useRef(new Set<Pedal>())
  const apply = () => {
    const h = held.current
    rideInput.throttle = h.has('gas') ? 1 : 0
    rideInput.brake = h.has('brake') ? 1 : 0
    rideInput.steer = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0)
  }
  useEffect(() => clearRideInput, [])

  const pedal = (id: Pedal, label: string, text: string, className: string) => ({
    'aria-label': label,
    className: `btn ride-pedal ${className}`,
    children: text,
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      held.current.add(id)
      apply()
    },
    onPointerUp: () => {
      held.current.delete(id)
      apply()
    },
    onPointerCancel: () => {
      held.current.delete(id)
      apply()
    },
    onLostPointerCapture: () => {
      held.current.delete(id)
      apply()
    },
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  })

  return (
    <>
      <div className="ride-steer">
        <button {...pedal('left', S.ride.left, '◀', 'steer')} />
        <button {...pedal('right', S.ride.right, '▶', 'steer')} />
      </div>
      <div className="ride-feet">
        <button {...pedal('brake', S.ride.brake, S.ride.brake, 'brake')} />
        <button {...pedal('gas', S.ride.gas, S.ride.gas, 'gas')} />
      </div>
    </>
  )
}

type Nav = { kmh: number; dist: number; turn: number; light: LightColor | null; route: Route | null; bike: BikeState }

const LIGHT_WARN = 40

// Đèn ở giao lộ sắp tới trên đường đang chạy (trong vòng 40 m), theo hướng đi của xe.
function lightAhead(b: { x: number; z: number; heading: number }, time: number): LightColor | null {
  const fx = -Math.sin(b.heading)
  const fz = -Math.cos(b.heading)
  let best = Infinity
  let color: LightColor | null = null
  LIGHTS.forEach((l, i) => {
    const rx = l.x - b.x
    const rz = l.z - b.z
    const ahead = rx * fx + rz * fz
    const side = Math.abs(rx * fz - rz * fx)
    if (ahead > ROAD_HALF && ahead < LIGHT_WARN && side < ROAD_HALF + 1 && ahead < best) {
      best = ahead
      color = lightState(i, time, axisOf(fx, fz))
    }
  })
  return color
}

// Đường đi tới điểm hẹn theo phố; mũi tên chỉ góc rẽ kế tiếp so với đầu xe (radian, dương = bên phải màn hình).
function navFor(stage: Stage): Nav {
  const { bike: b, time } = useRide.getState()
  const t = targetFor(stage)
  const kmh = Math.round(Math.abs(b.speed) * 3.6)
  const light = lightAhead(b, time)
  if (!t) return { kmh, dist: 0, turn: 0, light, route: null, bike: b }
  const route = routeTo(b, t)
  const next = nextTurn(route)
  let rel = Math.atan2(-(next.x - b.x), -(next.z - b.z)) - b.heading
  rel = Math.atan2(Math.sin(rel), Math.cos(rel))
  return { kmh, dist: Math.round(route.length), turn: -rel, light, route, bike: b }
}

function useNav(stage: Stage) {
  const [nav, setNav] = useState(() => navFor(stage))
  useEffect(() => {
    const timer = setInterval(() => setNav(navFor(stage)), 100)
    return () => clearInterval(timer)
  }, [stage])
  return nav
}

function RideToast() {
  const line = useStory((st) => st.s.line)
  const dispatch = useStory((st) => st.dispatch)
  useEffect(() => {
    if (!line) return
    const timer = setTimeout(() => dispatch({ type: 'clearLine' }), 2600)
    return () => clearTimeout(timer)
  }, [line, dispatch])
  if (!line) return null
  return <div className="toast">{line}</div>
}

// HUD Màn 3–5: giờ, điểm tới + mũi tên, tốc độ, tim của Em, nút lái trên điện thoại.
export function RideHud({ isTouch }: { isTouch: boolean }) {
  const phase = useStory((st) => st.s.phase)
  const stage = useStory((st) => st.s.stage)
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const weather = useStory((st) => st.s.weather)
  const mood = useStory((st) => Math.round(st.s.mood))
  const overlay = useStory((st) => st.s.overlay)
  const nav = useNav(stage)
  const atEmDoor = useRide((r) => r.atEmDoor)
  const em = useRide((r) => r.em)
  const canCall = phase === 'street' && stage === 'toEm' && atEmDoor && em === 'home'

  // Máy tính: E hoặc Space để gọi Em khi đã đứng trước cửa.
  useEffect(() => {
    if (!canCall) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.code !== 'KeyE' && e.code !== 'Space') || e.repeat || useGame.getState().paused) return
      e.preventDefault()
      useRide.getState().callEm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canCall])

  if (phase !== 'street' || stage === 'done') return null
  const stop = stage === 'toEm' || stage === 'withEm' || stage === 'sprint' ? stage : null
  const waitingForEm = stage === 'toEm' && em !== 'home'
  const hint = waitingForEm ? null : nav.dist < 12 && !canCall ? (stage === 'toEm' ? S.ride.stopAtEm : S.ride.stopHint) : null
  return (
    <>
      <div className="hud-clock">
        <div className="hud-time">
          {format(minute)} <span className="hud-weather">{weather === 'rain' ? '🌧️' : '☀️'}</span>
        </div>
        <div className="hud-deadlines">{S.hud.deadlines}</div>
      </div>
      {stop && (
        <div className="ride-nav">
          {nav.dist <= STOP_RADIUS + 2 ? (
            <span className="ride-arrow" aria-hidden>
              📍
            </span>
          ) : (
            <span className="ride-arrow" style={{ transform: `rotate(${nav.turn}rad)` }} aria-hidden>
              ▲
            </span>
          )}
          <div>
            <div className="ride-stop">{S.ride.stops[stop]}</div>
            <div className="ride-dist">
              {nav.dist} m · {S.ride.due[stop]}
            </div>
          </div>
        </div>
      )}
      {nav.light && (
        <div className={`ride-light ${nav.light}`}>
          <span className="ride-light-dot" aria-hidden />
          {S.ride.light[nav.light]}
        </div>
      )}
      {hint && <div className="ride-stop-hint">{hint}</div>}
      {canCall && (
        <button className="btn ride-call" onClick={() => useRide.getState().callEm()}>
          {!isTouch && <kbd>{S.hud.pressE}</kbd>}📞 {S.ride.call}
        </button>
      )}
      {em === 'ringing' && stage === 'toEm' && (
        <div className="ride-calling">
          <span className="ride-calling-icon" aria-hidden>
            📞
          </span>
          {S.ride.calling}
        </div>
      )}
      {em === 'coming' && stage === 'toEm' && <div className="ride-stop-hint">{S.ride.coming}</div>}
      <RideMap bike={nav.bike} route={nav.route} stage={stage} />
      {stage === 'withEm' && (
        <div className="ride-mood" aria-label={S.end.mood}>
          <span aria-hidden>❤️</span>
          <span className="ride-mood-bar">
            <span style={{ width: `${mood}%` }} />
          </span>
        </div>
      )}
      <div className="ride-speed">
        <strong>{nav.kmh}</strong> {S.ride.kmh}
      </div>
      {!isTouch && <div className="ride-keys">{S.ride.keysHint}</div>}
      <RideToast />
      {isTouch && overlay === null && <Pedals />}
    </>
  )
}
