import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialState } from '../story/state'
import { useStory } from '../story/store'
import { Wardrobe } from './Wardrobe'

beforeEach(() => useStory.setState({ s: { ...initialState(1), phase: 'room', overlay: 'wardrobe', weather: 'rain' } }))

test('choosing clothes and pressing Mặc dresses Anh and closes the wardrobe', async () => {
  render(<Wardrobe />)
  await userEvent.click(screen.getByRole('button', { name: 'Áo phông đen' }))
  await userEvent.click(screen.getByRole('button', { name: 'Quần short kaki be' }))
  await userEvent.click(screen.getByRole('button', { name: 'Giày thể thao trắng' }))
  await userEvent.click(screen.getByRole('checkbox', { name: /áo mưa/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Mặc' }))
  const s = useStory.getState().s
  expect(s.outfit).toEqual({ top: 'teeBlack', bottom: 'khaki', shoes: 'sneakers', raincoat: true })
  expect(s.tasks.dressed).toBe(true)
  expect(s.overlay).toBeNull()
})

test('on a rainy day the wardrobe reminds about the raincoat', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/trời mưa/i)).toBeVisible()
})
