import { S } from '../strings'
import { useGame } from '../store'
import { STREET_SPEED } from './clock'
import { FINES, FOOD_PRICE, initialState, reducer, type StoryState } from './state'
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

test('snoozing to 8:15 oversleeps', () => {
  let s: StoryState = initialState(1)
  for (let i = 0; i < 8; i++) s = reducer(s, { type: 'snooze' })
  expect(s.phase).toBe('alarm')
  s = reducer(s, { type: 'snooze' })
  expect(s.minutes).toBe(495)
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

  const ready = (over: Partial<StoryState['tasks']> = {}): StoryState => {
    const base = s0()
    return { ...base, tasks: { ...base.tasks, keys: true, brushed: true, washed: true, ...over } }
  }

  test('cannot leave without keys', () => {
    const s = reducer(ready({ keys: false }), { type: 'leave' })
    expect(s.phase).toBe('room')
    expect(s.line).toBe(S.story.needKeys)
  })

  test('cannot leave without brushing teeth and washing the face', () => {
    expect(reducer(ready({ brushed: false }), { type: 'leave' }).line).toBe(S.story.needBrush)
    expect(reducer(ready({ washed: false }), { type: 'leave' }).line).toBe(S.story.needWash)
    const both = reducer(ready({ brushed: false, washed: false }), { type: 'leave' })
    expect(both.phase).toBe('room')
    expect(both.line).toBe(S.story.needFresh)
  })

  test('keys, brushed and washed: out to the street, on the way to Em', () => {
    const s = reducer(ready(), { type: 'leave' })
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

describe('wheelie on the street', () => {
  const ride = (stage: StoryState['stage']): StoryState => ({ ...s0(), phase: 'street', stage, mood: 60 })

  test('with Em aboard a wheelie scares her', () => {
    const s = reducer(ride('withEm'), { type: 'rideEvent', kind: 'wheelie' })
    expect(s.mood).toBe(52)
    expect(s.line).toBe(S.ride.wheelieWithEm)
  })

  test('alone it is just for fun', () => {
    const s = reducer(ride('toEm'), { type: 'rideEvent', kind: 'wheelie' })
    expect(s.mood).toBe(60)
    expect(s.line).toBe(S.ride.wheelieAlone)
  })
})

describe('police', () => {
  const ride = (stage: StoryState['stage']): StoryState => ({ ...s0(), phase: 'street', stage, mood: 60, minutes: 490 })

  test('pulling over for a red light costs the fine and a few minutes', () => {
    const s = reducer(ride('toEm'), { type: 'busted', reason: 'redLight', fled: false })
    expect(s.money).toBe(initialState(42).money - FINES.redLight)
    expect(s.fines).toBe(FINES.redLight)
    expect(s.busts).toBe(1)
    expect(s.minutes).toBe(494)
    expect(s.mood).toBe(60)
    expect(s.line).toBe(S.police.busted.redLight)
  })

  test('being caught after running costs more time, and Em is upset', () => {
    const s = reducer(ride('withEm'), { type: 'busted', reason: 'helmet', fled: true })
    expect(s.minutes).toBe(498)
    expect(s.mood).toBe(45)
    expect(s.fines).toBe(FINES.helmet)
  })

  test('a chase scares Em; getting away is a relief for Anh only', () => {
    expect(reducer(ride('withEm'), { type: 'chased', reason: 'redLight' }).mood).toBe(56)
    expect(reducer(ride('toEm'), { type: 'chased', reason: 'redLight' }).line).toBe(S.police.chase.redLight)
    const away = reducer(ride('withEm'), { type: 'escaped' })
    expect(away.mood).toBe(54)
    expect(away.line).toBe(S.police.escaped)
  })
})

describe('phone apps', () => {
  test('ordering breakfast for Em costs money once, and she loves it at drop-off', () => {
    const a = reducer(s0(), { type: 'orderFood' })
    expect(a.breakfast).toBe(true)
    expect(a.money).toBe(s0().money - FOOD_PRICE)
    expect(reducer(a, { type: 'orderFood' }).money).toBe(a.money)
    const ride = { ...a, phase: 'street' as const, stage: 'withEm' as const, minutes: 500, mood: 60 }
    const s = reducer(ride, { type: 'dropoff' })
    expect(s.mood).toBe(60 + 5 + 8)
    expect(s.line).toBe(S.ride.dropBreakfast)
  })

  test('calling the boss warns him, calling Em in the morning cheers her once', () => {
    expect(reducer(s0(), { type: 'callBoss' }).warnedBoss).toBe(true)
    const a = reducer(s0(), { type: 'callEm' })
    expect(a.mood).toBe(63)
    expect(a.minutes).toBe(451)
    expect(reducer(a, { type: 'callEm' }).mood).toBe(63)
  })

  test('each short video eats a minute', () => {
    expect(reducer(s0(), { type: 'scroll' }).minutes).toBe(451)
  })
})

describe('promises and texting', () => {
  const street = (over: Partial<StoryState> = {}): StoryState => ({
    ...s0(),
    phase: 'street',
    stage: 'toEm',
    mood: 60,
    outfit: { top: 'teeWhite', bottom: 'khaki', shoes: 'sneakers', raincoat: false },
    tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 },
    ...over,
  })

  test('answering "when" sets the time Anh promised', () => {
    const at = (i: number) => {
      let s: StoryState = { ...s0(), minutes: 464 }
      s = reducer(s, { type: 'tick', realDt: 0 })
      while (s.chat.pending !== null && s.chat.log.at(-1)?.text !== S.chat.when.msg) {
        s = reducer(s, { type: 'chatReply', index: 0 })
        s = reducer(s, { type: 'tick', realDt: 0 })
      }
      return reducer(s, { type: 'chatReply', index: i }).promise
    }
    expect(at(0)).toBe(495)
    expect(at(1)).toBe(510)
    expect(at(2)).toBeNull()
  })

  test('picking Em up later than promised costs mood', () => {
    const kept = reducer(street({ promise: 495, minutes: 496 }), { type: 'pickup' })
    const broken = reducer(street({ promise: 495, minutes: 501 }), { type: 'pickup' })
    expect(kept.mood - broken.mood).toBe(8)
    expect(broken.line).toBe(S.ride.brokePromise)
  })

  test('Em answers the call; without a text first she needs a few minutes to get ready', () => {
    const ready = reducer(street({ minutes: 480 }), { type: 'emAnswers' })
    expect(ready.minutes).toBe(480)
    expect(ready.line).toBe(S.ride.callAnswer)
    const base = street({ minutes: 480 })
    const unready = reducer({ ...base, tasks: { ...base.tasks, texted: false } }, { type: 'emAnswers' })
    expect(unready.minutes).toBe(484)
    expect(unready.mood).toBe(55)
    expect(unready.line).toBe(S.ride.callNoText)
    expect(reducer(street({ minutes: 505 }), { type: 'emAnswers' }).line).toBe(S.ride.callAnswer)
    expect(reducer(street({ minutes: 515 }), { type: 'emAnswers' }).line).toBe(S.ride.callLate)
  })
})

describe('Grap and Face bút', () => {
  test('trying to send Em off by GrapBike: she refuses, a bit hurt, once — Anh still has to pick her up', () => {
    const a = reducer({ ...s0(), mood: 60 }, { type: 'grabForEm' })
    expect(a.mood).toBe(55)
    expect(a.line).toBe(S.phone.grab.bikeLine)
    expect(a.money).toBe(s0().money)
    expect(reducer(a, { type: 'grabForEm' }).mood).toBe(55)
    const ride = reducer({ ...s0(), phase: 'street', stage: 'toEm' }, { type: 'grabForEm' })
    expect(ride.stage).toBe('toEm')
  })

  test('liking Em’s post cheers her up once', () => {
    const a = reducer({ ...s0(), mood: 60 }, { type: 'likeEmPost' })
    expect(a.mood).toBe(62)
    expect(reducer(a, { type: 'likeEmPost' }).mood).toBe(62)
  })
})

describe('Liên Quậy', () => {
  test('finishing a match says how it went; the first one also annoys Em', () => {
    const win = reducer({ ...s0(), mood: 60 }, { type: 'matchEnd', won: true })
    expect(win.line).toBe(S.phone.moba.lineWin)
    expect(win.mood).toBe(56)
    expect(win.matches).toBe(1)
    const lose = reducer(win, { type: 'matchEnd', won: false })
    expect(lose.line).toBe(S.phone.moba.lineLose)
    expect(lose.mood).toBe(56)
    expect(lose.matches).toBe(2)
  })
})
