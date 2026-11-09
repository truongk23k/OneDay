// iPhone (Safari) bỏ qua "user-scalable=no" nên vẫn phóng to khi chụm hai ngón (vd. một ngón giữ joystick,
// ngón kia bấm nút) hoặc chạm đúp. Chặn thẳng các cử chỉ đó; lần chạm đúp thứ hai vẫn bấm nút như thường.
const DOUBLE_TAP_MS = 350
const PRESSABLE = 'button, a[href], [role="switch"], [role="tab"]'

type Touchy = Event & { touches?: { length: number } }

export function lockZoom(): () => void {
  const stop = (e: Event) => e.preventDefault()
  const twoFingers = (e: Touchy) => {
    if ((e.touches?.length ?? 0) > 1) e.preventDefault()
  }
  let lastTap = -Infinity
  const doubleTap = (e: Touchy) => {
    // Còn ngón khác trên màn hình thì không phải chạm đúp.
    if ((e.touches?.length ?? 0) > 0) return
    const now = e.timeStamp
    if (now - lastTap < DOUBLE_TAP_MS) {
      e.preventDefault()
      // Chặn chạm đúp cũng chặn luôn 'click' của lần chạm này: tự bấm nút bên dưới.
      const el = e.target instanceof Element ? e.target.closest(PRESSABLE) : null
      if (el && !(el as HTMLButtonElement).disabled) (el as HTMLElement).click()
      lastTap = -Infinity
      return
    }
    lastTap = now
  }
  const opts = { passive: false, capture: true } as const
  const gestures = ['gesturestart', 'gesturechange', 'gestureend']
  for (const g of gestures) document.addEventListener(g, stop, opts)
  document.addEventListener('touchmove', twoFingers as EventListener, opts)
  document.addEventListener('touchend', doubleTap as EventListener, opts)
  return () => {
    for (const g of gestures) document.removeEventListener(g, stop, opts)
    document.removeEventListener('touchmove', twoFingers as EventListener, opts)
    document.removeEventListener('touchend', doubleTap as EventListener, opts)
  }
}
