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
  const story = (st: StoryState) => actionsFor('lavabo', st).map((o) => o.action).filter((a) => a.type !== 'world')
  expect(story(s)).toEqual([
    { type: 'open', overlay: 'brush' },
    { type: 'open', overlay: 'wash' },
  ])
  const done = { ...s, tasks: { ...s.tasks, brushed: true } }
  expect(story(done)).toEqual([{ type: 'open', overlay: 'wash' }])
})

test('key spots offer a search until the keys are found or the spot was searched', () => {
  const s = room()
  const searches = (st: StoryState) => actionsFor('fridge', st).filter((o) => o.action.type === 'search').map((o) => o.action)
  expect(searches(s)).toEqual([{ type: 'search', id: 'fridge' }])
  expect(searches({ ...s, searched: ['fridge'] })).toEqual([])
  expect(searches({ ...s, tasks: { ...s.tasks, keys: true } })).toEqual([])
})

test('the wardrobe offers clothes and a search', () => {
  const kinds = actionsFor('wardrobe', room()).map((o) => o.action.type)
  expect(kinds).toEqual(['open', 'search'])
})

describe('usable props', () => {
  const world = { bathDoorOpen: true, water: { lavabo: false, sink: false, shower: false }, lightsOn: true }
  const labels = (id: string, w = world) => actionsFor(id, room(), w).map((o) => o.label)

  test('the bathroom door can be closed, then opened', () => {
    expect(labels('bathDoor')).toEqual(['Đóng cửa'])
    expect(labels('bathDoor', { ...world, bathDoorOpen: false })).toEqual(['Mở cửa'])
  })

  test('the lavabo and kitchen taps turn on and off', () => {
    expect(labels('lavabo')).toContain('Vặn vòi')
    expect(labels('lavabo', { ...world, water: { ...world.water, lavabo: true } })).toContain('Khóa vòi')
    expect(labels('kitchen')).toContain('Vặn vòi')
  })

  test('the shower, toilet and light switch can be used', () => {
    expect(labels('shower')).toEqual(['Bật vòi sen'])
    expect(labels('toilet')).toEqual(['Đi vệ sinh'])
    expect(labels('lightSwitch')).toEqual(['Tắt đèn'])
    expect(labels('lightSwitch', { ...world, lightsOn: false })).toEqual(['Bật đèn'])
  })

  test('standing in the passage by the bathroom picks the bathroom door, not the front door', () => {
    expect(nearestInteractable({ x: 2.62, z: 0.73 })?.id).toBe('bathDoor')
  })
})

describe('front door', () => {
  test('offers helmets, then leaving', () => {
    const s = room()
    expect(actionsFor('door', s).map((o) => o.action)).toEqual([
      { type: 'takeHelmets', n: 2 },
      { type: 'takeHelmets', n: 1 },
      { type: 'leave' },
    ])
    const both = { ...s, tasks: { ...s.tasks, helmets: 2 as const } }
    expect(actionsFor('door', both).map((o) => o.action)).toEqual([{ type: 'leave' }])
  })
})

describe('bathroom door from inside', () => {
  test('inside the bathroom, by the doorway, the door can be used too', () => {
    expect(nearestInteractable({ x: 3.3, z: 0.75 })?.id).toBe('bathDoorIn')
    const world = { bathDoorOpen: false, water: { lavabo: false, sink: false, shower: false }, lightsOn: true }
    expect(actionsFor('bathDoorIn', room(), world).map((o) => o.label)).toEqual(['Mở cửa'])
  })
})

describe('fridge and computer', () => {
  const world = { bathDoorOpen: true, water: { lavabo: false, sink: false, shower: false }, lightsOn: true, fridgeOpen: false, sitting: false }
  const labels = (id: string, w = world) => actionsFor(id, room(), w).map((o) => o.label)

  test('the fridge opens; open, it offers a drink and closing', () => {
    expect(labels('fridge')).toContain('Mở tủ lạnh')
    expect(labels('fridge', { ...world, fridgeOpen: true })).toEqual(expect.arrayContaining(['Uống nước', 'Đóng tủ lạnh']))
  })

  test('at the desk Anh can sit; sitting, he can browse, check mail or stand up', () => {
    expect(labels('deskMine')).toContain('Ngồi máy tính')
    expect(labels('deskMine', { ...world, sitting: true })).toEqual(['Lướt mạng', 'Check mail công ty', 'Đứng dậy'])
  })
})
