import {
  ArrowLeft,
  Globe,
  House,
  LayoutGrid,
  Lock,
  Mail,
  MessageCircle,
  Minus,
  Newspaper,
  Plus,
  Power,
  RotateCw,
  Search,
  ThumbsUp,
  Trash2,
  Volume2,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useWorld } from '../room/world'
import { format } from '../story/clock'
import { useStory } from '../story/store'
import { S } from '../strings'
import { MessagesApp } from './phone/apps'
import { usePc, type Page, type PcApp, type PcWin, type Site } from './computer/pcStore'
import { FaceSite, MailSite, NewsSite, SearchHome, SearchResults } from './computer/sites'

type IconDef = { icon: LucideIcon; color: string }

// Biểu tượng kiểu app quen thuộc (không dùng logo thật).
const ICONS: Record<PcApp, IconDef> = {
  chrome: { icon: Globe, color: 'linear-gradient(150deg, #5aa6ff, #1b5fd9)' },
  face: { icon: ThumbsUp, color: '#1877f2' },
  mes: { icon: MessageCircle, color: 'linear-gradient(140deg, #1e8bff 10%, #a334fa 60%, #ff6b8b)' },
  news: { icon: Newspaper, color: 'linear-gradient(160deg, #ff6a55, #c8261b)' },
  mail: { icon: Mail, color: '#1f8fff' },
}
const DESKTOP: PcApp[] = ['chrome', 'face', 'mes', 'news', 'mail']
const PINNED: PcWin[] = ['chrome', 'mes']

const SITE_ICON: Record<Site, LucideIcon> = { home: Search, search: Search, face: ThumbsUp, news: Newspaper, mail: Mail }

const standUp = () => {
  useStory.getState().dispatch({ type: 'close' })
  useWorld.getState().setSitting(false)
}

function Tile({ app, size = '' }: { app: PcApp; size?: string }) {
  const unread = useStory((st) => st.s.chat.unread)
  const { icon: Icon, color } = ICONS[app]
  return (
    <span className={`app-tile ${size}`} style={{ background: color }}>
      <Icon aria-hidden />
      {app === 'mes' && unread > 0 && <span className="badge">{unread}</span>}
    </span>
  )
}

function Desktop() {
  const launch = usePc((p) => p.launch)
  const dispatch = useStory((st) => st.dispatch)
  return (
    <div className="pc-desktop">
      {DESKTOP.map((a) => (
        <button key={a} className="app-icon pc-icon" onClick={() => launch(a)}>
          <Tile app={a} />
          <span className="app-name">{S.pc.apps[a]}</span>
        </button>
      ))}
      <button className="app-icon pc-icon" onClick={() => dispatch({ type: 'say', line: S.pc.trashLine })}>
        <span className="app-tile trash">
          <Trash2 aria-hidden />
        </span>
        <span className="app-name">{S.pc.trash}</span>
      </button>
      <div className="pc-wallpaper-text" aria-hidden>
        {S.pc.wallpaper}
      </div>
    </div>
  )
}

const pageTitle = (p: Page) =>
  p.site === 'home' ? S.pc.newTab : p.site === 'search' ? `${p.q} - ${S.pc.search.title}` : p.site === 'face' ? S.phone.face.name : p.site === 'news' ? S.pc.news.name : S.pc.mail.brand

const pageUrl = (p: Page) => (p.site === 'search' ? `${S.pc.urls.search}${p.q}` : S.pc.urls[p.site])

function Browser() {
  const page = usePc((p) => p.page)
  const canBack = usePc((p) => p.history.length > 0)
  const { back, browse } = usePc.getState()
  return (
    <>
      <div className="pc-address">
        <button aria-label={S.pc.back} disabled={!canBack} onClick={back}>
          <ArrowLeft aria-hidden />
        </button>
        <button aria-label={S.pc.reload} onClick={() => usePc.setState({ page: { ...page } })}>
          <RotateCw aria-hidden />
        </button>
        <button aria-label={S.pc.home} onClick={() => browse('home')}>
          <House aria-hidden />
        </button>
        <div className="pc-url">
          <Lock aria-hidden />
          <span>{pageUrl(page)}</span>
        </div>
      </div>
      <div className="pc-page">
        {page.site === 'home' ? (
          <SearchHome />
        ) : page.site === 'search' ? (
          <SearchResults q={page.q} />
        ) : page.site === 'face' ? (
          <FaceSite />
        ) : page.site === 'news' ? (
          <NewsSite />
        ) : (
          <MailSite />
        )}
      </div>
    </>
  )
}

