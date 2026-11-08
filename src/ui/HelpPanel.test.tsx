import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGame } from '../store'
import { HelpPanel } from './HelpPanel'

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
