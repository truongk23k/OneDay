import { initialState, type StoryState } from './state'
import { INTERACTABLES, actionsFor, nearestInteractable } from './interact'

const room = (): StoryState => ({ ...initialState(1), phase: 'room' })

test('every interactable has a spot inside the room', () => {
  for (const t of INTERACTABLES) {
    expect(t.x).toBeGreaterThan(0)
    expect(t.z).toBeGreaterThan(0)
  }
})

test('nearest within reach', () => {
  expect(nearestInteractable({ x: 3.7, z: 0.75 })?.id).toBe('lavabo')
  expect(nearestInteractable({ x: 2.45, z: 0.5 })?.id).toBe('door')
})

test('nothing in reach → null', () => {
  expect(nearestInteractable({ x: 2.45, z: 3.4 })).toBeNull()
})

test('the lavabo offers brushing and washing until each is done', () => {
  const s = room()
  expect(actionsFor('lavabo', s).map((o) => o.action)).toEqual([
    { type: 'open', overlay: 'brush' },
    { type: 'open', overlay: 'wash' },
  ])
  const done = { ...s, tasks: { ...s.tasks, brushed: true } }
  expect(actionsFor('lavabo', done).map((o) => o.action)).toEqual([{ type: 'open', overlay: 'wash' }])
})

test('key spots offer a search until the keys are found or the spot was searched', () => {
  const s = room()
  expect(actionsFor('fridge', s).map((o) => o.action)).toEqual([{ type: 'search', id: 'fridge' }])
  expect(actionsFor('fridge', { ...s, searched: ['fridge'] })).toEqual([])
  expect(actionsFor('fridge', { ...s, tasks: { ...s.tasks, keys: true } })).toEqual([])
})

test('the wardrobe offers clothes and a search', () => {
  const kinds = actionsFor('wardrobe', room()).map((o) => o.action.type)
  expect(kinds).toEqual(['open', 'search'])
})
