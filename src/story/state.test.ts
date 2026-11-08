import { useGame } from '../store'
import { STREET_SPEED } from './clock'
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

test('going to the toilet takes 2 minutes and says something', () => {
  const s = reducer(s0(), { type: 'toilet' })
  expect(s.minutes).toBe(452)
  expect(s.line).toBeTruthy()
})

describe('leaving the room', () => {
  test('taking both helmets, or only one', () => {
    expect(reducer(s0(), { type: 'takeHelmets', n: 2 }).tasks.helmets).toBe(2)
    expect(reducer(s0(), { type: 'takeHelmets', n: 1 }).tasks.helmets).toBe(1)
  })

  test('cannot leave without keys', () => {
    const s = reducer(s0(), { type: 'leave' })
    expect(s.phase).toBe('room')
    expect(s.line).toMatch(/chìa khóa/i)
  })

  test('leaving with the keys goes out to the street, on the way to Em', () => {
    const base = s0()
    const s = reducer({ ...base, tasks: { ...base.tasks, keys: true } }, { type: 'leave' })
    expect(s.phase).toBe('street')
    expect(s.stage).toBe('toEm')
  })
})

describe('small actions', () => {
  test('drinking water takes a minute', () => {
    const s = reducer(s0(), { type: 'drink' })
    expect(s.minutes).toBe(451)
    expect(s.line).toBeTruthy()
  })

  test('browsing takes 3 minutes, checking mail 1 minute', () => {
    expect(reducer(s0(), { type: 'browse' }).minutes).toBe(453)
    expect(reducer(s0(), { type: 'mail' }).minutes).toBe(451)
  })
})

describe('more actions', () => {
  test('pull-ups take a minute', () => {
    expect(reducer(s0(), { type: 'pullup' }).minutes).toBe(451)
  })

  test('a shower takes 3 minutes and makes Anh cleaner', () => {
    const s = reducer(s0(), { type: 'bathe' })
    expect(s.minutes).toBe(453)
    expect(s.hygiene).toBe(30)
  })

  test('lying in takes 3 minutes; posing at the mirror half a minute', () => {
    expect(reducer(s0(), { type: 'nap' }).minutes).toBe(453)
    expect(reducer(s0(), { type: 'flex' }).minutes).toBe(450.5)
  })
})

describe('toilet and kitchen', () => {
  test('peeing takes a minute, pooping three', () => {
    const pee = reducer(s0(), { type: 'pee' })
    const poop = reducer(s0(), { type: 'poop' })
    expect(pee.minutes).toBe(451)
    expect(poop.minutes).toBe(453)
    expect(pee.line).toBeTruthy()
    expect(poop.line).toBeTruthy()
    expect(pee.line).not.toBe(poop.line)
  })

  test('cooking noodles takes 3 minutes', () => {
    const s = reducer(s0(), { type: 'cook' })
    expect(s.minutes).toBe(453)
    expect(s.line).toMatch(/mì/i)
  })
})

describe('street clock and stages', () => {
  const street = (): StoryState => ({ ...s0(), phase: 'street', stage: 'toEm' })

  test('the street clock runs faster than the room clock', () => {
    expect(STREET_SPEED).toBeGreaterThan(8.5)
    expect(reducer(street(), { type: 'tick', realDt: 60 }).minutes).toBeCloseTo(450 + STREET_SPEED)
  })

  test('the clock stops once Anh reaches the office', () => {
    const s = reducer({ ...street(), stage: 'done', minutes: 506 }, { type: 'tick', realDt: 30 })
    expect(s.minutes).toBe(506)
  })

  test('Em does not text while Anh is riding', () => {
    const s = reducer({ ...street(), minutes: 452.9 }, { type: 'tick', realDt: 10 })
    expect(s.chat.log).toHaveLength(0)
  })

  test('stages advance once and in order: toEm → withEm → sprint → done', () => {
    let s = street()
    s = reducer(s, { type: 'stage', to: 'sprint' })
    expect(s.stage).toBe('toEm')
    s = reducer(s, { type: 'stage', to: 'withEm' })
    expect(s.stage).toBe('withEm')
    s = reducer(s, { type: 'stage', to: 'withEm' })
    expect(s.stage).toBe('withEm')
    s = reducer(s, { type: 'stage', to: 'sprint' })
    s = reducer(s, { type: 'stage', to: 'done' })
    expect(s.stage).toBe('done')
  })

  test('restart from the street returns to the alarm', () => {
    const s = reducer({ ...street(), stage: 'withEm' }, { type: 'restart', seed: 3 })
    expect(s.phase).toBe('alarm')
    expect(s.stage).toBe('toEm')
  })
})
