import { useStory } from '../story/store'
import { S } from '../strings'

// Bảng tạm cho những phần chưa làm xong, để bản chơi thử không bị kẹt.
export const PENDING = new Set<string>(['brush', 'wash', 'wardrobe', 'phone', 'door'])

export function PendingOverlay() {
  const overlay = useStory((st) => st.s.overlay)
  const dispatch = useStory((st) => st.dispatch)
  if (!overlay || !PENDING.has(overlay)) return null
  return (
    <div className="overlay-backdrop">
      <div className="card">
        <p>{S.hud.soon}</p>
        <button className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'close' })}>
          {S.hud.close}
        </button>
      </div>
    </div>
  )
}
