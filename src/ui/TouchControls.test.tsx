import { act, render } from '@testing-library/react'
import { input } from '../player/input'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { TouchControls } from './TouchControls'

// Raw DOM events, not fireEvent: fireEvent wraps in act() and would hide React's deferred updates.
const pe = (type: string, x: number, y: number) =>
  new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'touch', clientX: x, clientY: y })

beforeEach(() => useStory.setState({ s: { ...initialState(1), phase: 'room' } }))

afterEach(() => {
  input.move = { x: 0, y: 0 }
})

test('joystick move updates input.move immediately', () => {
  const { container } = render(<TouchControls />)
  const layer = container.querySelector('.touch-layer')!
  act(() => {
    layer.dispatchEvent(pe('pointerdown', 100, 300))
  })
  layer.dispatchEvent(pe('pointermove', 100, 240))
  expect(input.move.y).toBeCloseTo(1)
})

test('lifting the joystick thumb stops Anh even before React renders the last move', async () => {
  const { container } = render(<TouchControls />)
  const layer = container.querySelector('.touch-layer')!
  act(() => {
    layer.dispatchEvent(pe('pointerdown', 100, 300))
  })
  layer.dispatchEvent(pe('pointermove', 100, 240))
  await Promise.resolve()
  layer.dispatchEvent(pe('pointerup', 100, 240))
  await act(async () => {})
  expect(input.move).toEqual({ x: 0, y: 0 })
})

test('touch controls step aside while a screen (wardrobe, phone…) is open', () => {
  useStory.setState({ s: { ...initialState(1), phase: 'room', overlay: 'wardrobe' } })
  const { container } = render(<TouchControls />)
  expect(container.querySelector('.touch-layer')).toBeNull()
})

test('opening a screen mid-drag releases the joystick, and it works again afterwards', () => {
  const { container } = render(<TouchControls />)
  const layer = () => container.querySelector('.touch-layer')!
  act(() => {
    layer().dispatchEvent(pe('pointerdown', 100, 300))
  })
  layer().dispatchEvent(pe('pointermove', 100, 200))
  expect(input.move.y).toBeGreaterThan(0.5)
  act(() => useStory.setState({ s: { ...useStory.getState().s, overlay: 'brush' } }))
  expect(input.move).toEqual({ x: 0, y: 0 })
  expect(input.sprint).toBe(false)
  act(() => useStory.setState({ s: { ...useStory.getState().s, overlay: null } }))
  const second = (type: string, x: number, y: number) =>
    new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: y })
  act(() => {
    layer().dispatchEvent(second('pointerdown', 120, 300))
  })
  layer().dispatchEvent(second('pointermove', 120, 240))
  expect(input.move.y).toBeCloseTo(1)
})
