import {
  BatteryFull,
  Bike,
  Camera,
  CloudRain,
  Headphones,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Phone as PhoneIcon,
  Settings,
  Signal,
  Sun,
  ThumbsUp,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { BackGlyph, PhoneGlyph } from './GameIcons'
import { useRide } from '../ride/store'
import { format } from '../story/clock'
import { useStory } from '../story/store'
import { S } from '../strings'
import { BankApp, CallApp, CameraApp, FaceApp, GrapApp, MailApp, MapsApp, MessagesApp, MusicApp, NotesApp, SettingsApp, WeatherApp } from './phone/apps'
import { PHONE_SPEED, openPhone, usePhone, type AppId } from './phone/phoneStore'

type AppDef = { id: Exclude<AppId, 'home'>; icon: LucideIcon; color: string; ink?: string }

// Màu quen thuộc kiểu các app hay dùng (không dùng logo thật).
const APPS: AppDef[] = [
  { id: 'messages', icon: MessageCircle, color: 'linear-gradient(140deg, #1e8bff 10%, #a334fa 60%, #ff6b8b)' },
  { id: 'call', icon: PhoneIcon, color: '#2fbf5b' },
  { id: 'maps', icon: MapPin, color: 'linear-gradient(160deg, #ffffff 55%, #d7f0dd)', ink: '#ea4335' },
  { id: 'face', icon: ThumbsUp, color: '#1877f2' },
  { id: 'grap', icon: Bike, color: '#00b14f' },
  { id: 'weather', icon: Sun, color: 'linear-gradient(160deg, #4aa8ff, #1f5fd6)' },
  { id: 'bank', icon: Landmark, color: '#5e5ce6' },
  { id: 'music', icon: Headphones, color: 'linear-gradient(160deg, #ff5f7e, #c2246b)' },
  { id: 'mail', icon: Mail, color: '#1f8fff' },
  { id: 'notes', icon: NotebookPen, color: '#f5c400' },
  { id: 'camera', icon: Camera, color: '#7c7c84' },
  { id: 'settings', icon: Settings, color: '#55555c' },
]

const VIEWS: Record<Exclude<AppId, 'home'>, () => React.ReactNode> = {
  messages: MessagesApp,
  call: CallApp,
  maps: MapsApp,
  face: FaceApp,
  grap: GrapApp,
  weather: WeatherApp,
  bank: BankApp,
  music: MusicApp,
  mail: MailApp,
  notes: NotesApp,
  camera: CameraApp,
  settings: SettingsApp,
}

// Nút điện thoại trên HUD, có số tin chưa đọc. Đứng trước cửa nhà Em thì nút nhấp nháy để gọi Em.
export function PhoneButton({ pulse = false }: { pulse?: boolean }) {
  const unread = useStory((st) => st.s.chat.unread)
  return (
    <button className={pulse ? 'icon-btn phone-button pulse' : 'icon-btn phone-button'} aria-label={S.chat.phone} onClick={() => openPhone()}>
      <PhoneGlyph />
      {unread > 0 && <span className="badge">{unread}</span>}
    </button>
  )
}

function Home() {
  const unread = useStory((st) => st.s.chat.unread)
  const rain = useStory((st) => st.s.weather === 'rain')
  const go = usePhone((p) => p.go)
  return (
    <div className="phone-home">
      {APPS.map((a) => {
        const Icon = a.id === 'weather' && rain ? CloudRain : a.icon
        return (
          <button key={a.id} className="app-icon" onClick={() => go(a.id)}>
            <span className="app-tile" style={{ background: a.color, color: a.ink }}>
              <Icon aria-hidden />
              {a.id === 'messages' && unread > 0 && <span className="badge">{unread}</span>}
            </span>
            <span className="app-name">{S.phone.apps[a.id]}</span>
          </button>
        )
      })}
    </div>
  )
}

// Điện thoại của Anh (dáng iPhone 13 xanh lá, không logo): màn hình chính với các app.
export function Phone() {
  const overlay = useStory((st) => st.s.overlay)
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const dispatch = useStory((st) => st.dispatch)
  const app = usePhone((p) => p.app)
  const go = usePhone((p) => p.go)
  const open = overlay === 'phone'

  // Ngoài đường: đang cầm điện thoại mà xe chạy thì phải cất đi.
  useEffect(() => {
    if (!open) return
    return useRide.subscribe((r) => {
      const st = useStory.getState()
      if (st.s.phase === 'street' && st.s.overlay === 'phone' && Math.abs(r.bike.speed) > PHONE_SPEED * 1.5) {
        st.dispatch({ type: 'close' })
        st.dispatch({ type: 'say', line: S.phone.putAway })
      }
    })
  }, [open])

  if (!open) return null
  const id = app === 'home' ? null : app
  const View = id ? VIEWS[id] : null
  const close = () => dispatch({ type: 'close' })
  return (
    <div className="phone-dock">
      <div className={id === 'camera' ? 'phone cam' : 'phone'} role="dialog" aria-label={S.chat.phone}>
        <button className="phone-close" aria-label={S.hud.close} onClick={close}>
          <X aria-hidden />
        </button>
        <div className={id === 'camera' ? 'phone-screen cam' : 'phone-screen'}>
          <div className="phone-status" aria-hidden>
            <span>{format(minute)}</span>
            <span className="phone-status-icons">
              <Signal />
              <Wifi />
              <BatteryFull />
            </span>
          </div>
          {View && id ? (
            <div className={`phone-app app-${id}`}>
              {id !== 'messages' && id !== 'call' && (
                <div className="app-bar">
                  <button className="app-back" aria-label={S.phone.back} onClick={() => go('home')}>
                    <BackGlyph />
                  </button>
                  <span className="app-title">{S.phone.apps[id]}</span>
                </div>
              )}
              <View />
            </div>
          ) : (
            <Home />
          )}
          <button className="phone-homebar" aria-label={S.phone.home} onClick={() => (app === 'home' ? close() : go('home'))} />
        </div>
      </div>
    </div>
  )
}
