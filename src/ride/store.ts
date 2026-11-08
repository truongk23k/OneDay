import { create } from 'zustand'
import { keys } from '../player/input'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { S } from '../strings'
import { newBike, stepBike, type BikeInput, type BikeState } from './bike'
import { LIGHTS, MARKERS, POTHOLES, ROAD_HALF, ROADS_Z, SIDEWALK, STREET_COLLIDERS } from './city'
import { arrivedAt, STOP_SPEED } from './rules'
import { axisOf, lightState, newTraffic, stepTraffic, vehicleBox, type Vehicle } from './traffic'

// Nút ga/phanh/rẽ trên điện thoại ghi vào đây; bàn phím đọc từ keys (W/S/A/D, mũi tên).
export const rideInput: Required<BikeInput> = { throttle: 0, brake: 0, steer: 0, wheelie: 0 }

const POTHOLE_RADIUS = 1.1
const POTHOLE_SPEED = 6
const CRASH_COOLDOWN = 1.5
// Lao vào giao lộ nhanh hơn mức này lúc đèn đỏ thì tính là vượt đèn.
const RED_LIGHT_SPEED = 2

// Đón Em: dừng trước nhà → gọi điện → chuông đổ → Em mở cửa đi ra xe → lên xe.
// Cửa nhà Em: mặt tiền phía nam con phố z = -100 (sau vỉa hè).
export const EM_DOOR = { x: MARKERS.emHouse.x, z: ROADS_Z[1] + ROAD_HALF + SIDEWALK - 0.3 }
const RING_TIME = 2.2
const WALK_SPEED = 1.6
// Xe đỗ xa cửa hơn mức này thì Em ra đứng ở mép vỉa hè chờ.
const EM_REACH = 10
const EM_KERB = { x: EM_DOOR.x, z: EM_DOOR.z - 3 }
const HOP_ON = 1
// Gọi sau 8:15 thì Em hơi dỗi.
const LATE_CALL = 495

export type EmState = 'home' | 'ringing' | 'coming' | 'aboard'

type Ride = {
  bike: BikeState
  traffic: Vehicle[]
  // Đồng hồ của chuyến xe (giây, dừng khi tạm dừng) — nhịp đèn giao thông theo đồng hồ này.
  time: number
  // Ổ gà / giao lộ vừa đi qua (để không tính hai lần) và lúc đâm gần nhất (giây).
  lastPothole: number
  lastLight: number
  lastCrash: number
  // Đang đứng trước cửa nhà Em (đã dừng hẳn), Em ở đâu, lúc gọi.
  atEmDoor: boolean
  em: EmState
  emPos: { x: number; z: number }
  emCalledAt: number
  callEm: () => boolean
  reset: () => void
}

const start = () => newBike(MARKERS.home.x, MARKERS.home.z, MARKERS.home.heading)

const fresh = () => ({
  bike: start(),
  traffic: newTraffic(),
  time: 0,
  lastPothole: -1,
  lastLight: -1,
  lastCrash: -Infinity,
  atEmDoor: false,
  em: 'home' as EmState,
  emPos: { ...EM_DOOR },
  emCalledAt: 0,
})

export const useRide = create<Ride>()((set, get) => ({
  ...fresh(),
  callEm: () => {
    const r = get()
    if (useStory.getState().s.stage !== 'toEm' || !r.atEmDoor || r.em !== 'home') return false
    set({ em: 'ringing', emCalledAt: r.time })
    return true
  },
  reset: () => set(fresh()),
}))

const towards = (from: { x: number; z: number }, to: { x: number; z: number }, step: number) => {
  const d = Math.hypot(to.x - from.x, to.z - from.z)
  if (d <= step) return { x: to.x, z: to.z }
  return { x: from.x + ((to.x - from.x) / d) * step, z: from.z + ((to.z - from.z) / d) * step }
}

// Chuông đổ → Em nghe máy, đi ra; tới sát xe đang đứng yên thì lên xe.
function stepEm(ride: Ride, bike: BikeState, time: number, dt: number) {
  const story = useStory.getState()
  if (story.s.stage !== 'toEm') return {}
  if (ride.em === 'ringing' && time - ride.emCalledAt >= RING_TIME) {
    story.dispatch({ type: 'say', line: story.s.minutes > LATE_CALL ? S.ride.callLate : S.ride.callAnswer })
    return { em: 'coming' as EmState, emPos: { ...EM_DOOR } }
  }
  if (ride.em !== 'coming') return {}
  const near = Math.hypot(bike.x - EM_DOOR.x, bike.z - EM_DOOR.z) < EM_REACH
  const emPos = towards(ride.emPos, near ? bike : EM_KERB, WALK_SPEED * dt)
  if (near && Math.hypot(bike.x - emPos.x, bike.z - emPos.z) < HOP_ON && Math.abs(bike.speed) < STOP_SPEED) {
    story.dispatch({ type: 'pickup' })
    return { em: 'aboard' as EmState, emPos }
  }
  return { emPos }
}

export function readInput(): BikeInput {
  const k = keys.vector()
  return {
    throttle: Math.max(k.y > 0 ? 1 : 0, rideInput.throttle),
    brake: Math.max(k.y < 0 ? 1 : 0, rideInput.brake),
    steer: Math.max(-1, Math.min(1, k.x + rideInput.steer)),
    wheelie: Math.max(keys.sprinting() ? 1 : 0, rideInput.wheelie),
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
  const traffic = stepTraffic(ride.traffic, dt, time, ride.bike, ride.em === 'coming' ? [ride.emPos] : [])
  const colliders = traffic.length ? [...STREET_COLLIDERS, ...traffic.map(vehicleBox)] : STREET_COLLIDERS
  const { state, events } = stepBike(ride.bike, readInput(), dt, colliders)
  let { lastPothole, lastCrash } = ride

  for (const e of events) {
    if (e.kind === 'crash') {
      if (now - lastCrash > CRASH_COOLDOWN) story.dispatch({ type: 'rideEvent', kind: 'crash' })
      lastCrash = now
    } else story.dispatch({ type: 'rideEvent', kind: e.kind })
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

  // Tới nhà Em chỉ là dừng trước cửa; Em lên xe sau khi Anh gọi (stepEm).
  const arrival = arrivedAt(useStory.getState().s.stage, state)
  useRide.setState({ bike: state, traffic, time, lastPothole, lastLight: light, lastCrash, atEmDoor: arrival === 'pickup' })
  if (arrival && arrival !== 'pickup') story.dispatch({ type: arrival })
  const em = stepEm(useRide.getState(), state, time, dt)
  if (Object.keys(em).length) useRide.setState(em)
}

// Ra khỏi phòng hay chơi lại là một chuyến mới: xe về trước nhà trọ, xe cộ về chỗ cũ, Em ở nhà,
// và không còn phím/nút nào bị giữ từ trước (làm ngay lúc đổi màn, trước khi cảnh phố kịp vẽ khung đầu).
useStory.subscribe((st, prev) => {
  if (st.s.phase === prev.s.phase && st.s.seed === prev.s.seed) return
  useRide.getState().reset()
  rideInput.throttle = 0
  rideInput.brake = 0
  rideInput.steer = 0
  rideInput.wheelie = 0
  keys.clear()
})
