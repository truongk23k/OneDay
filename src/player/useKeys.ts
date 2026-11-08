import { useEffect } from 'react'
import { keys } from './input'

// Lắng nghe bàn phím cho keys (đi lại trong phòng, lái xe ngoài phố); mất focus thì nhả hết phím.
export function useKeys() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.down(e.code)
    const onUp = (e: KeyboardEvent) => keys.up(e.code)
    const onBlur = () => keys.clear()
    const onVisibility = () => document.hidden && keys.clear()
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
