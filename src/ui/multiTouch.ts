// iPhone (Safari) không phát 'click' cho ngón chạm khi đang có ngón khác giữ màn hình — đang kéo joystick
// hay giữ ga thì bấm nút khác không ăn. Ở đây: ngón nhấc lên đúng trên nút mà còn ngón khác đang chạm thì
// tự bấm nút đó, và bỏ qua 'click' đến ngay sau trên cùng nút (trình duyệt nào có gửi) để không bấm hai lần.
const PRESSABLE = 'button, a[href], [role="switch"], [role="tab"]'
const SWALLOW_MS = 350

const pressable = (t: EventTarget | null) => (t instanceof Element ? t.closest(PRESSABLE) : null)

export function installMultiTouchTap(): () => void {
  // Ngón đang chạm → nút nó chạm vào lúc đầu (null nếu chạm ra ngoài nút).
  const down = new Map<number, Element | null>()
  let fired: { el: Element; at: number } | null = null
  let synthesizing = false

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') down.set(e.pointerId, pressable(e.target))
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || !down.has(e.pointerId)) return
    const el = down.get(e.pointerId)
    down.delete(e.pointerId)
    // Chỉ khi còn ngón khác đang giữ màn hình; chạm một ngón thì để trình duyệt tự xử lý.
    if (!el || down.size === 0 || pressable(e.target) !== el || (el as HTMLButtonElement).disabled) return
    synthesizing = true
    ;(el as HTMLElement).click()
    synthesizing = false
    fired = { el, at: performance.now() }
  }
  const onCancel = (e: PointerEvent) => down.delete(e.pointerId)
  const onClick = (e: MouseEvent) => {
    if (synthesizing || !fired) return
    if (pressable(e.target) === fired.el && performance.now() - fired.at < SWALLOW_MS) {
      e.stopImmediatePropagation()
      e.preventDefault()
    }
    fired = null
  }
  window.addEventListener('pointerdown', onDown, true)
  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onCancel, true)
  window.addEventListener('click', onClick, true)
  return () => {
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onCancel, true)
    window.removeEventListener('click', onClick, true)
  }
}
