import { act, fireEvent, render, screen } from '@testing-library/react'
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

test('picking the toothpaste shows the teeth to scrub', async () => {
  start('brush', true)
  render(<BrushGame isTouch={false} />)
  await userEvent.click(screen.getAllByRole('button', { name: /Tuýp/ })[0])
  expect(screen.getByRole('img', { name: 'Hàm răng' })).toBeVisible()
})

const hold = (btn: HTMLElement, from: number, ms: number) => {
  vi.setSystemTime(from)
  fireEvent.pointerDown(btn)
  vi.setSystemTime(from + ms)
  fireEvent.pointerUp(btn)
}

test('three good releases (faster each round) wash the face', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  start('wash')
  render(<WashGame />)
  const btn = screen.getByRole('button', { name: /Giữ/ })
  hold(btn, 1000, 1200)
  expect(useStory.getState().s.tasks.washed).toBe(false)
  expect(screen.getByText('Lượt 2/3')).toBeVisible()
  hold(btn, 5000, 600)
  hold(btn, 9000, 675)
  expect(useStory.getState().s.tasks.washed).toBe(true)
})

test('releasing too early splashes, costs a minute and repeats the round', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  start('wash')
  render(<WashGame />)
  const btn = screen.getByRole('button', { name: /Giữ/ })
  hold(btn, 1000, 400)
  const s = useStory.getState().s
  expect(s.tasks.washed).toBe(false)
  expect(s.minutes).toBe(451)
  expect(screen.getByText('Lượt 1/3')).toBeVisible()
})

describe('teeth canvas', () => {
  const fakeCtx = () => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
  })

  test('draws without roundRect (iOS 15) instead of crashing', async () => {
    const ctx = fakeCtx()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    start('brush', true)
    render(<BrushGame isTouch={false} />)
    await userEvent.click(screen.getAllByRole('button', { name: /Tuýp/ })[0])
    expect(ctx.rect).toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  test('reopening the brush redraws the teeth', async () => {
    const ctx = fakeCtx()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    start('brush', true)
    render(<BrushGame isTouch={false} />)
    await userEvent.click(screen.getAllByRole('button', { name: /Tuýp/ })[0])
    const before = ctx.clearRect.mock.calls.length
    act(() => useStory.getState().dispatch({ type: 'close' }))
    act(() => useStory.getState().dispatch({ type: 'open', overlay: 'brush' }))
    expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(before)
    vi.restoreAllMocks()
  })

  test('a new run starts brushing from the tube pick again', async () => {
    start('brush', true)
    render(<BrushGame isTouch={false} />)
    await userEvent.click(screen.getAllByRole('button', { name: /Tuýp/ })[1])
    act(() => useStory.getState().dispatch({ type: 'restart', seed: 77 }))
    act(() => useStory.setState({ s: { ...useStory.getState().s, phase: 'room', overlay: 'brush' } }))
    expect(screen.getAllByRole('button', { name: /Tuýp/ }).every((b) => !(b as HTMLButtonElement).disabled)).toBe(true)
    expect(screen.queryByText(/sữa rửa mặt/i)).toBeNull()
  })
})
