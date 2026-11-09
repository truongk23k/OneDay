import {
  Camera,
  Check,
  ChevronLeft,
  CircleCheck,
  Circle,
  CloudRain,
  Copy,
  Download,
  Headphones,
  Images,
  Pause,
  Phone as PhoneIcon,
  PhoneOff,
  Play,
  QrCode,
  SkipForward,
  SwitchCamera,
  Sun,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MARKERS } from '../../ride/city'
import { routeTo } from '../../ride/nav'
import { targetFor } from '../../ride/rules'
import { useRide } from '../../ride/store'
import { useSettings } from '../../audio/engine'
import { music, TRACKS } from '../../audio/music'
import { useGame } from '../../store'
import { BEATS } from '../../story/chat'
import { ANH_DEADLINE, EM_DEADLINE, format } from '../../story/clock'
import { FOOD_PRICE, START_MONEY, type Tasks } from '../../story/state'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { BackGlyph } from '../GameIcons'
import { MapSvg } from '../RideMap'
import { VolumeSliders } from '../VolumeSliders'
import myQr from './img/my-qr.webp'
import { usePhone, type Contact } from './phoneStore'

export const money = (thousands: number) => `${(thousands * 1000).toLocaleString('vi-VN')}đ`

function BackBar({ title, sub }: { title: string; sub?: string }) {
  const go = usePhone((p) => p.go)
  return (
    <div className="app-bar">
      <button className="app-back" aria-label={S.phone.back} onClick={() => go('home')}>
        <BackGlyph />
      </button>
      <div>
        <div className="app-title">{title}</div>
        {sub && <div className="app-sub">{sub}</div>}
      </div>
    </div>
  )
}

