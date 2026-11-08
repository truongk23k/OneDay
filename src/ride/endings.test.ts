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

test('arriving after 8:30 → the boss is waiting at the door', () => {
  expect(pickEnding(done({ minutes: 511 })).id).toBe('late')
})

test('Em upset (low mood or dropped after 8:25) → "Mai em tự đi làm ko cần đón"', () => {
  const e = pickEnding(done({ mood: 30 }))
  expect(e.id).toBe('emUpset')
  expect(e.emText).toBe('Mai em tự đi làm ko cần đón')
  expect(pickEnding(done({ emDropLate: true })).id).toBe('emUpset')
})

test('forgot to brush → colleagues keep a metre away', () => {
  const s = done()
  expect(pickEnding({ ...s, tasks: { ...s.tasks, brushed: false } }).id).toBe('noBrush')
})

test('priority: overslept > late > Em upset > no brush > perfect, others as extra lines', () => {
  const s = done({ minutes: 515, mood: 20 })
  const e = pickEnding({ ...s, tasks: { ...s.tasks, brushed: false } })
  expect(e.id).toBe('late')
  expect(e.also).toEqual(['emUpset', 'noBrush'])
  expect(pickEnding({ ...initialState(1), phase: 'overslept' }).id).toBe('overslept')
})

test('on time but not perfect → an ordinary day', () => {
  const s = done({ mood: 60 })
  expect(pickEnding({ ...s, tasks: { ...s.tasks, washed: false } }).id).toBe('ok')
})