function MesWindow() {
  const minute = useStory((st) => Math.floor(st.s.minutes))
  return (
    <div className="pc-mes">
      <aside className="mes-side">
        <div className="mes-side-title">{S.pc.mes.chats}</div>
        <div className="mes-row on">
          <span className="avatar small" style={{ background: '#ff6b8b' }} aria-hidden>
            ❤️
          </span>
          <span>
            <strong>{S.chat.contact}</strong>
            <small>{S.chat.online}</small>
          </span>
        </div>
        {S.pc.mes.others.map((o, i) => (
          <div className="mes-row" key={o.who}>
            <span className="avatar small" style={{ background: `hsl(${(i * 97 + 30) % 360} 50% 45%)` }} aria-hidden>
              {o.who[0]}
            </span>
            <span>
              <strong>{o.who}</strong>
              <small>{o.last}</small>
            </span>
          </div>
        ))}
      </aside>
      <section className="mes-main">
        <header className="mes-head">
          <span className="avatar small" style={{ background: '#ff6b8b' }} aria-hidden>
            ❤️
          </span>
          <span>
            <strong>{S.chat.contact}</strong>
            <small>
              {S.chat.online} · {format(minute)}
            </small>
          </span>
        </header>
        <MessagesApp bare />
      </section>
    </div>
  )
}

function Window({ win }: { win: PcWin }) {
  const page = usePc((p) => p.page)
  const { minimize, closeWin, browse } = usePc.getState()
  const PageIcon = SITE_ICON[page.site]
  return (
    <section className={`pc-window ${win}`} aria-label={win === 'chrome' ? S.pc.apps.chrome : S.pc.apps.mes}>
      <div className="pc-titlebar">
        {win === 'chrome' ? (
          <>
            <span className="pc-tab">
              <PageIcon aria-hidden />
              <span>{pageTitle(page)}</span>
            </span>
            <button className="pc-newtab" aria-label={S.pc.newTab} onClick={() => browse('home')}>
              <Plus aria-hidden />
            </button>
          </>
        ) : (
          <span className="pc-wintitle">
            <MessageCircle aria-hidden /> {S.pc.apps.mes}
          </span>
        )}
        <span className="pc-winbtns">
          <button aria-label={S.pc.minimize} onClick={minimize}>
            <Minus aria-hidden />
          </button>
          <button className="close" aria-label={S.pc.closeWin} onClick={closeWin}>
            <X aria-hidden />
          </button>
        </span>
      </div>
      {win === 'chrome' ? <Browser /> : <MesWindow />}
    </section>
  )
}

function StartMenu() {
  const launch = usePc((p) => p.launch)
  return (
    <div className="pc-start" role="menu" aria-label={S.pc.start}>
      {DESKTOP.map((a) => (
        <button key={a} role="menuitem" onClick={() => launch(a)}>
          <Tile app={a} size="mini" />
          {S.pc.apps[a]}
        </button>
      ))}
      <button role="menuitem" className="pc-power" onClick={standUp}>
        <Power aria-hidden />
        {S.pc.power}
      </button>
    </div>
  )
}

function Taskbar() {
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const win = usePc((p) => p.win)
  const running = usePc((p) => p.running)
  const startOpen = usePc((p) => p.startOpen)
  const { focus, toggleStart } = usePc.getState()
  return (
    <div className="pc-taskbar">
      <button className={startOpen ? 'pc-task start on' : 'pc-task start'} aria-label={S.pc.start} aria-expanded={startOpen} onClick={toggleStart}>
        <LayoutGrid aria-hidden />
      </button>
      {PINNED.map((w) => (
        <button
          key={w}
          className={['pc-task', running.includes(w) ? 'running' : '', win === w ? 'on' : ''].join(' ')}
          aria-label={S.pc.apps[w]}
          onClick={() => focus(w)}
        >
          <Tile app={w} size="mini" />
        </button>
      ))}
      <span className="pc-tray" aria-hidden>
        <Wifi />
        <Volume2 />
        <span>{format(minute)}</span>
      </span>
    </div>
  )
}

// Màn hình máy tính khi Anh ngồi vào bàn: bấm chuột (hoặc chạm) vào biểu tượng để mở Chrome, Face bút, Mes, Tin tức, Mail.
export function Computer() {
  const open = useStory((st) => st.s.overlay === 'computer')
  const win = usePc((p) => p.win)
  const startOpen = usePc((p) => p.startOpen)
  if (!open) return null
  return (
    <div className="pc-dock">
      <div className="pc" role="dialog" aria-label={S.pc.name}>
        <button className="icon-btn pc-close" aria-label={S.pc.standUp} onClick={standUp}>
          <X aria-hidden />
        </button>
        <div className="pc-screen" onPointerDown={(e) => startOpen && !(e.target as Element).closest('.pc-start, .start') && usePc.setState({ startOpen: false })}>
          <div className="pc-area">
            <Desktop />
            {win && <Window win={win} />}
            {startOpen && <StartMenu />}
          </div>
          <Taskbar />
        </div>
      </div>
      <div className="pc-stand" aria-hidden />
    </div>
  )
}
