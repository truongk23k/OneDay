import { lockZoom } from './zoomLock'

let unlock: () => void
beforeEach(() => {
  unlock = lockZoom()
})
afterEach(() => unlock())

// jsdom không dựng được danh sách touches: gắn tay vào một Event thường.
const touchEvent = (type: string, touches: number, target: EventTarget = document.body, timeStamp?: number) => {
  const e = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(e, 'touches', { value: { length: touches } })
  if (timeStamp !== undefined) Object.defineProperty(e, 'timeStamp', { value: timeStamp })
  target.dispatchEvent(e)
  return e
}

test('Safari pinch gestures are cancelled', () => {
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    const e = new Event(type, { bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  }
})

test('moving two fingers does not zoom, one finger is left alone', () => {
  expect(touchEvent('touchmove', 2).defaultPrevented).toBe(true)
  expect(touchEvent('touchmove', 1).defaultPrevented).toBe(false)
})

test('a quick second tap does not zoom, and still presses the button under it', () => {
  const button = document.createElement('button')
  let clicks = 0
  button.addEventListener('click', () => clicks++)
  document.body.append(button)
  expect(touchEvent('touchend', 0, button, 1000).defaultPrevented).toBe(false)
  const second = touchEvent('touchend', 0, button, 1200)
  expect(second.defaultPrevented).toBe(true)
  expect(clicks).toBe(1)
  // Lâu sau mới chạm lại: để trình duyệt tự xử lý như thường.
  expect(touchEvent('touchend', 0, button, 3000).defaultPrevented).toBe(false)
  button.remove()
})

test('lifting one finger while another still touches is not a double tap', () => {
  touchEvent('touchend', 0, document.body, 1000)
  expect(touchEvent('touchend', 1, document.body, 1100).defaultPrevented).toBe(false)
})
