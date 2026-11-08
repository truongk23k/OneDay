import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { EndCard } from './EndCard'

const arrived = (over = {}) => {
  const s = initialState(1)
  useStory.setState({
    s: {
      ...s,
      phase: 'street',
      stage: 'done',
      minutes: 506.4,
      mood: 80,
      hygiene: 90,
      tasks: { brushed: true, washed: true, dressed: true, texted: true, keys: true, helmets: 2 },
      ...over,
    },
  })
}

test('arriving at the office shows the ending, the time and a restart', async () => {
  arrived()
  render(<EndCard />)
  expect(screen.getByText('Nhân viên gương mẫu, người yêu quốc dân')).toBeVisible()
  expect(screen.getByText('8:26')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Chơi lại' }))
  expect(useStory.getState().s.phase).toBe('alarm')
})

test('when Em is upset her text shows', () => {
  arrived({ mood: 20 })
  render(<EndCard />)
  expect(screen.getByText('Mai em tự đi làm ko cần đón')).toBeVisible()
})

test('nothing shows while still riding', () => {
  arrived({ stage: 'withEm' })
  const { container } = render(<EndCard />)
  expect(container).toBeEmptyDOMElement()
})
