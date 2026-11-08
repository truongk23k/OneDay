import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { BrushGame } from './BrushGame'
import { WashGame } from './WashGame'

const start = (overlay: 'brush' | 'wash', pasteFirst = true) =>
  useStory.setState({ s: { ...initialState(1), phase: 'room', overlay, pasteFirst } })

afterEach(() => vi.useRealTimers())

test('picking the face wash by mistake costs 2 minutes and says so', async () => {
  start('brush', true)
  render(<BrushGame isTouch={false} />)
  const tubes = screen.getAllByRole('button', { name: /Tuýp/ })
  await userEvent.click(tubes[1])
  expect(useStory.getState().s.minutes).toBe(452)
  expect(screen.getByText(/sữa rửa mặt/i)).toBeVisible()
})

test('picking the toothpaste then alternating A/D finishes brushing', async () => {
  start('brush', true)
  render(<BrushGame isTouch={false} />)
  await userEvent.click(screen.getAllByRole('button', { name: /Tuýp/ })[0])
  for (let i = 0; i < 20; i++) await userEvent.keyboard(i % 2 === 0 ? 'a' : 'd')
  const s = useStory.getState().s
  expect(s.tasks.brushed).toBe(true)
  expect(s.overlay).toBeNull()
})

test('releasing the wash button in the green zone washes the face', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  start('wash')
  render(<WashGame />)
  const btn = screen.getByRole('button', { name: /Giữ/ })
  vi.setSystemTime(1000)
  fireEvent.pointerDown(btn)
  vi.setSystemTime(1000 + 1200)
  fireEvent.pointerUp(btn)
  expect(useStory.getState().s.tasks.washed).toBe(true)
})

test('releasing too early splashes and costs a minute', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  start('wash')
  render(<WashGame />)
  const btn = screen.getByRole('button', { name: /Giữ/ })
  vi.setSystemTime(1000)
  fireEvent.pointerDown(btn)
  vi.setSystemTime(1000 + 400)
  fireEvent.pointerUp(btn)
  const s = useStory.getState().s
  expect(s.tasks.washed).toBe(false)
  expect(s.minutes).toBe(451)
})
