import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useWorld } from '../room/world'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { DanceButton } from './DanceButton'

beforeEach(() => {
  useStory.setState({ s: { ...initialState(1), phase: 'room' } })
  act(() => useWorld.getState().reset())
})

test('the dance button lists the dances and plays the chosen one', async () => {
  render(<DanceButton />)
  await userEvent.click(screen.getByRole('button', { name: /Nhảy/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Xoay vòng' }))
  expect(useWorld.getState().transient?.pose).toBe('danceSpin')
  expect(screen.queryByRole('button', { name: 'Xoay vòng' })).toBeNull()
})

test('G dances, and pressing it again switches to the next dance', () => {
  render(<DanceButton />)
  fireEvent.keyDown(window, { code: 'KeyG' })
  expect(useWorld.getState().transient?.pose).toBe('danceTiktok')
  fireEvent.keyDown(window, { code: 'KeyG' })
  expect(useWorld.getState().transient?.pose).toBe('danceHips')
})
