import { poseFor } from './pose'

const base = { overlay: null, sitting: false, transient: null, now: 0 } as const

test('walking or standing by default', () => {
  expect(poseFor(base)).toBe('none')
})

test('brushing and washing screens make Anh brush and wash', () => {
  expect(poseFor({ ...base, overlay: 'brush' })).toBe('brush')
  expect(poseFor({ ...base, overlay: 'wash' })).toBe('wash')
})

test('sitting at the desk wins over everything except an action in progress', () => {
  expect(poseFor({ ...base, sitting: true })).toBe('sit')
  expect(poseFor({ ...base, sitting: true, transient: { pose: 'drink', until: 5 }, now: 1 })).toBe('drink')
})

test('a short action (drinking) ends by itself', () => {
  expect(poseFor({ ...base, transient: { pose: 'drink', until: 2 }, now: 1 })).toBe('drink')
  expect(poseFor({ ...base, transient: { pose: 'drink', until: 2 }, now: 3 })).toBe('none')
})
