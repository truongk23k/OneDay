import { act, fireEvent, render, screen } from '@testing-library/react'
import { newBike } from '../ride/bike'
import { LIGHTS } from '../ride/city'
import { rideInput, useRide } from '../ride/store'
import { lightState } from '../ride/traffic'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { useGame } from '../store'
import { RideHud } from './RideHud'

beforeEach(() => {
  useStory.setState({ s: { ...initialState(1), phase: 'street', stage: 'toEm', minutes: 480 } })
  useRide.getState().reset()
  Object.assign(rideInput, { throttle: 0, brake: 0, steer: 0 })
  useGame.getState().setMapOpen(false)
  useGame.getState().setHelpOpen(false)
})

test('shows the clock and where to go next', () => {
  render(<RideHud isTouch={false} />)
  expect(screen.getByText('8:00')).toBeVisible()
  expect(screen.getByText(/Nhà Em/)).toBeVisible()
})

test('touch pedals: holding Ga and ▶ together, releasing each', () => {
  render(<RideHud isTouch={true} />)
  const gas = screen.getByRole('button', { name: 'Ga' })
  const right = screen.getByRole('button', { name: 'Rẽ phải' })
  fireEvent.pointerDown(gas, { pointerId: 1 })
  fireEvent.pointerDown(right, { pointerId: 2 })
  expect(rideInput.throttle).toBe(1)
  expect(rideInput.steer).toBe(1)
  fireEvent.pointerUp(right, { pointerId: 2 })
  expect(rideInput.steer).toBe(0)
  expect(rideInput.throttle).toBe(1)
  fireEvent.pointerUp(gas, { pointerId: 1 })
  expect(rideInput.throttle).toBe(0)
})

test('Em’s mood heart shows only while she rides', () => {
  const { rerender } = render(<RideHud isTouch={false} />)
  expect(screen.queryByLabelText('Tâm trạng Em')).toBeNull()
  act(() => useStory.setState({ s: { ...useStory.getState().s, stage: 'withEm' } }))
  rerender(<RideHud isTouch={false} />)
  expect(screen.getByLabelText('Tâm trạng Em')).toBeVisible()
})

test('warns about the light at the next crossing', () => {
  const l = LIGHTS[2]
  let time = 0
  while (lightState(2, time, 'x') !== 'red') time += 0.1
  useRide.setState({ bike: newBike(l.x - 20, l.z + 2, -Math.PI / 2), time })
  render(<RideHud isTouch={false} />)
  expect(screen.getByText('Đèn đỏ')).toBeVisible()
})

test('no light warning on an open road', () => {
  render(<RideHud isTouch={false} />)
  expect(screen.queryByText(/^Đèn /)).toBeNull()
})

test('at Em’s door the HUD offers a call, then shows the phone ringing', async () => {
  useRide.setState({ bike: newBike(300, -100, 0), atEmDoor: true })
  render(<RideHud isTouch={true} />)
  fireEvent.click(screen.getByRole('button', { name: /Gọi Em/ }))
  expect(useRide.getState().em).toBe('ringing')
  expect(await screen.findByText('Đang gọi Em ❤️…')).toBeVisible()
  expect(screen.queryByRole('button', { name: /Gọi Em/ })).toBeNull()
})

test('the minimap opens a big map that pauses the ride, and closes again', () => {
  render(<RideHud isTouch={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Bản đồ' }))
  expect(useGame.getState().paused).toBe(true)
  expect(screen.getByRole('dialog', { name: 'Bản đồ' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
  expect(useGame.getState().paused).toBe(false)
})

test('leaving the street with the map open does not leave the game paused', () => {
  const { unmount } = render(<RideHud isTouch={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Bản đồ' }))
  unmount()
  expect(useGame.getState().paused).toBe(false)
})

test('inside the stop ring the arrow becomes a pin instead of spinning', () => {
  useRide.setState({ bike: newBike(301, -99, -Math.PI / 2) })
  render(<RideHud isTouch={false} />)
  expect(screen.getByText('📍')).toBeVisible()
  expect(screen.queryByText('▲')).toBeNull()
})
