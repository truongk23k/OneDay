import { Bike, Check, ChevronLeft, ChevronRight, ChevronsUp, Heart, Megaphone, MapPin, Navigation2, OctagonX, Siren } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { LIGHTS, ROAD_HALF } from '../ride/city'
import { nextTurn, routeTo, type Pt, type Route } from '../ride/nav'
import { CHECKPOINT, helmetsShort } from '../ride/police'
import { STOP_RADIUS, targetFor } from '../ride/rules'
import { rideInput, useRide } from '../ride/store'
import { axisOf, lightState, type LightColor } from '../ride/traffic'
import type { BikeState } from '../ride/bike'
import { playCue } from '../audio/sounds'
import { FINES, type PoliceReason, type Stage } from '../story/state'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { S } from '../strings'
import { QuestGlyph } from './GameIcons'
import { Clock } from './Hud'
import { PhoneButton } from './Phone'
import { money } from './phone/apps'
import { openPhone, usePhone } from './phone/phoneStore'
import { RideMap } from './RideMap'

type Pedal = 'left' | 'right' | 'gas' | 'brake' | 'wheelie'

function clearRideInput() {
  rideInput.throttle = 0
  rideInput.brake = 0
  rideInput.steer = 0
  rideInput.wheelie = 0
}

// Nút lái trên điện thoại: mỗi nút tự giữ ngón của nó, nên ga + rẽ cùng lúc được.
function Pedals() {
  const held = useRef(new Set<Pedal>())
  const apply = () => {
    const h = held.current
    rideInput.throttle = h.has('gas') ? 1 : 0
    rideInput.brake = h.has('brake') ? 1 : 0
    rideInput.steer = (h.has('right') ? 1 : 0) - (h.has('left') ? 1 : 0)
    rideInput.wheelie = h.has('wheelie') ? 1 : 0
  }
  useEffect(() => clearRideInput, [])

  const pedal = (id: Pedal, label: string, children: ReactNode, className: string) => ({
    'aria-label': label,
    className: `pedal ${className}`,
    children,
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
      <button className="pedal horn" aria-label={S.ride.horn} onPointerDown={() => playCue('horn')}>
        <Megaphone aria-hidden />
        <span>{S.ride.horn}</span>
      </button>
      <div className="ride-steer">
        <button {...pedal('left', S.ride.left, <ChevronLeft aria-hidden />, 'steer')} />
        <button {...pedal('right', S.ride.right, <ChevronRight aria-hidden />, 'steer')} />
      </div>
      <div className="ride-feet">
        <button
          {...pedal(
            'brake',
            S.ride.brake,
            <>
              <OctagonX aria-hidden />
              <span>{S.ride.brake}</span>
            </>,
            'brake',
          )}
        />
        <div className="ride-gas-stack">
          <button
            {...pedal(
              'wheelie',
              S.ride.wheelie,
              <>
                <Bike aria-hidden className="tilt" />
                <span>{S.ride.wheelie}</span>
              </>,
              'wheelie',
            )}
          />
          <button
            {...pedal(
              'gas',
              S.ride.gas,
              <>
                <ChevronsUp aria-hidden />
                <span>{S.ride.gas}</span>
              </>,
              'gas',
            )}
          />
        </div>
      </div>
    </>
  )
}

type Nav = {
  kmh: number
  dist: number
  turn: number
  light: LightColor | null
  route: Route | null
  bike: BikeState
  police: Pt | null
  gap: number
  pulled: boolean
  reason: PoliceReason | null
  nearCheck: boolean
}

const LIGHT_WARN = 40
const CHECK_WARN = 70

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
  const { bike: b, time, police: p, pulloverUntil } = useRide.getState()
  const t = targetFor(stage)
  const kmh = Math.round(Math.abs(b.speed) * 3.6)
  const light = lightAhead(b, time)
  const chasing = p.mode === 'chase'
  const police = {
    police: chasing ? { x: p.x, z: p.z } : null,
    gap: chasing ? Math.round(Math.hypot(p.x - b.x, p.z - b.z)) : 0,
    pulled: time < pulloverUntil,
    reason: p.reason,
    nearCheck: Math.hypot(CHECKPOINT.x - b.x, CHECKPOINT.z - b.z) < CHECK_WARN,
  }
  if (!t) return { kmh, dist: 0, turn: 0, light, route: null, bike: b, ...police }
  const route = routeTo(b, t)
  const next = nextTurn(route)
  let rel = Math.atan2(-(next.x - b.x), -(next.z - b.z)) - b.heading
  rel = Math.atan2(Math.sin(rel), Math.cos(rel))
  return { kmh, dist: Math.round(route.length), turn: -rel, light, route, bike: b, ...police }
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
  const paused = useGame((g) => g.paused)
  const dispatch = useStory((st) => st.dispatch)
  // Tạm dừng thì câu thoại đứng lại, không tự tắt.
  useEffect(() => {
    if (!line || paused) return
    const timer = setTimeout(() => dispatch({ type: 'clearLine' }), 2800)
    return () => clearTimeout(timer)
  }, [line, paused, dispatch])
  if (!line) return null
  return <div className="toast">{line}</div>
}

