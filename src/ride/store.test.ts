import { keys } from '../player/input'
import { useGame } from '../store'
import { initialState, reducer, type StoryState } from '../story/state'
import { useStory } from '../story/store'
import { newBike } from './bike'
import { LIGHTS, MARKERS, POTHOLES } from './city'
import { LIGHT_CYCLE, lightState, newTraffic, poseOf, type Vehicle } from './traffic'
import { ALLEY } from './city'
import { CHECKPOINT, POLICE, startChase } from './police'
import { S } from '../strings'
import { FINES } from '../story/state'
import { EM_DOOR, rideInput, stepRide, useRide } from './store'

const street = (over: Partial<StoryState> = {}) =>
  useStory.setState({
    s: {
      ...initialState(1),
      phase: 'street',
      stage: 'toEm',
      minutes: 490,
      mood: 60,
      tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 },
      ...over,
    },
  })

beforeEach(() => {
  Object.assign(rideInput, { throttle: 0, brake: 0, steer: 0, wheelie: 0 })
  useRide.getState().reset()
  useGame.getState().setHelpOpen(false)
})

test('the ride starts at home, facing along the road', () => {
  const b = useRide.getState().bike
  expect(b.x).toBe(MARKERS.home.x)
  expect(b.z).toBe(MARKERS.home.z)
  expect(b.heading).toBe(MARKERS.home.heading)
})

test('gas moves the bike', () => {
  street()
  rideInput.throttle = 1
  for (let i = 0; i < 60; i++) stepRide(1 / 60, i / 60)
  expect(useRide.getState().bike.x).toBeGreaterThan(MARKERS.home.x + 1)
})

test('street clock, bike and traffic stop while paused', () => {
  street()
  useGame.getState().setHelpOpen(true)
  rideInput.throttle = 1
  for (let i = 0; i < 60; i++) stepRide(1 / 60, i / 60)
  expect(useRide.getState().bike.x).toBe(MARKERS.home.x)
  expect(useRide.getState().traffic).toEqual(newTraffic())
  expect(useRide.getState().time).toBe(0)
})

test('traffic moves while riding, and reset brings it back', () => {
  street()
  for (let i = 0; i < 60; i++) stepRide(1 / 60, i / 60)
  expect(useRide.getState().traffic).not.toEqual(newTraffic())
  useRide.getState().reset()
  expect(useRide.getState().traffic).toEqual(newTraffic())
})

// Bắt đầu ngay trước giao lộ có đèn (120, -100), chạy về hướng đông lúc đèn trục x đang đỏ/xanh.
function throughLight(color: 'red' | 'green') {
  const l = LIGHTS[2]
  let time = 0
  while (lightState(2, time, 'x') !== color || lightState(2, time + 1.5, 'x') !== color) time += 0.1
  expect(time).toBeLessThan(LIGHT_CYCLE)
  useRide.setState({ bike: { ...newBike(l.x - 7, l.z + 2, -Math.PI / 2), speed: 9 }, traffic: [], time })
  rideInput.throttle = 1
  for (let i = 0; i < 60; i++) stepRide(1 / 60, i / 60)
}

test('running a red light with Em aboard upsets her once, and the police give chase', () => {
  street({ stage: 'withEm' })
  throughLight('red')
  // -5 vượt đèn, -4 vì sợ khi CSGT hú còi đuổi.
  expect(useStory.getState().s.mood).toBe(51)
  expect(useRide.getState().police.mode).toBe('chase')
  expect(useRide.getState().police.reason).toBe('redLight')
  expect(useStory.getState().s.line).toBe(S.police.chase.redLight)
})

test('crossing on green is fine', () => {
  street({ stage: 'withEm' })
  throughLight('green')
  expect(useStory.getState().s.mood).toBe(60)
})

test('riding into a car is a crash', () => {
  street({ stage: 'withEm' })
  // Ô tô đứng chờ vì xe của Anh lao thẳng vào đầu nó.
  const car: Vehicle = { ...newTraffic().find((v) => v.kind === 'car')! }
  const p = poseOf(car)
  const fx = -Math.sin(p.heading)
  const fz = -Math.cos(p.heading)
  useRide.setState({ bike: { ...newBike(p.x + fx * 6, p.z + fz * 6, p.heading + Math.PI), speed: 10 }, traffic: [car] })
  rideInput.throttle = 1
  for (let i = 0; i < 30; i++) stepRide(1 / 60, i / 60)
  expect(useStory.getState().s.mood).toBe(50)
})

const runFor = (seconds: number) => {
  const t0 = useRide.getState().time
  for (let i = 0; i < seconds * 60; i++) stepRide(1 / 60, t0 + i / 60)
}

test('stopping at Em’s house does not pick her up by itself — Anh calls her', () => {
  street()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0) })
  runFor(3)
  expect(useStory.getState().s.stage).toBe('toEm')
  expect(useRide.getState().atEmDoor).toBe(true)
  expect(useRide.getState().em).toBe('home')
})

test('calling only works when stopped at her door', () => {
  street()
  expect(useRide.getState().callEm()).toBe(false)
  expect(useRide.getState().em).toBe('home')
})

test('after the call Em comes out, walks to the bike and gets on, once', () => {
  street()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0) })
  runFor(0.1)
  const before = useStory.getState().s
  expect(useRide.getState().callEm()).toBe(true)
  runFor(1)
  expect(useRide.getState().em).toBe('ringing')
  runFor(12)
  expect(useRide.getState().em).toBe('aboard')
  expect(useStory.getState().s.stage).toBe('withEm')
  expect(useStory.getState().s.mood).toBe(reducer(before, { type: 'pickup' }).mood)
})

