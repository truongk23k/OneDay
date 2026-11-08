import { create } from 'zustand'
import { keys } from '../player/input'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { newBike, stepBike, type BikeInput, type BikeState } from './bike'
import { LIGHTS, MARKERS, POTHOLES, ROAD_HALF, STREET_COLLIDERS } from './city'
import { arrivedAt } from './rules'
import { axisOf, lightState, newTraffic, stepTraffic, vehicleBox, type Vehicle } from './traffic'

// Nút ga/phanh/rẽ trên điện thoại ghi vào đây; bàn phím đọc từ keys (W/S/A/D, mũi tên).
export const rideInput: BikeInput = { throttle: 0, brake: 0, steer: 0 }

const POTHOLE_RADIUS = 1.1
const POTHOLE_SPEED = 6
const CRASH_COOLDOWN = 1.5
// Lao vào giao lộ nhanh hơn mức này lúc đèn đỏ thì tính là vượt đèn.
const RED_LIGHT_SPEED = 2

type Ride = {
  bike: BikeState
  traffic: Vehicle[]
  // Đồng hồ của chuyến xe (giây, dừng khi tạm dừng) — nhịp đèn giao thông theo đồng hồ này.
  time: number
  // Ổ gà / giao lộ vừa đi qua (để không tính hai lần) và lúc đâm gần nhất (giây).
  lastPothole: number
  lastLight: number
  lastCrash: number
  reset: () => void
}

const start = () => newBike(MARKERS.home.x, MARKERS.home.z, MARKERS.home.heading)

const fresh = () => ({ bike: start(), traffic: newTraffic(), time: 0, lastPothole: -1, lastLight: -1, lastCrash: -Infinity })

export const useRide = create<Ride>()((set) => ({
  ...fresh(),
  reset: () => set(fresh()),
}))

export function readInput(): BikeInput {
  const k = keys.vector()
  return {
    throttle: Math.max(k.y > 0 ? 1 : 0, rideInput.throttle),
    brake: Math.max(k.y < 0 ? 1 : 0, rideInput.brake),
    steer: Math.max(-1, Math.min(1, k.x + rideInput.steer)),
  }
}

// Một bước của chuyến xe: lái, va chạm, ổ gà, tới điểm hẹn. now: giây thật (để giãn cách va chạm).
export function stepRide(dt: number, now: number) {
  if (useGame.getState().paused) return
  const story = useStory.getState()
  const s = story.s
  if (s.phase !== 'street' || s.stage === 'done') return
  const ride = useRide.getState()
  const time = ride.time + dt
  const traffic = stepTraffic(ride.traffic, dt, time, ride.bike)
  const colliders = traffic.length ? [...STREET_COLLIDERS, ...traffic.map(vehicleBox)] : STREET_COLLIDERS
  const { state, events } = stepBike(ride.bike, readInput(), dt, colliders)
  let { lastPothole, lastCrash } = ride

  for (const e of events) {
    if (e.kind === 'crash') {
      if (now - lastCrash > CRASH_COOLDOWN) story.dispatch({ type: 'rideEvent', kind: 'crash' })
      lastCrash = now
    } else story.dispatch({ type: 'rideEvent', kind: 'hardBrake' })
  }

  const hole = POTHOLES.findIndex((p) => Math.hypot(p.x - state.x, p.z - state.z) < POTHOLE_RADIUS)
  if (hole >= 0 && hole !== lastPothole && Math.abs(state.speed) > POTHOLE_SPEED) {
    story.dispatch({ type: 'rideEvent', kind: 'pothole' })
    lastPothole = hole
  } else if (hole < 0) lastPothole = -1

  // Vượt đèn đỏ: lúc vừa lao vào giao lộ mà đèn theo hướng đi đang đỏ.
  const light = LIGHTS.findIndex((l) => Math.abs(l.x - state.x) < ROAD_HALF && Math.abs(l.z - state.z) < ROAD_HALF)
  if (light >= 0 && light !== ride.lastLight && Math.abs(state.speed) > RED_LIGHT_SPEED) {
    const axis = axisOf(-Math.sin(state.heading), -Math.cos(state.heading))
    if (lightState(light, time, axis) === 'red') story.dispatch({ type: 'rideEvent', kind: 'redLight' })
  }

  useRide.setState({ bike: state, traffic, time, lastPothole, lastLight: light, lastCrash })

  const arrival = arrivedAt(useStory.getState().s.stage, state)
  if (arrival) story.dispatch({ type: arrival })
}
