import { useGame } from '../store'
import { initialState, reducer, type StoryState } from './state'
import { useStory } from './store'

const s0 = () => ({ ...initialState(42), phase: 'room' as const })

test('initialState is deterministic for a seed', () => {
  const a = initialState(7)
  const b = initialState(7)
  expect(a.weather).toBe(b.weather)
  expect(a.keySpot).toBe(b.keySpot)
  expect(a.phase).toBe('alarm')
  expect(a.minutes).toBe(450)
})

test('different seeds can give different key spots', () => {
  const spots = new Set(Array.from({ length: 30 }, (_, i) => initialState(i + 1).keySpot))
  expect(spots.size).toBeGreaterThan(2)
})

test('snooze adds 5 minutes and says something', () => {
  const s = reducer(initialState(1), { type: 'snooze' })
  expect(s.minutes).toBe(455)
  expect(s.snoozes).toBe(1)
  expect(s.line).toBeTruthy()
})

test('snoozing to 8:00 oversleeps', () => {
  let s: StoryState = initialState(1)
  for (let i = 0; i < 6; i++) s = reducer(s, { type: 'snooze' })
  expect(s.minutes).toBe(480)
  expect(s.phase).toBe('overslept')
})

test('wake starts the room phase', () => {
  expect(reducer(initialState(1), { type: 'wake' }).phase).toBe('room')
})

test('the clock only runs in the room', () => {
  expect(reducer(initialState(1), { type: 'tick', realDt: 60 }).minutes).toBe(450)
  expect(reducer(s0(), { type: 'tick', realDt: 60 }).minutes).toBeCloseTo(458.5)
})

test('hygiene is capped at 100', () => {
  let s: StoryState = { ...s0(), hygiene: 90 }
  s = reducer(s, { type: 'brushDone' })
  expect(s.hygiene).toBe(100)
})

test('restart resets state with a new seed', () => {
  const s = reducer({ ...s0(), minutes: 470, hygiene: 80 }, { type: 'restart', seed: 99 })
  expect(s).toEqual(initialState(99))
})

describe('store', () => {
  afterEach(() => useGame.getState().setHelpOpen(false))

  test('tick advances the clock', () => {
    useStory.setState({ s: s0() })
    useStory.getState().tick(60)
    expect(useStory.getState().s.minutes).toBeCloseTo(458.5)
  })

  test('clock does not advance while paused', () => {
    useStory.setState({ s: s0() })
    useGame.getState().setHelpOpen(true)
    useStory.getState().tick(60)
    expect(useStory.getState().s.minutes).toBe(450)
  })
})

test('search finds keys only at keySpot, costs a minute, and each spot once', () => {
  const s = s0()
  const wrong = ['bed', 'wardrobe', 'fridge', 'deskMine', 'kitchen', 'shelf'].find((k) => k !== s.keySpot)!
  const a = reducer(s, { type: 'search', id: wrong })
  expect(a.tasks.keys).toBe(false)
  expect(a.minutes).toBe(451)
  expect(reducer(a, { type: 'search', id: wrong })).toBe(a)
  const b = reducer(a, { type: 'search', id: s.keySpot })
  expect(b.tasks.keys).toBe(true)
  expect(b.line).toBe('Thấy chìa khóa rồi! 🔑')
})
