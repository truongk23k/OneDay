import { act } from '@testing-library/react'
import { newBike } from '../../ride/bike'
import { MARKERS } from '../../ride/city'
import { useRide } from '../../ride/store'
import { initialState, type StoryState } from '../../story/state'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { RING, openPhone, usePhone } from './phoneStore'

const set = (over: Partial<StoryState>) => useStory.setState({ s: { ...initialState(1), ...over } })

beforeEach(() => {
  vi.useFakeTimers()
  useRide.getState().reset()
  usePhone.getState().reset()
})
afterEach(() => vi.useRealTimers())

test('opening the phone shows the home screen, or a given app', () => {
  set({ phase: 'room' })
  openPhone()
  expect(useStory.getState().s.overlay).toBe('phone')
  expect(usePhone.getState().app).toBe('home')
  openPhone('messages')
  expect(usePhone.getState().app).toBe('messages')
})

test('on the street the phone only opens when the bike is stopped', () => {
  set({ phase: 'street', stage: 'toEm' })
  useRide.setState({ bike: { ...newBike(100, 0, 0), speed: 6 } })
  expect(openPhone()).toBe(false)
  expect(useStory.getState().s.overlay).toBeNull()
  expect(useStory.getState().s.line).toBe(S.phone.stopFirst)
  useRide.setState({ bike: newBike(100, 0, 0) })
  expect(openPhone()).toBe(true)
})

test('closing the phone goes back to the home screen next time', () => {
  set({ phase: 'room' })
  openPhone('bank')
  act(() => useStory.getState().dispatch({ type: 'close' }))
  expect(usePhone.getState().app).toBe('home')
})

test('calling Em at her door rings her phone; she comes out', () => {
  set({ phase: 'street', stage: 'toEm', minutes: 480 })
  useRide.setState({ bike: newBike(MARKERS.emHouse.x, MARKERS.emHouse.z, 0), atEmDoor: true })
  openPhone('call')
  usePhone.getState().dial('em')
  expect(useRide.getState().em).toBe('ringing')
  expect(usePhone.getState().call).toMatchObject({ who: 'em', phase: 'ringing' })
})

test('calling Em from the room cheers her up and she answers', () => {
  set({ phase: 'room', mood: 60 })
  usePhone.getState().dial('em')
  expect(usePhone.getState().call?.phase).toBe('ringing')
  act(() => vi.advanceTimersByTime(RING * 1000 + 10))
  expect(usePhone.getState().call).toMatchObject({ phase: 'talking', text: S.phone.em.room })
  expect(useStory.getState().s.mood).toBe(63)
})

test('calling Em on the way but not at her door: she asks to call from the door', () => {
  set({ phase: 'street', stage: 'toEm' })
  usePhone.getState().dial('em')
  act(() => vi.advanceTimersByTime(RING * 1000 + 10))
  expect(usePhone.getState().call?.text).toBe(S.phone.em.notThere)
  expect(useRide.getState().em).toBe('home')
})

test('calling the boss warns him', () => {
  set({ phase: 'street', stage: 'sprint' })
  usePhone.getState().dial('boss')
  act(() => vi.advanceTimersByTime(RING * 1000 + 10))
  expect(useStory.getState().s.warnedBoss).toBe(true)
  expect(usePhone.getState().call?.text).toBe(S.phone.boss.first)
})

test('hanging up ends the call', () => {
  set({ phase: 'room' })
  usePhone.getState().dial('mom')
  usePhone.getState().hangUp()
  expect(usePhone.getState().call).toBeNull()
  act(() => vi.advanceTimersByTime(RING * 1000 + 10))
  expect(usePhone.getState().call).toBeNull()
})
