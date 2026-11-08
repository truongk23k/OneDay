import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { EndCard } from './EndCard'

test('after leaving the room the card sums up the morning and can restart', async () => {
  const s = initialState(1)
  useStory.setState({
    s: { ...s, phase: 'left', minutes: 482.4, hygiene: 75, mood: 70, tasks: { ...s.tasks, brushed: true, keys: true, helmets: 2 } },
  })
  render(<EndCard />)
  expect(screen.getByText('8:02')).toBeVisible()
  expect(screen.getByText('Đánh răng').closest('li')).toHaveClass('done')
  expect(screen.getByText('Rửa mặt').closest('li')).not.toHaveClass('done')
  await userEvent.click(screen.getByRole('button', { name: 'Chơi lại' }))
  expect(useStory.getState().s.phase).toBe('alarm')
})
