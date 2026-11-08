import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BEATS } from '../story/chat'
import { initialState, reducer } from '../story/state'
import { useStory } from '../story/store'
import { Phone, PhoneButton } from './Phone'

beforeEach(() => {
  const s = reducer({ ...initialState(1), phase: 'room', minutes: BEATS[0].at }, { type: 'tick', realDt: 0 })
  useStory.setState({ s })
})

test('the phone button shows how many messages are unread and opens the chat', async () => {
  render(<PhoneButton />)
  expect(screen.getByText('1')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: /Điện thoại/ }))
  expect(useStory.getState().s.overlay).toBe('phone')
})

test('the chat shows Em’s message and replying updates the conversation', async () => {
  act(() => useStory.getState().dispatch({ type: 'open', overlay: 'phone' }))
  render(<Phone />)
  expect(screen.getByText('Dậy chưa anh? 😴')).toBeVisible()
  expect(useStory.getState().s.chat.unread).toBe(0)
  await userEvent.click(screen.getByRole('button', { name: BEATS[0].replies[0].text }))
  expect(screen.getByText(BEATS[0].replies[0].answer)).toBeVisible()
  expect(screen.queryByRole('button', { name: BEATS[0].replies[1].text })).toBeNull()
})
