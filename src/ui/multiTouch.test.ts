import { installMultiTouchTap } from './multiTouch'

const touch = (type: string, target: EventTarget, id: number) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: 'touch' }))

let uninstall: () => void
let button: HTMLButtonElement
let clicks: number
let floor: HTMLDivElement

beforeEach(() => {
  uninstall = installMultiTouchTap()
  floor = document.createElement('div')
  button = document.createElement('button')
  clicks = 0
  button.addEventListener('click', () => clicks++)
  document.body.append(floor, button)
})

afterEach(() => {
  uninstall()
  floor.remove()
  button.remove()
})

test('tapping a button while the other thumb holds the joystick still presses it', () => {
  touch('pointerdown', floor, 1)
  touch('pointerdown', button, 2)
  touch('pointerup', button, 2)
  expect(clicks).toBe(1)
})

test('a browser that also sends its own click does not press twice', () => {
  touch('pointerdown', floor, 1)
  touch('pointerdown', button, 2)
  touch('pointerup', button, 2)
  button.click()
  expect(clicks).toBe(1)
})

test('a normal one-finger tap is left to the browser', () => {
  touch('pointerdown', button, 3)
  touch('pointerup', button, 3)
  expect(clicks).toBe(0)
  button.click()
  expect(clicks).toBe(1)
})

test('sliding off the button before lifting does not press it', () => {
  touch('pointerdown', floor, 1)
  touch('pointerdown', button, 2)
  touch('pointerup', floor, 2)
  expect(clicks).toBe(0)
})