const MISSION_ORDER: Stage[] = ['toEm', 'withEm', 'sprint']
const MISSIONS = [
  { stage: 'toEm', label: S.ride.missions.pickup, due: null },
  { stage: 'withEm', label: S.ride.missions.dropoff, due: '8:25' },
  { stage: 'sprint', label: S.ride.missions.arrive, due: '8:30' },
] as const

// Ba nhiệm vụ của chuyến xe (bảng quest): đánh số, xong thì tích xanh, đang làm sáng vàng, đưa Em trễ thì đỏ.
function RideMissions({ stage }: { stage: Stage }) {
  const emDropLate = useStory((st) => st.s.emDropLate)
  const now = MISSION_ORDER.indexOf(stage)
  const doneCount = now < 0 ? MISSIONS.length : now
  return (
    <div className="hud-panel quest ride-quest">
      <div className="quest-head static">
        <QuestGlyph />
        <span className="quest-title">{S.ride.missions.title}</span>
        <span className="quest-count">
          {doneCount}/{MISSIONS.length}
        </span>
      </div>
      <div className="quest-bar" aria-hidden>
        <span style={{ width: `${(doneCount / MISSIONS.length) * 100}%` }} />
      </div>
      <ul className="ride-missions" aria-label={S.ride.missions.title}>
        {MISSIONS.map((m, i) => {
          const done = now < 0 ? true : i < now
          const late = m.stage === 'withEm' && done && emDropLate
          const cls = [done && 'done', i === now && 'current', late && 'late'].filter(Boolean).join(' ')
          return (
            <li key={m.stage} className={cls}>
              <span className="quest-dot" aria-hidden>
                {late ? '!' : done ? <Check /> : i + 1}
              </span>
              <span className="quest-text">{m.label}</span>
              {m.due && <span className="quest-due">{m.due}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Đồng hồ tốc độ hình cung.
const GAUGE_MAX = 50
function Speedo({ kmh }: { kmh: number }) {
  const k = Math.min(1, kmh / GAUGE_MAX)
  return (
    <div className="speedo" aria-label={`${kmh} ${S.ride.kmh}`}>
      <svg viewBox="0 0 100 60" aria-hidden>
        <path d="M10 55 A40 40 0 0 1 90 55" className="speedo-track" pathLength={1} />
        <path d="M10 55 A40 40 0 0 1 90 55" className="speedo-fill" pathLength={1} style={{ strokeDasharray: `${k} 1` }} />
      </svg>
      <strong>{kmh}</strong>
      <span>{S.ride.kmh}</span>
    </div>
  )
}

// CSGT: thẻ lập biên bản khi bị dừng xe (giữa màn hình).
function PoliceCard({ nav }: { nav: Nav }) {
  if (!nav.pulled || !nav.reason) return null
  return (
    <div className="police-card" role="status">
      <Siren aria-hidden className="police-icon" />
      <strong>{S.police.pulled}</strong>
      <span>{S.police.reasons[nav.reason]}</span>
      <span className="police-fine">
        {S.police.fine} {money(FINES[nav.reason])}
      </span>
    </div>
  )
}

// CSGT: dải báo đang bị đuổi, kèm khoảng cách.
function PoliceBanner({ nav }: { nav: Nav }) {
  if (!nav.police) return null
  return (
    <div className="police-banner" role="status">
      <Siren aria-hidden />
      <div>
        <strong>
          {S.police.chasing} · {nav.gap} m
        </strong>
        <small>{S.police.chaseHint}</small>
      </div>
    </div>
  )
}

// HUD Màn 3–5: giờ, điểm tới + mũi tên, nhiệm vụ, tốc độ, tim của Em, CSGT, nút lái trên điện thoại.
export function RideHud({ isTouch }: { isTouch: boolean }) {
  const phase = useStory((st) => st.s.phase)
  const stage = useStory((st) => st.s.stage)
  const mood = useStory((st) => Math.round(st.s.mood))
  const overlay = useStory((st) => st.s.overlay)
  const helmetsLow = useStory((st) => helmetsShort(st.s.stage, st.s.tasks.helmets))
  const nav = useNav(stage)
  const atEmDoor = useRide((r) => r.atEmDoor)
  const em = useRide((r) => r.em)
  const canCall = phase === 'street' && stage === 'toEm' && atEmDoor && em === 'home'
  // Máy tính: phím H bấm còi.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' && !e.repeat && useStory.getState().s.phase === 'street' && !useGame.getState().paused) playCue('horn')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Máy tính: E hoặc Space để mở điện thoại gọi Em khi đã đứng trước cửa.
  useEffect(() => {
    if (!canCall) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.code !== 'KeyE' && e.code !== 'Space') || e.repeat || useGame.getState().paused) return
      if (useStory.getState().s.overlay) return
      e.preventDefault()
      if (openPhone('call')) usePhone.getState().dial('em')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canCall])

  if (phase !== 'street' || stage === 'done') return null
  const stop = stage === 'toEm' || stage === 'withEm' || stage === 'sprint' ? stage : null
  const waitingForEm = stage === 'toEm' && em !== 'home'
  const hint = canCall
    ? `${S.phone.callAtDoor}${isTouch ? '' : ' (E)'}`
    : waitingForEm
      ? em === 'coming'
        ? S.ride.coming
        : null
      : nav.dist < 12
        ? stage === 'toEm'
          ? S.ride.stopAtEm
          : S.ride.stopHint
        : null
  const arrived = nav.dist <= STOP_RADIUS + 2
  return (
    <>
      <div className="hud-stack hud-tl">
        {stop && (
          <div className="hud-panel ride-nav">
            {arrived ? (
              <span className="ride-arrow pin" role="img" aria-label={S.ride.atStop}>
                <MapPin aria-hidden />
              </span>
            ) : (
              <span className="ride-arrow" role="img" aria-label={S.ride.direction} style={{ transform: `rotate(${nav.turn}rad)` }}>
                <Navigation2 aria-hidden />
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
        <RideMissions stage={stage} />
        {stage === 'withEm' && (
          <div className="hud-panel ride-mood" aria-label={S.end.mood}>
            <Heart aria-hidden />
            <span className="ride-mood-bar">
              <span style={{ width: `${mood}%` }} />
            </span>
          </div>
        )}
      </div>
      <div className="hud-stack hud-tc">
        <Clock />
        {nav.light && (
          <div className={`hud-panel ride-light ${nav.light}`}>
            <span className="ride-light-dot" aria-hidden />
            {S.ride.light[nav.light]}
          </div>
        )}
        {nav.nearCheck && helmetsLow && <div className="hud-panel ride-warn">{S.police.checkpointAhead}</div>}
        <PoliceBanner nav={nav} />
        <RideToast />
      </div>
      <PoliceCard nav={nav} />
      <div className="hud-tr">
        <PhoneButton pulse={canCall} />
      </div>
      {hint && <div className={canCall ? 'ride-stop-hint call' : 'ride-stop-hint'}>{hint}</div>}
      <RideMap bike={nav.bike} route={nav.route} stage={stage} police={nav.police} />
      <Speedo kmh={nav.kmh} />
      {!isTouch && <div className="ride-keys">{S.ride.keysHint}</div>}
      {isTouch && overlay === null && <Pedals />}
    </>
  )
}
