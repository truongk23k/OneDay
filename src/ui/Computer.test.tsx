import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useWorld } from '../room/world'
import { BEATS } from '../story/chat'
import { initialState, reducer } from '../story/state'
import { useStory } from '../story/store'
import { Computer } from './Computer'
import { usePc } from './computer/pcStore'
import { InteractPrompt } from './Hud'

const openPc = () => act(() => useStory.getState().dispatch({ type: 'open', overlay: 'computer' }))

beforeEach(() => {
  const s = reducer({ ...initialState(1), phase: 'room', minutes: BEATS[0].at, weather: 'rain' }, { type: 'tick', realDt: 0 })
  useStory.setState({ s })
  useWorld.getState().reset()
  usePc.getState().reset()
})

test('sitting down at the desk turns the computer on', async () => {
  render(<InteractPrompt targetId="deskMine" isTouch={false} />)
  await userEvent.click(screen.getByRole('button', { name: /Ngồi máy tính/ }))
  expect(useWorld.getState().sitting).toBe(true)
  expect(useStory.getState().s.overlay).toBe('computer')
})

test('the desktop has Chrome, Face bút, Mes, Tin tức and Mail to click', () => {
  openPc()
  render(<Computer />)
  const screenEl = screen.getByRole('dialog', { name: 'Máy tính' })
  for (const name of ['Chrome', 'Face bút', 'Mes', 'Tin tức', 'Mail']) expect(within(screenEl).getAllByRole('button', { name: new RegExp(name) })[0]).toBeVisible()
})

test('Tin tức opens the news site in Chrome; reading an article costs a minute', async () => {
  openPc()
  render(<Computer />)
  await userEvent.click(screen.getByRole('button', { name: 'Tin tức' }))
  expect(screen.getByText('baosang.vn')).toBeVisible()
  const before = useStory.getState().s.minutes
  await userEvent.click(screen.getByRole('button', { name: /mưa rào suốt buổi sáng/ }))
  expect(screen.getByText(/nhớ mặc áo mưa/)).toBeVisible()
  expect(useStory.getState().s.minutes).toBe(before + 1)
})

test('searching in Chrome answers the weather question', async () => {
  openPc()
  render(<Computer />)
  await userEvent.click(screen.getAllByRole('button', { name: 'Chrome' })[0])
  await userEvent.type(screen.getByRole('textbox', { name: 'Tìm trên Gu Gồ' }), 'thời tiết hôm nay{Enter}')
  expect(screen.getByText(/27° · Mưa rào/)).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: /Face bút — Kết nối bạn bè/ }))
  expect(screen.getByText('facebut.com')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Quay lại' }))
  expect(screen.getByText(/27° · Mưa rào/)).toBeVisible()
})

test('Mes shows the unread badge and opens the chat with Em', async () => {
  openPc()
  render(<Computer />)
  expect(useStory.getState().s.chat.unread).toBe(1)
  await userEvent.click(screen.getAllByRole('button', { name: /Mes/ })[0])
  expect(screen.getByText('Dậy chưa anh? 😴')).toBeVisible()
  expect(useStory.getState().s.chat.unread).toBe(0)
})

test('Mail opens the company inbox', async () => {
  openPc()
  render(<Computer />)
  await userEvent.click(screen.getByRole('button', { name: 'Mail' }))
  await userEvent.click(screen.getByRole('button', { name: /Họp sớm/ }))
  expect(screen.getByText(/9h15 họp/)).toBeVisible()
})

test('the red button stands Anh up and switches the screen off', async () => {
  useWorld.getState().setSitting(true)
  openPc()
  render(<Computer />)
  await userEvent.click(screen.getByRole('button', { name: 'Đứng dậy' }))
  expect(useStory.getState().s.overlay).toBeNull()
  expect(useWorld.getState().sitting).toBe(false)
})
