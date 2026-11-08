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

test('Em’s hint is shown while trying clothes on', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/áo trắng/i)).toBeVisible()
})

test('the ‹ › buttons try on the next piece and show its name', async () => {
  render(<Wardrobe />)
  expect(screen.getByText('Áo ngủ')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Áo tiếp' }))
  expect(screen.queryByText('Áo ngủ')).toBeNull()
  expect(useDraft.getState().draft.top).not.toBe('pyjama')
  await userEvent.click(screen.getByRole('button', { name: 'Áo trước' }))
  expect(screen.getByText('Áo ngủ')).toBeVisible()
})

test('trying on then pressing Mặc dresses Anh', async () => {
  render(<Wardrobe />)
  act(() => {
    useDraft.getState().reset({ top: 'teeWhite', bottom: 'khaki', shoes: 'sneakers', raincoat: false })
  })
  await userEvent.click(screen.getByRole('button', { name: /Áo mưa/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Mặc' }))
  const s = useStory.getState().s
  expect(s.outfit).toEqual({ top: 'teeWhite', bottom: 'khaki', shoes: 'sneakers', raincoat: true })
  expect(s.tasks.dressed).toBe(true)
  expect(s.overlay).toBeNull()
})

test('the junk line shows when junk was tapped in the wardrobe', () => {
  render(<Wardrobe />)
  act(() => {
    useDraft.getState().pick({ kind: 'junk', id: 'socks', rot: 0 })
  })
  expect(screen.getByText(/tất/i, { selector: '.game-line' })).toBeVisible()
})

test('on a rainy day it reminds about the raincoat', () => {
  render(<Wardrobe />)
  expect(screen.getByText(/trời mưa/i)).toBeVisible()
})
