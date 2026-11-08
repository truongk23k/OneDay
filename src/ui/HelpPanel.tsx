import { useEffect } from 'react'
import { keys } from '../player/input'
import { useGame } from '../store'
import { useStory } from '../story/store'
import { S } from '../strings'

// Nút "?" luôn ở góc màn hình; mở bảng hướng dẫn thì game tạm dừng.
export function HelpPanel({ isTouch }: { isTouch: boolean }) {
  const open = useGame((s) => s.helpOpen)
  const setOpen = useGame((s) => s.setHelpOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(!useGame.getState().helpOpen)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  // Phím đang giữ lúc mở bảng không được làm nhân vật tự đi sau khi đóng.
  useEffect(() => {
    if (open) keys.clear()
  }, [open])

  const controls = isTouch ? S.help.touch : S.help.desktop
  const phase = useStory((st) => st.s.phase)

  return (
    <>
      <button className="help-button" aria-label={S.help.title} onClick={() => setOpen(!open)}>
        ?
      </button>
      {open && (
        <div className="help-backdrop">
          <div className="help-panel" role="dialog" aria-modal="true" aria-label={S.help.title}>
            <h2>{S.help.title}</h2>
            <ul>
              {controls.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h3>{S.help.sceneTitle}</h3>
            <p>{S.help.scenes[phase]}</p>
            <button className="help-resume" onClick={() => setOpen(false)}>
              {S.help.resume}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
