import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HINTS } from '../story/outfit'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { useDraft } from '../story/wardrobeDraft'
import { Wardrobe } from './Wardrobe'

beforeEach(() =>
  useStory.setState({ s: { ...initialState(1), phase: 'room', overlay: 'wardrobe', weather: 'rain', hint: HINTS.findIndex((h) => h.id === 'white') } }),
)

test('Em’s hint is shown at the top of the open wardrobe', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/áo trắng/i)).toBeVisible()
})

test('Mặc dresses Anh in what was picked inside the wardrobe', async () => {
  render(<Wardrobe />)
  act(() => {
    const { pick } = useDraft.getState()
    pick({ kind: 'item', id: 'teeWhite', rot: 0 })
    pick({ kind: 'item', id: 'khaki', rot: 0 })
    pick({ kind: 'item', id: 'sneakers', rot: 0 })
    pick({ kind: 'raincoat', id: 'raincoat', rot: 0 })
  })
  await userEvent.click(screen.getByRole('button', { name: 'Mặc' }))
  const s = useStory.getState().s
  expect(s.outfit).toEqual({ top: 'teeWhite', bottom: 'khaki', shoes: 'sneakers', raincoat: true })
  expect(s.tasks.dressed).toBe(true)
  expect(s.overlay).toBeNull()
})

test('the junk line shows when junk was picked', () => {
  render(<Wardrobe />)
  act(() => {
    useDraft.getState().pick({ kind: 'junk', id: 'socks', rot: 0 })
  })
  expect(screen.getByText(/tất/i, { selector: '.game-line' })).toBeVisible()
})

test('on a rainy day the wardrobe reminds about the raincoat', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/trời mưa/i)).toBeVisible()
})
