import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HINTS } from '../story/outfit'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { Wardrobe } from './Wardrobe'

beforeEach(() =>
  useStory.setState({ s: { ...initialState(1), phase: 'room', overlay: 'wardrobe', weather: 'rain', hint: HINTS.findIndex((h) => h.id === 'white') } }),
)

test('Em’s hint is shown at the top of the wardrobe', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/áo trắng/i)).toBeVisible()
})

test('picking clothes from the pile and pressing Mặc dresses Anh', async () => {
  render(<Wardrobe />)
  await userEvent.click(screen.getByRole('button', { name: 'Áo phông trắng' }))
  await userEvent.click(screen.getByRole('button', { name: 'Quần short kaki be' }))
  await userEvent.click(screen.getByRole('button', { name: 'Giày thể thao trắng' }))
  await userEvent.click(screen.getByRole('button', { name: 'Áo mưa' }))
  await userEvent.click(screen.getByRole('button', { name: 'Mặc' }))
  const s = useStory.getState().s
  expect(s.outfit).toEqual({ top: 'teeWhite', bottom: 'khaki', shoes: 'sneakers', raincoat: true })
  expect(s.tasks.dressed).toBe(true)
  expect(s.overlay).toBeNull()
})

test('tapping junk shows a funny line and costs time', async () => {
  render(<Wardrobe />)
  await userEvent.click(screen.getByRole('button', { name: 'Tất thối' }))
  expect(useStory.getState().s.minutes).toBe(450.5)
  expect(screen.getByText(/tất/i, { selector: '.game-line' })).toBeVisible()
})

test('on a rainy day the wardrobe reminds about the raincoat', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/trời mưa/i)).toBeVisible()
})
