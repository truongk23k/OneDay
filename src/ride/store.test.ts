import { useGame } from '../store'
import { initialState, type StoryState } from '../story/state'
import { useStory } from '../story/store'
import { newBike } from './bike'
import { LIGHTS, MARKERS, POTHOLES } from './city'
import { LIGHT_CYCLE, lightState, newTraffic, poseOf, type Vehicle } from './traffic'
import { rideInput, stepRide, useRide } from './store'

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
  Object.assign(rideInput, { throttle: 0, brake: 0, steer: 0 })
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

test('running a red light with Em aboard upsets her, once', () => {
  street({ stage: 'withEm' })
  throughLight('red')
  expect(useStory.getState().s.mood).toBe(55)
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

test('stopping at Em’s house picks her up, once', () => {
  street()
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0) })
  stepRide(1 / 60, 0)
  expect(useStory.getState().s.stage).toBe('withEm')
  stepRide(1 / 60, 0.1)
  expect(useStory.getState().s.stage).toBe('withEm')
})

test('riding over a pothole fast with Em is felt once', () => {
  street({ stage: 'withEm' })
  const p = POTHOLES[0]
  useRide.setState({ bike: { ...newBike(p.x + 3, p.z, Math.PI / 2), speed: 8 } })
  rideInput.throttle = 1
  for (let i = 0; i < 40; i++) stepRide(1 / 60, i / 60)
  expect(useStory.getState().s.mood).toBe(55)
})