// Tin nhắn với Em ❤️. bare: không có thanh quay lại (cửa sổ Mes trên máy tính tự vẽ tiêu đề).
export function MessagesApp({ bare = false }: { bare?: boolean } = {}) {
  const chat = useStory((st) => st.s.chat)
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const dispatch = useStory((st) => st.dispatch)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chat.unread > 0) dispatch({ type: 'chatSeen' })
  }, [chat.unread, dispatch])

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' })
  }, [chat.log.length])

  const replies = chat.pending !== null ? BEATS[chat.pending].replies : []
  return (
    <>
      {!bare && <BackBar title={S.chat.contact} sub={`${S.chat.online} · ${format(minute)}`} />}
      <div className="chat-log">
        {chat.log.map((l, i) => (
          <div key={i} className={`bubble ${l.from}`}>
            {l.text}
          </div>
        ))}
        <div ref={end} />
      </div>
      {replies.length > 0 && (
        <div className="chat-replies">
          {replies.map((r, i) => (
            <button key={r.text} className="reply" onClick={() => dispatch({ type: 'chatReply', index: i })}>
              {r.text}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

const CONTACTS: Contact[] = ['em', 'boss', 'mom']
const AVATAR: Record<Contact, { text: string; color: string }> = {
  em: { text: '❤️', color: '#ff6b8b' },
  boss: { text: 'S', color: '#2f7cf6' },
  mom: { text: 'M', color: '#f2a03d' },
}

// Gọi điện: danh bạ, hoặc màn hình cuộc gọi đang diễn ra.
export function CallApp() {
  const call = usePhone((p) => p.call)
  const dial = usePhone((p) => p.dial)
  const hangUp = usePhone((p) => p.hangUp)
  const emState = useRide((r) => r.em)
  const atDoor = useStory((st) => st.s.phase === 'street' && st.s.stage === 'toEm')
  const [answer, setAnswer] = useState<string | null>(null)

  // Gọi Em ở trước cửa: chuông đổ tới khi Em nghe máy (theo chuyến xe), rồi cất máy để nhìn Em đi ra.
  const doorCall = call?.who === 'em' && atDoor && call.text === null && emState !== 'home'
  useEffect(() => {
    if (!doorCall || emState === 'ringing') return
    setAnswer(useStory.getState().s.line)
    const t = setTimeout(() => useStory.getState().dispatch({ type: 'close' }), 1800)
    return () => clearTimeout(t)
  }, [doorCall, emState])

  if (!call) {
    return (
      <>
        <BackBar title={S.phone.apps.call} />
        <ul className="contacts">
          {CONTACTS.map((c) => (
            <li key={c}>
              <span className="avatar" style={{ background: AVATAR[c].color }} aria-hidden>
                {AVATAR[c].text}
              </span>
              <span className="contact-name">
                {S.phone.contacts[c]}
                <small>{S.phone.contactHint[c]}</small>
              </span>
              <button className="dial" aria-label={`${S.phone.apps.call} ${S.phone.contacts[c]}`} onClick={() => dial(c)}>
                <PhoneIcon aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </>
    )
  }
  const ringing = doorCall ? emState === 'ringing' : call.phase === 'ringing'
  const text = doorCall ? answer : call.text
  return (
    <div className="call-screen">
      <span className={ringing ? 'avatar big ringing' : 'avatar big'} style={{ background: AVATAR[call.who].color }} aria-hidden>
        {AVATAR[call.who].text}
      </span>
      <div className="call-name">{S.phone.contacts[call.who]}</div>
      <div className="call-state">{ringing ? S.phone.ringing : S.phone.talking}</div>
      {!ringing && text && <div className="call-text">{text}</div>}
      <button className="hang-up" aria-label={S.phone.hangUp} onClick={hangUp}>
        <PhoneOff aria-hidden />
      </button>
    </div>
  )
}

// Bản đồ: ngoài đường thấy xe và đường gợi ý; trong phòng thì xem trước đường tới nhà Em.
export function MapsApp() {
  const stage = useStory((st) => st.s.stage)
  const street = useStory((st) => st.s.phase === 'street')
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(t)
  }, [])
  const r = useRide.getState()
  const bike = street ? r.bike : { x: MARKERS.home.x, z: MARKERS.home.z, heading: MARKERS.home.heading }
  const target = targetFor(street ? stage : 'toEm')
  const route = target ? routeTo(bike, target) : null
  return (
    <div className="app-body">
      <MapSvg bike={bike} route={route} stage={street ? stage : 'toEm'} big={true} police={r.police.mode === 'chase' ? r.police : null} />
      {street && (
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            useStory.getState().dispatch({ type: 'close' })
            useGame.getState().setMapOpen(true)
          }}
        >
          {S.ride.map.title}
        </button>
      )}
    </div>
  )
}

export function WeatherApp() {
  const weather = useStory((st) => st.s.weather)
  const w = S.phone.weather[weather]
  const Icon = weather === 'rain' ? CloudRain : Sun
  return (
    <div className={`app-body weather ${weather}`}>
      <div className="weather-place">{S.phone.weather.place}</div>
      <Icon className="weather-icon" aria-hidden />
      <div className="weather-temp">{w.temp}</div>
      <div className="weather-title">{w.title}</div>
      <p className="weather-tip">{w.tip}</p>
    </div>
  )
}

// Chép chữ: trang chạy http qua LAN (không "secure context") thì không có navigator.clipboard → dùng execCommand.
async function copyText(text: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* thử cách cũ bên dưới */
  }
  const box = document.createElement('textarea')
  box.value = text
  box.setAttribute('readonly', '')
  box.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(box)
  box.select()
  box.setSelectionRange(0, text.length)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  box.remove()
  return ok
}

// My QR: mã VietQR thật của tác giả để người chơi ủng hộ (chỉ ảnh mã QR, tên/số TK/ngân hàng vẽ bằng chữ).
function BankQr() {
  const B = S.phone.bank
  const [copied, setCopied] = useState(false)
  return (
    <>
      <div className="bank-qr-card">
        <img className="bank-qr-img" src={myQr} alt={B.qrAlt} draggable={false} />
        <div className="bank-qr-owner">{B.owner}</div>
        <div className="bank-qr-number">{B.number}</div>
        <div className="bank-qr-bank">{B.bankName}</div>
      </div>
      <button
        className={copied ? 'btn btn-grap btn-block bank-copy' : 'btn btn-bank btn-block bank-copy'}
        onClick={() => void copyText(B.number).then(setCopied)}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? B.copied : B.copy}
      </button>
    </>
  )
}

export function BankApp() {
  const s = useStory((st) => st.s)
  const [tab, setTab] = useState<'account' | 'qr'>('account')
  const rows: { label: string; amount: number }[] = []
  if (s.breakfast) rows.push({ label: S.phone.bank.food, amount: -FOOD_PRICE })
  if (s.fines) rows.push({ label: S.phone.bank.fine, amount: -s.fines })
  const tabs = (
    <div className="tabs" role="tablist">
      <button role="tab" aria-selected={tab === 'account'} onClick={() => setTab('account')}>
        {S.phone.bank.tabAccount}
      </button>
      <button role="tab" aria-selected={tab === 'qr'} onClick={() => setTab('qr')}>
        <QrCode aria-hidden />
        {S.phone.bank.tabQr}
      </button>
    </div>
  )
  if (tab === 'qr') {
    return (
      <div className="app-body bank">
        {tabs}
        <BankQr />
      </div>
    )
  }
  return (
    <div className="app-body bank">
      {tabs}
      <div className="bank-card">
        <div className="bank-label">{S.phone.bank.balance}</div>
        <div className={s.money < 0 ? 'bank-balance negative' : 'bank-balance'}>{money(s.money)}</div>
        <div className="bank-sub">
          {S.phone.bank.salary}: {money(START_MONEY)}
        </div>
      </div>
      {s.money < 0 && <p className="game-line">{S.phone.bank.negative}</p>}
      <div className="app-section">{S.phone.bank.history}</div>
      {rows.length ? (
        <ul className="bank-rows">
          {rows.map((r) => (
            <li key={r.label}>
              <span>{r.label}</span>
              <strong>{money(r.amount)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{S.phone.bank.empty}</p>
      )}
    </div>
  )
}

// Grap: GrapFood đặt đồ ăn sáng giao tới chỗ làm của Em; GrapBike thử đặt xe cho Em (Em không chịu!).
export function GrapApp() {
  const [tab, setTab] = useState<'food' | 'bike'>('food')
  const ordered = useStory((st) => st.s.breakfast)
  const tried = useStory((st) => st.s.triedGrab)
  const stage = useStory((st) => st.s.stage)
  const dispatch = useStory((st) => st.dispatch)
  const tooLate = stage === 'sprint' || stage === 'done'
  return (
    <div className="app-body grap">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'food'} onClick={() => setTab('food')}>
          {S.phone.grab.food}
        </button>
        <button role="tab" aria-selected={tab === 'bike'} onClick={() => setTab('bike')}>
          {S.phone.grab.bike}
        </button>
      </div>
      {tab === 'food' ? (
        <>
          <div className="food-card">
            <div className="food-pic" aria-hidden>
              🍙
            </div>
            <div>
              <div className="food-shop">{S.phone.food.shop}</div>
              <div className="food-item">{S.phone.food.item}</div>
              <div className="muted">{S.phone.food.desc}</div>
              <div className="food-price">{money(FOOD_PRICE)}</div>
            </div>
          </div>
          {ordered ? (
            <p className="ok-line">{S.phone.food.ordered}</p>
          ) : tooLate ? (
            <p className="muted">{S.phone.food.tooLate}</p>
          ) : (
            <button
              className="btn btn-grap btn-block"
              onClick={() => {
                dispatch({ type: 'orderFood' })
                dispatch({ type: 'say', line: S.phone.food.line })
              }}
            >
              {S.phone.food.order}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="food-card">
            <div className="food-pic" aria-hidden>
              🛵
            </div>
            <div>
              <div className="food-shop">{S.phone.grab.bikeTitle}</div>
              <div className="muted">{S.phone.grab.bikeDesc}</div>
            </div>
          </div>
          {tried ? (
            <p className="game-line">{S.phone.grab.bikeRefused}</p>
          ) : stage !== 'toEm' ? (
            <p className="muted">{stage === 'withEm' ? S.phone.grab.bikeNo : S.phone.food.tooLate}</p>
          ) : (
            <button className="btn btn-grap btn-block" onClick={() => dispatch({ type: 'grabForEm' })}>
              {S.phone.grab.bikeBook}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Face bút: bảng tin. Thả tim bài của Em thì Em vui; xem thêm thì mất giờ.
export function FaceApp() {
  const [shown, setShown] = useState(2)
  const liked = useStory((st) => st.s.likedEm)
  const dispatch = useStory((st) => st.dispatch)
  const posts = S.phone.face.posts
  return (
    <div className="app-body face">
      <article className="post">
        <header>
          <span className="avatar small" style={{ background: '#ff6b8b' }} aria-hidden>
            ❤️
          </span>
          <strong>{S.phone.face.em.who}</strong>
        </header>
        <p>{S.phone.face.em.text}</p>
        <button className={liked ? 'like on' : 'like'} aria-pressed={liked} onClick={() => dispatch({ type: 'likeEmPost' })}>
          <ThumbsUp aria-hidden /> {liked ? S.phone.face.liked : S.phone.face.like}
        </button>
      </article>
      {Array.from({ length: shown }, (_, i) => posts[i % posts.length]).map((p, i) => (
        <article className="post" key={i}>
          <header>
            <span className="avatar small" style={{ background: `hsl(${(i * 67) % 360} 55% 48%)` }} aria-hidden>
              {p.who[0]}
            </span>
            <strong>{p.who}</strong>
          </header>
          <p>{p.text}</p>
        </article>
      ))}
      <button
        className="btn btn-ghost btn-block"
        onClick={() => {
          dispatch({ type: 'scroll' })
          setShown(shown + 2)
        }}
      >
        {S.phone.face.more}
      </button>
      <p className="muted small">{S.phone.face.warn}</p>
    </div>
  )
}

export function MusicApp() {
  const playing = music((m) => m.playing)
  const track = music((m) => m.track)
  const on = useSettings((s) => s.music)
  // Phát / dừng = bật / tắt nhạc nền của game; "Bài tiếp" đổi bài đang phát.
  const toggle = () => {
    const settings = useSettings.getState()
    if (on && playing) settings.setMusic(false)
    else {
      settings.setMusic(true)
      music.getState().play()
    }
  }
  return (
    <div className="app-body music-app">
      <div className={playing ? 'disc spin' : 'disc'} aria-hidden />
      <div className="track">{TRACKS[track].name}</div>
      <div className="muted">{!on ? S.phone.music.off : playing ? S.phone.music.playing : S.phone.music.paused}</div>
      <div className="music-buttons">
        <button className="round-btn" aria-label={on && playing ? S.phone.music.pause : S.phone.music.play} onClick={toggle}>
          {on && playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </button>
        <button className="round-btn" aria-label={S.phone.music.next} onClick={() => music.getState().next()}>
          <SkipForward aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function MailApp() {
  const [open, setOpen] = useState<number | null>(null)
  const items = S.phone.mail.items
  if (open !== null) {
    const m = items[open]
    return (
      <div className="app-body mail">
        <button className="link-btn" onClick={() => setOpen(null)}>
          <ChevronLeft aria-hidden /> {S.phone.mail.inbox}
        </button>
        <div className="mail-subject">{m.subject}</div>
        <div className="muted">{m.from}</div>
        <p>{m.body}</p>
      </div>
    )
  }
  return (
    <ul className="app-body mail-list">
      {items.map((m, i) => (
        <li key={m.subject}>
          <button onClick={() => setOpen(i)}>
            <strong>{m.from}</strong>
            <span>{m.subject}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

const TASK_KEYS: (keyof Tasks)[] = ['brushed', 'washed', 'keys', 'dressed', 'texted', 'helmets']

export function NotesApp() {
  const tasks = useStory((st) => st.s.tasks)
  return (
    <div className="app-body notes">
      <div className="app-section">{S.phone.notes.room}</div>
      <ul className="note-list">
        {TASK_KEYS.map((k) => {
          const done = k === 'helmets' ? tasks.helmets === 2 : tasks[k] === true
          return (
            <li key={k} className={done ? 'done' : ''}>
              {done ? <CircleCheck aria-hidden /> : <Circle aria-hidden />}
              {S.tasks[k]}
            </li>
          )
        })}
      </ul>
      <div className="app-section">{S.phone.notes.ride}</div>
      <ul className="note-list">
        {[S.ride.missions.pickup, `${S.ride.missions.dropoff} · ${format(EM_DEADLINE)}`, `${S.ride.missions.arrive} · ${format(ANH_DEADLINE)}`].map((m) => (
          <li key={m}>
            <Circle aria-hidden />
            {m}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Camera: kính ngắm thấy trực tiếp cảnh camera điện thoại đang nhìn (vẽ bởi PhoneLens), kéo để ngắm,
// đổi camera trước/sau, bấm chụp; xem lại ảnh và lưu về máy.
export function CameraApp() {
  const photo = usePhone((p) => p.photo)
  const lens = usePhone((p) => p.lens)
  const [review, setReview] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  if (review && photo) {
    return (
      <div className="app-body camera review">
        <img className="photo" src={photo} alt="" />
        <div className="camera-buttons">
          <button className="btn btn-ghost" onClick={() => setReview(false)}>
            <Camera aria-hidden /> {S.phone.camera.again}
          </button>
          <a className="btn btn-primary" href={photo} download={S.phone.camera.file}>
            <Download aria-hidden /> {S.phone.camera.save}
          </a>
        </div>
      </div>
    )
  }
  return (
    <div className="app-body camera">
      <div
        className="viewfinder"
        aria-label={S.phone.camera.tip}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d || d.id !== e.pointerId) return
          usePhone.getState().aimBy(-(e.clientX - d.x) * 0.008, -(e.clientY - d.y) * 0.006)
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="cam-mode">{lens === 'front' ? S.phone.camera.front : S.phone.camera.back}</span>
      </div>
      <div className="camera-controls">
        <button className="cam-thumb" aria-label={S.phone.camera.gallery} disabled={!photo} onClick={() => setReview(true)}>
          {photo ? <img src={photo} alt="" /> : <Images aria-hidden />}
        </button>
        <button className="shutter" aria-label={S.phone.camera.shoot} onClick={() => usePhone.setState({ shoot: true })} />
        <button className="cam-flip" aria-label={S.phone.camera.flip} onClick={() => usePhone.getState().flip()}>
          <SwitchCamera aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function SettingsApp() {
  const sound = useSettings((s) => s.sound)
  const musicOn = useSettings((s) => s.music)
  const { setSound, setMusic } = useSettings.getState()
  return (
    <div className="app-body settings">
      <button className="setting-row" role="switch" aria-checked={sound} onClick={() => setSound(!sound)}>
        {sound ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        <span>{S.phone.settings.sound}</span>
        <span className={sound ? 'switch on' : 'switch'} aria-hidden />
      </button>
      <button className="setting-row" role="switch" aria-checked={musicOn} onClick={() => setMusic(!musicOn)}>
        <Headphones aria-hidden />
        <span>{S.phone.settings.music}</span>
        <span className={musicOn ? 'switch on' : 'switch'} aria-hidden />
      </button>
      <VolumeSliders />
      <p className="muted">{S.phone.settings.about}</p>
    </div>
  )
}
