import { initialState, type StoryState } from '../story/state'
import { pickEnding } from './endings'

const done = (over: Partial<StoryState> = {}): StoryState => {
  const s = initialState(1)
  return {
    ...s,
    phase: 'street',
    stage: 'done',
    minutes: 505,
    mood: 80,
    hygiene: 90,
    tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 },
    emDropLate: false,
    ...over,
  }
}

test('everything right, on time, Em happy → model employee, national boyfriend', () => {
  expect(pickEnding(done()).id).toBe('perfect')
})

test('arriving after 9:00 → the boss is waiting at the door', () => {
  expect(pickEnding(done({ minutes: 530 })).id).not.toBe('late')
  expect(pickEnding(done({ minutes: 541 })).id).toBe('late')
})

test('Em upset (low mood or dropped after 8:45) → "Mai em tự đi làm ko cần đón"', () => {
  const e = pickEnding(done({ mood: 30 }))
  expect(e.id).toBe('emUpset')
  expect(e.emText).toBe('Mai em tự đi làm ko cần đón')
  expect(pickEnding(done({ emDropLate: true })).id).toBe('emUpset')
})

test('priority: overslept > late > Em upset > fined > perfect, others as extra lines', () => {
  const e = pickEnding(done({ minutes: 545, mood: 20, busts: 1, fines: 4000 }))
  expect(e.id).toBe('late')
  expect(e.also).toEqual(['emUpset', 'busted'])
  expect(pickEnding({ ...initialState(1), phase: 'overslept' }).id).toBe('overslept')
})

test('on time but not perfect → an ordinary day', () => {
  const s = done({ mood: 60 })
  expect(pickEnding({ ...s, tasks: { ...s.tasks, texted: false } }).id).toBe('ok')
})

test('perfect also needs Anh to smell nice', () => {
  expect(pickEnding(done({ hygiene: 50 })).id).toBe('ok')
})

test('a police fine shows up as its own ending line', () => {
  expect(pickEnding(done({ fines: 4000, busts: 1 })).id).toBe('busted')
  const e = pickEnding(done({ minutes: 542, fines: 400, busts: 1 }))
  expect(e.also).toContain('busted')
})

test('late but the boss was warned → a softer ending', () => {
  expect(pickEnding(done({ minutes: 542, warnedBoss: true })).id).toBe('lateWarned')
})
