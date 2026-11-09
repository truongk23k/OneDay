import { RotateCw, Smartphone } from 'lucide-react'
import { S } from '../strings'

// Chỉ hiện trên điện thoại cầm dọc (CSS media query trong index.css).
export function RotatePrompt() {
  return (
    <div className="rotate-prompt">
      <div className="rotate-icon" aria-hidden>
        <Smartphone className="rotate-phone" />
        <RotateCw className="rotate-arrow" />
      </div>
      <p>{S.rotate}</p>
    </div>
  )
}
