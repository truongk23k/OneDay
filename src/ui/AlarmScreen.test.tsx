import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { AlarmScreen } from './AlarmScreen'
import { EndCard } from './EndCard'

beforeEach(() => useStory.setState({ s: initialState(1) }))

test('shows the time and the weather', () => {
  render(<AlarmScreen />)
  expect(screen.getByText('7:30')).toBeVisible()
  expect(screen.getByText(/Hôm nay trời (nắng|mưa)/)).toBeVisible()
})

test('snooze adds 5 minutes and shows a line', async () => {
  render(<AlarmScreen />)
  await userEvent.click(screen.getByRole('button', { name: 'Báo lại 5 phút' }))
  expect(screen.getByText('7:35')).toBeVisible()
  expect(screen.getByText('5 phút nữa thôi…')).toBeVisible()
})

test('Dậy starts the room phase and hides the alarm', async () => {
  render(<AlarmScreen />)
  await userEvent.click(screen.getByRole('button', { name: 'Dậy' }))
  expect(useStory.getState().s.phase).toBe('room')
  expect(screen.queryByRole('button', { name: 'Dậy' })).toBeNull()
})

test('oversleeping shows the oversleep card, and Chơi lại starts over', async () => {
  render(
    <>
      <AlarmScreen />
      <EndCard />
    </>,
  )
  // Ngủ tới 8:15: chín lần báo lại.
  for (let i = 0; i < 9; i++) await userEvent.click(screen.getByRole('button', { name: 'Báo lại 5 phút' }))
  expect(screen.getByText('Ngủ quên!')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Chơi lại' }))
  expect(useStory.getState().s.phase).toBe('alarm')
  expect(useStory.getState().s.minutes).toBe(450)
})
