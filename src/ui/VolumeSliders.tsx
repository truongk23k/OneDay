import { AudioWaveform, CloudRain, Volume2 } from 'lucide-react'
import { useSettings, type Bus } from '../audio/engine'
import { S } from '../strings'

const ROWS: { bus: Bus; icon: typeof Volume2 }[] = [
  { bus: 'sfx', icon: Volume2 },
  { bus: 'music', icon: AudioWaveform },
  { bus: 'amb', icon: CloudRain },
]

// Ba thanh trượt âm lượng: hiệu ứng, nhạc nền, tiếng nền (mưa, phố, chim).
export function VolumeSliders() {
  const volume = useSettings((s) => s.volume)
  const setVolume = useSettings((s) => s.setVolume)
  return (
    <div className="volume">
      {ROWS.map(({ bus, icon: Icon }) => (
        <label key={bus} className="volume-row">
          <Icon aria-hidden />
          <span>{S.volume[bus]}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(volume[bus] * 100)}
            aria-label={S.volume[bus]}
            onChange={(e) => setVolume(bus, Number(e.target.value) / 100)}
            style={{ '--v': `${volume[bus] * 100}%` } as React.CSSProperties}
          />
        </label>
      ))}
    </div>
  )
}
