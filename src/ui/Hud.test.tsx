import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useWorld } from '../room/world'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { Checklist, Clock, InteractPrompt } from './Hud'

beforeEach(() => useStory.setState({ s: { ...initialState(1), phase: 'room' } }))

test('clock shows the game time and follows it', () => {
  render(<Clock />)
  expect(screen.getByText('7:30')).toBeVisible()
  act(() => useStory.setState({ s: { ...useStory.getState().s, minutes: 471.4 } }))
  expect(screen.getByText('7:51')).toBeVisible()
})

test('checklist marks done tasks', () => {
  const s = useStory.getState().s
  useStory.setState({ s: { ...s, tasks: { ...s.tasks, brushed: true, helmets: 2 } } })
  render(<Checklist />)
  expect(screen.getByText('Đánh răng').closest('li')).toHaveClass('done')
  expect(screen.getByText('Rửa mặt').closest('li')).not.toHaveClass('done')
  expect(screen.getByText(/Lấy mũ bảo hiểm/).closest('li')).toHaveClass('done')
})

test('no prompt when nothing is in reach', () => {
  const { container } = render(<InteractPrompt targetId={null} isTouch={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('prompt lists the options; clicking one runs it', async () => {
  render(<InteractPrompt targetId="lavabo" isTouch={true} />)
  await userEvent.click(screen.getByRole('button', { name: 'Đánh răng' }))
  expect(useStory.getState().s.overlay).toBe('brush')
})

test('E runs the first option on desktop', async () => {
  render(<InteractPrompt targetId="lavabo" isTouch={false} />)
  await userEvent.keyboard('e')
  expect(useStory.getState().s.overlay).toBe('brush')
})

test('holding E does not repeat the action', () => {
  render(<InteractPrompt targetId="toilet" isTouch={false} />)
  fireEvent.keyDown(window, { code: 'KeyE' })
  fireEvent.keyDown(window, { code: 'KeyE', repeat: true })
  fireEvent.keyDown(window, { code: 'KeyE', repeat: true })
  // Chỉ lần bấm đầu (Đi tè, +1 phút) được tính.
  expect(useStory.getState().s.minutes).toBe(451)
})

test('restart also resets the world store', () => {
  useWorld.getState().toggleLights()
  act(() => useStory.getState().dispatch({ type: 'restart', seed: 5 }))
  expect(useWorld.getState().lightsOn).toBe(true)
})