test('if Anh rides off after calling, Em waits at the kerb', () => {
  street()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0) })
  runFor(0.1)
  useRide.getState().callEm()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x - 40, MARKERS.emHouse.z, 0) })
  runFor(12)
  const { em, emPos } = useRide.getState()
  expect(em).toBe('coming')
  expect(useStory.getState().s.stage).toBe('toEm')
  expect(Math.hypot(emPos.x - EM_DOOR.x, emPos.z - EM_DOOR.z)).toBeLessThan(3.5)
})

test('pausing holds the phone ringing', () => {
  street()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0) })
  runFor(0.1)
  useRide.getState().callEm()
  useGame.getState().setHelpOpen(true)
  runFor(10)
  expect(useRide.getState().em).toBe('ringing')
})

test('riding over a pothole fast with Em is felt once', () => {
  street({ stage: 'withEm' })
  const p = POTHOLES[0]
  useRide.setState({ bike: { ...newBike(p.x + 3, p.z, Math.PI / 2), speed: 8 } })
  rideInput.throttle = 1
  for (let i = 0; i < 40; i++) stepRide(1 / 60, i / 60)
  expect(useStory.getState().s.mood).toBe(55)
})

describe('every ride starts fresh', () => {
  const dirty = () => {
    useRide.setState({ bike: newBike(0, -150, 0), traffic: [], time: 99, em: 'aboard', atEmDoor: true })
    rideInput.throttle = 1
    keys.down('KeyW')
  }
  const expectFresh = () => {
    const r = useRide.getState()
    expect(r.bike).toEqual(newBike(MARKERS.home.x, MARKERS.home.z, MARKERS.home.heading))
    expect(r.traffic).toEqual(newTraffic())
    expect(r.time).toBe(0)
    expect(r.em).toBe('home')
    expect(rideInput.throttle).toBe(0)
    expect(keys.vector().y).toBe(0)
  }

  test('leaving the room resets the bike, traffic, Em and held keys before the street draws', () => {
    useStory.setState({ s: { ...initialState(1), phase: 'room', tasks: { ...initialState(1).tasks, keys: true, brushed: true, washed: true } } })
    dirty()
    useStory.getState().dispatch({ type: 'leave' })
    expect(useStory.getState().s.phase).toBe('street')
    expectFresh()
  })

  test('restart from the street resets the ride too', () => {
    street({ stage: 'sprint' })
    dirty()
    useStory.getState().dispatch({ type: 'restart', seed: 3 })
    expectFresh()
  })
})

describe('police', () => {
  test('caught while riding on: fined, held at the kerb for a moment, then free to go', () => {
    street()
    const bike = { ...newBike(150, 0, -Math.PI / 2), speed: 6 }
    useRide.setState({ bike, traffic: [], police: { ...startChase(bike, 0, 'redLight'), x: 146, z: 0, speed: 10 } })
    rideInput.throttle = 1
    runFor(0.5)
    const s = useStory.getState().s
    expect(s.fines).toBe(FINES.redLight)
    expect(s.busts).toBe(1)
    expect(useRide.getState().police.mode).toBe('pullover')
    // Ga vẫn giữ mà xe dừng lại và đứng im tới khi lập biên bản xong.
    runFor(1.2)
    const x = useRide.getState().bike.x
    expect(Math.abs(useRide.getState().bike.speed)).toBeLessThan(0.1)
    runFor(1)
    expect(useRide.getState().bike.x).toBeCloseTo(x, 1)
    runFor(2)
    expect(useRide.getState().police.mode).toBe('off')
    expect(useRide.getState().bike.x).toBeGreaterThan(x + 1)
  })

  test('hiding in the alley shakes them off, and a fresh chase cannot start straight away', () => {
    street()
    const hide = newBike(ALLEY.x, -50, Math.PI)
    useRide.setState({ bike: hide, traffic: [], police: startChase(newBike(200, 0, Math.PI), 0, 'redLight') })
    runFor(POLICE.loseTime + 6)
    expect(useRide.getState().police.mode).toBe('off')
    expect(useStory.getState().s.line).toBe(S.police.escaped)
    expect(useStory.getState().s.fines).toBe(0)
  })

  test('the checkpoint pulls Anh over when Em has no helmet, once', () => {
    street({ stage: 'withEm', tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 1 } })
    useRide.setState({ bike: { ...newBike(CHECKPOINT.x, CHECKPOINT.z + 12, 0), speed: 6 }, traffic: [] })
    rideInput.throttle = 1
    runFor(1.5)
    expect(useStory.getState().s.fines).toBe(FINES.helmet)
    runFor(8)
    expect(useStory.getState().s.busts).toBe(1)
  })

  test('with enough helmets the checkpoint lets Anh pass', () => {
    street({ stage: 'withEm' })
    useRide.setState({ bike: { ...newBike(CHECKPOINT.x, CHECKPOINT.z + 12, 0), speed: 6 }, traffic: [] })
    rideInput.throttle = 1
    runFor(3)
    expect(useStory.getState().s.busts).toBe(0)
    expect(useRide.getState().police.mode).toBe('off')
  })

  test('a wheelie in front of the checkpoint starts a chase', () => {
    street()
    useRide.setState({ bike: { ...newBike(CHECKPOINT.x, CHECKPOINT.z + 25, 0), speed: 8 }, traffic: [] })
    rideInput.throttle = 1
    rideInput.wheelie = 1
    runFor(1)
    rideInput.wheelie = 0
    expect(useRide.getState().police.mode).toBe('chase')
    expect(useRide.getState().police.reason).toBe('wheelie')
  })
})
