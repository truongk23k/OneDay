import { initialState, reducer, type StoryState } from '../story/state'
import { loopsFor, storyCues, worldCues, type WorldView } from './cues'

const room = (over: Partial<StoryState> = {}): StoryState => ({ ...initialState(1), phase: 'room', ...over })
const world: WorldView = { bathDoorOpen: true, lightsOn: true, fridgeOpen: false, stoveOn: false, water: { lavabo: false, sink: false, shower: false }, pose: null }

describe('story cues', () => {
  test('a new message from Em dings', () => {
    const before = room({ minutes: 452 })
    const after = reducer({ ...before, minutes: 453 }, { type: 'tick', realDt: 0 })
    expect(storyCues(before, after)).toContain('message')
  })

  test('finding the keys plays the key jingle; a wrong spot only rummages', () => {
    const s = room()
    const wrong = ['bed', 'wardrobe', 'fridge', 'deskMine', 'kitchen', 'shelf'].find((k) => k !== s.keySpot)!
    expect(storyCues(s, reducer(s, { type: 'search', id: wrong }))).toEqual(['search'])
    expect(storyCues(s, reducer(s, { type: 'search', id: s.keySpot }))).toEqual(['keyFound'])
  })

  test('finishing a morning task cheers, a mistake buzzes', () => {
    const s = room()
    expect(storyCues(s, reducer(s, { type: 'brushDone' }))).toContain('taskDone')
    expect(storyCues(s, reducer(s, { type: 'wrongTube' }))).toContain('wrong')
  })

  test('leaving opens the door; picking Em up, dropping her and arriving each have a jingle', () => {
    const ready = room({ tasks: { ...room().tasks, keys: true, brushed: true, washed: true } })
    const out = reducer(ready, { type: 'leave' })
    expect(storyCues(ready, out)).toContain('door')
    const street = { ...out, minutes: 480 }
    const withEm = reducer(street, { type: 'pickup' })
    expect(storyCues(street, withEm)).toContain('pickup')
    const sprint = reducer(withEm, { type: 'dropoff' })
    expect(storyCues(withEm, sprint)).toContain('dropoff')
    const done = reducer(sprint, { type: 'arrive' })
    expect(storyCues(sprint, done)).toEqual(expect.arrayContaining(['arrive']))
  })

  test('the ending plays a happy or a sad tune', () => {
    const sprint: StoryState = { ...room(), phase: 'street', stage: 'sprint', minutes: 500, mood: 90, hygiene: 90, tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 } }
    expect(storyCues(sprint, reducer(sprint, { type: 'arrive' }))).toContain('endingGood')
    const late = { ...sprint, minutes: 515 }
    expect(storyCues(late, reducer(late, { type: 'arrive' }))).toContain('endingBad')
    const alarm: StoryState = { ...initialState(1), minutes: 475 }
    expect(storyCues(alarm, reducer(alarm, { type: 'snooze' }))).toContain('endingBad')
  })

  test('getting fined rings the till', () => {
    const s: StoryState = { ...room(), phase: 'street', stage: 'toEm' }
    expect(storyCues(s, reducer(s, { type: 'busted', reason: 'redLight', fled: false }))).toEqual(expect.arrayContaining(['whistle', 'cash']))
  })

  test('opening and closing the phone swish', () => {
    const s = room()
    const open = reducer(s, { type: 'open', overlay: 'phone' })
    expect(storyCues(s, open)).toContain('phoneOpen')
    expect(storyCues(open, reducer(open, { type: 'close' }))).toContain('phoneClose')
  })

  test('nothing changes, nothing plays', () => {
    const s = room()
    expect(storyCues(s, s)).toEqual([])
  })
})

describe('world cues', () => {
  test('door, light switch and fridge make their sounds', () => {
    expect(worldCues(world, { ...world, bathDoorOpen: false })).toEqual(['door'])
    expect(worldCues(world, { ...world, lightsOn: false })).toEqual(['switch'])
    expect(worldCues(world, { ...world, fridgeOpen: true })).toEqual(['fridge'])
  })

  test('peeing or pooping ends with a flush; drinking gulps', () => {
    expect(worldCues(world, { ...world, pose: 'pee' })).toEqual(['flush'])
    expect(worldCues(world, { ...world, pose: 'poop' })).toEqual(['flush'])
    expect(worldCues(world, { ...world, pose: 'drink' })).toEqual(['gulp'])
  })
})

describe('loops', () => {
  const ride = { police: false, ringing: false }

  test('the alarm rings until Anh wakes, with no music over it', () => {
    const l = loopsFor({ ...initialState(1) }, world, ride)
    expect(l.alarm).toBe(true)
    expect(l.music).toBeNull()
  })

  test('in the room: morning music, birds, and running water when a tap is on', () => {
    const l = loopsFor(room(), { ...world, water: { ...world.water, lavabo: true } }, ride)
    expect(l).toMatchObject({ alarm: false, music: 'room', ambience: 'room', tap: true, shower: false })
  })

  test('on the street: driving music, traffic, the engine; rain when it rains; the siren drowns the music', () => {
    const s: StoryState = { ...room(), phase: 'street', stage: 'toEm', weather: 'rain' }
    expect(loopsFor(s, world, ride)).toMatchObject({ music: 'street', ambience: 'street', engine: true, rain: true, tap: false })
    expect(loopsFor(s, world, { ...ride, police: true }).music).toBeNull()
  })

  test('the phone rings while a call is ringing', () => {
    expect(loopsFor(room(), world, { ...ride, ringing: true }).ringtone).toBe(true)
  })

  test('at the end everything goes quiet except the ending tune', () => {
    const s: StoryState = { ...room(), phase: 'street', stage: 'done' }
    expect(loopsFor(s, world, ride)).toMatchObject({ music: null, engine: false, ambience: 'street' })
  })
})

test('shaking off the police whooshes', () => {
  const s: StoryState = { ...initialState(1), phase: 'street', stage: 'toEm' }
  expect(storyCues(s, reducer(s, { type: 'escaped' }))).toContain('escaped')
})

test('replying to Em plays the sent whoosh', () => {
  let s: StoryState = { ...initialState(1), phase: 'room', minutes: 453 }
  s = reducer(s, { type: 'tick', realDt: 0 })
  const sent = reducer(s, { type: 'chatReply', index: 0 })
  expect(storyCues(s, sent)).toContain('sent')
})
