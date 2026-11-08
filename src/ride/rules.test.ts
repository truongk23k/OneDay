import { HINTS } from '../story/outfit'
import { initialState, reducer, type StoryState } from '../story/state'
import { newBike } from './bike'
import { MARKERS } from './city'
import { arrivedAt, targetFor } from './rules'

const street = (over: Partial<StoryState> = {}): StoryState => ({
  ...initialState(1),
  phase: 'street',
  stage: 'toEm',
  minutes: 490,
  mood: 60,
  hygiene: 70,
  weather: 'sun',
  hint: HINTS.findIndex((h) => h.id === 'noHoneycomb'),
  outfit: { top: 'teeBlack', bottom: 'khaki', shoes: 'sneakers', raincoat: false },
  tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 },
  ...over,
})

describe('arriving at stops', () => {
  const at = (m: { x: number; z: number }, speed = 0) => ({ ...newBike(m.x + 1, m.z, 0), speed })

  test('stopping by Em’s house picks her up; driving past does not', () => {
    expect(arrivedAt('toEm', at(MARKERS.emHouse))).toBe('pickup')
    expect(arrivedAt('toEm', at(MARKERS.emHouse, 6))).toBeNull()
    expect(arrivedAt('toEm', at(MARKERS.emOffice))).toBeNull()
  })

  test('then her office, then Anh’s office', () => {
    expect(arrivedAt('withEm', at(MARKERS.emOffice))).toBe('dropoff')
    expect(arrivedAt('sprint', at(MARKERS.anhOffice))).toBe('arrive')
    expect(arrivedAt('done', at(MARKERS.anhOffice))).toBeNull()
  })

  test('the next stop follows the stage', () => {
    expect(targetFor('toEm')).toBe(MARKERS.emHouse)
    expect(targetFor('withEm')).toBe(MARKERS.emOffice)
    expect(targetFor('sprint')).toBe(MARKERS.anhOffice)
  })
})

describe('Em at the pickup', () => {
  test('a happy pickup moves on to carrying Em', () => {
    const s = reducer(street(), { type: 'pickup' })
    expect(s.stage).toBe('withEm')
    expect(s.line).toBeTruthy()
  })

  test('no helmet for Em costs 15 mood', () => {
    const base = street()
    const s = reducer({ ...base, tasks: { ...base.tasks, helmets: 1 } }, { type: 'pickup' })
    expect(s.mood).toBe(base.mood - 15 + 5)
  })

  test('a disaster outfit costs 5, matching her hint gives 5', () => {
    expect(reducer(street(), { type: 'pickup' }).mood).toBe(65)
    expect(reducer(street({ outfit: { top: 'pyjama', bottom: 'khaki', shoes: 'sneakers', raincoat: false } }), { type: 'pickup' }).mood).toBe(55 + 5)
  })

  test('rain without a raincoat soaks Anh', () => {
    const s = reducer(street({ weather: 'rain' }), { type: 'pickup' })
    expect(s.hygiene).toBe(55)
    expect(s.mood).toBe(60 + 5 - 3)
  })
})

describe('riding with Em', () => {
  const withEm = () => street({ stage: 'withEm' })

  test('crash, hard brake, pothole and red light upset Em', () => {
    expect(reducer(withEm(), { type: 'rideEvent', kind: 'crash' }).mood).toBe(50)
    expect(reducer(withEm(), { type: 'rideEvent', kind: 'hardBrake' }).mood).toBe(57)
    expect(reducer(withEm(), { type: 'rideEvent', kind: 'pothole' }).mood).toBe(55)
    expect(reducer(withEm(), { type: 'rideEvent', kind: 'redLight' }).mood).toBe(55)
    expect(reducer(withEm(), { type: 'rideEvent', kind: 'hardBrake' }).line).toMatch(/từ từ/i)
  })

  test('alone, events do not touch Em’s mood', () => {
    expect(reducer(street(), { type: 'rideEvent', kind: 'crash' }).mood).toBe(60)
  })

  test('dropping Em by 8:25 pleases her; late upsets her', () => {
    const onTime = reducer(street({ stage: 'withEm', minutes: 504 }), { type: 'dropoff' })
    expect(onTime.stage).toBe('sprint')
    expect(onTime.mood).toBe(65)
    const late = reducer(street({ stage: 'withEm', minutes: 506 }), { type: 'dropoff' })
    expect(late.mood).toBe(40)
    expect(late.emDropLate).toBe(true)
  })

  test('arriving at the office finishes the ride', () => {
    expect(reducer(street({ stage: 'sprint' }), { type: 'arrive' }).stage).toBe('done')
  })
})
