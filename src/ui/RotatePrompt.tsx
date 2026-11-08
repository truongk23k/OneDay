import { S } from '../strings'

// Chỉ hiện trên điện thoại cầm dọc (CSS media query trong index.css).
export function RotatePrompt() {
  return (
    <div className="rotate-prompt">
      <div className="rotate-icon">📱↻</div>
      <p>{S.rotate}</p>
    </div>
  )
}
