import { AudioWaveform, Volume2, VolumeX } from 'lucide-react'
import { useEffect } from 'react'
import { keys } from '../player/input'
import { useSettings } from '../audio/engine'
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

  const phase = useStory((st) => st.s.phase)
  const sound = useSettings((s) => s.sound)
  const setSound = useSettings((s) => s.setSound)
  const musicOn = useSettings((s) => s.music)
  const setMusic = useSettings((s) => s.setMusic)
  const street = phase === 'street'
  const controls = street ? (isTouch ? S.help.rideTouch : S.help.rideDesktop) : isTouch ? S.help.touch : S.help.desktop

  return (
    <>
      <button className="icon-btn help-button" aria-label={S.help.title} onClick={() => setOpen(!open)}>
        <span className="q" aria-hidden>
          ?
        </span>
      </button>
      {open && (
        <div className="help-backdrop">
          <div className="help-panel" role="dialog" aria-modal="true" aria-label={S.help.title}>
            <div className="help-head">
              <h2>{S.help.title}</h2>
              <span className="muted">{S.title}</span>
            </div>
            <h3>{S.help.controls}</h3>
            <ul>
              {controls.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h3>{S.help.sceneTitle}</h3>
            <p>{S.help.scenes[phase]}</p>
            <button className="setting-row" role="switch" aria-checked={sound} onClick={() => setSound(!sound)}>
              {sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
              <span>{S.help.sound}</span>
              <span className={sound ? 'switch on' : 'switch'} aria-hidden />
            </button>
            <button className="setting-row" role="switch" aria-checked={musicOn} onClick={() => setMusic(!musicOn)}>
              <AudioWaveform aria-hidden />
              <span>{S.help.music}</span>
              <span className={musicOn ? 'switch on' : 'switch'} aria-hidden />
            </button>
            <button className="btn btn-primary btn-block help-resume" onClick={() => setOpen(false)}>
              {S.help.resume}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
