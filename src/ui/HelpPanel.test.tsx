import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGame } from '../store'
import { HelpPanel } from './HelpPanel'
import { useSettings } from '../audio/engine'
import { initialState } from '../story/state'
import { useStory } from '../story/store'

afterEach(() => useGame.getState().setHelpOpen(false))

test('opening help pauses', async () => {
  render(<HelpPanel isTouch={false} />)
  expect(screen.queryByRole('dialog')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  expect(screen.getByRole('dialog')).toBeVisible()
  expect(useGame.getState().paused).toBe(true)
})

test('desktop shows keyboard controls', async () => {
  render(<HelpPanel isTouch={false} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('W A S D')
  expect(screen.getByRole('dialog')).not.toHaveTextContent('joystick')
})

test('touch shows joystick controls', async () => {
  render(<HelpPanel isTouch={true} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('joystick')
  expect(screen.getByRole('dialog')).not.toHaveTextContent('W A S D')
})

test('Chơi tiếp closes and unpauses', async () => {
  render(<HelpPanel isTouch={false} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  await userEvent.click(screen.getByRole('button', { name: 'Chơi tiếp' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(useGame.getState().paused).toBe(false)
})

test('Escape toggles', async () => {
  render(<HelpPanel isTouch={false} />)
  await userEvent.keyboard('{Escape}')
  expect(screen.getByRole('dialog')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('on the street the help shows riding controls, not walking ones', async () => {
  useStory.setState({ s: { ...initialState(1), phase: 'street', stage: 'toEm' } })
  render(<HelpPanel isTouch={true} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Ga')
  expect(screen.getByRole('dialog')).not.toHaveTextContent('joystick')
  useStory.setState({ s: initialState(1) })
})

test('help has a sound switch', async () => {
  render(<HelpPanel isTouch={false} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  const sw = screen.getByRole('switch', { name: /Âm thanh/ })
  const before = useSettings.getState().sound
  await userEvent.click(sw)
  expect(useSettings.getState().sound).toBe(!before)
  useSettings.getState().setSound(before)
})

test('help has a background music switch', async () => {
  render(<HelpPanel isTouch={false} />)
  await userEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  const before = useSettings.getState().music
  await userEvent.click(screen.getByRole('switch', { name: /Nhạc nền/ }))
  expect(useSettings.getState().music).toBe(!before)
  useSettings.getState().setMusic(before)
})
