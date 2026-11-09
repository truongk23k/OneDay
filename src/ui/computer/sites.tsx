import { ChevronLeft, CloudRain, Inbox, Mail, Search, Send, SquarePen, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStory } from '../../story/store'
import { S } from '../../strings'
import { FaceApp, MailApp } from '../phone/apps'
import { usePc } from './pcStore'

// Các trang web mở trong Chrome trên máy tính của Anh.

// Ô tìm kiếm Gu Gồ (trang chủ và đầu trang kết quả).
function SearchBox({ initial = '', compact = false }: { initial?: string; compact?: boolean }) {
  const [q, setQ] = useState(initial)
  const browse = usePc((p) => p.browse)
  return (
    <form
      className={compact ? 'gugo-box compact' : 'gugo-box'}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const text = q.trim()
        if (text) browse('search', text)
      }}
    >
      <Search aria-hidden />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.pc.search.hint} aria-label={S.pc.search.hint} enterKeyHint="search" />
      <button type="submit" className="gugo-go">
        {S.pc.search.go}
      </button>
    </form>
  )
}

function Logo({ small = false }: { small?: boolean }) {
  // Mỗi chữ một màu cho vui mắt.
  const colors = ['#4f8dff', '#ff5a4f', '#ffc83d', '#4f8dff', '#2fbf5b', '#ff5a4f']
  return (
    <div className={small ? 'gugo-logo small' : 'gugo-logo'} aria-label={S.pc.search.name}>
      {[...S.pc.search.name].map((ch, i) => (
        <span key={i} style={{ color: colors[i % colors.length] }} aria-hidden>
          {ch}
        </span>
      ))}
    </div>
  )
}

export function SearchHome() {
  const browse = usePc((p) => p.browse)
  return (
    <div className="pc-site gugo-home">
      <Logo />
      <SearchBox />
      <div className="gugo-suggest">
        {S.pc.search.suggest.map((t) => (
          <button key={t} className="chip" onClick={() => browse('search', t)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

const ANSWERS: { re: RegExp; key: keyof typeof S.pc.search.answers }[] = [
  { re: /thời tiết|mưa|nắng/i, key: 'weather' },
  { re: /vàng/i, key: 'gold' },
  { re: /nhà em|đường/i, key: 'road' },
  { re: /quà|tặng/i, key: 'gift' },
]

export function SearchResults({ q }: { q: string }) {
  const browse = usePc((p) => p.browse)
  const weather = useStory((st) => st.s.weather)
  const answer = ANSWERS.find((a) => a.re.test(q))?.key
  const w = S.phone.weather[weather]
  const WeatherIcon = weather === 'rain' ? CloudRain : Sun
  return (
    <div className="pc-site gugo-results">
      <div className="gugo-top">
        <Logo small />
        <SearchBox key={q} initial={q} compact />
      </div>
      <div className="muted">{S.pc.search.count}</div>
      {answer === 'weather' ? (
        <div className={`answer weather-answer ${weather}`}>
          <WeatherIcon aria-hidden />
          <div>
            <div className="answer-big">
              {w.temp} · {w.title}
            </div>
            <div className="muted">{S.phone.weather.place}</div>
            <p>{w.tip}</p>
          </div>
        </div>
      ) : answer ? (
        <div className="answer">
          <p>{S.pc.search.answers[answer]}</p>
        </div>
      ) : null}
      <ul className="result-list">
        {S.pc.search.results.map((r) => (
          <li key={r.site}>
            <div className="result-url">{S.pc.urls[r.site]}</div>
            <button className="result-title" onClick={() => browse(r.site)}>
              {r.title}
            </button>
            <p>{r.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Báo Sáng: tin đầu là thời tiết hôm nay; đọc một bài mất 1 phút.
export function NewsSite() {
  const weather = useStory((st) => st.s.weather)
  const dispatch = useStory((st) => st.dispatch)
  const [open, setOpen] = useState<number | null>(null)
  const n = S.pc.news
  const items = [{ tag: S.pc.search.answers.weather, pic: weather === 'rain' ? '🌧️' : '☀️', ...n.weather[weather] }, ...n.items]
  const read = (i: number) => {
    dispatch({ type: 'scroll' })
    setOpen(i)
  }
  return (
    <div className="pc-site news-site">
      <header className="news-head">
        <strong>{n.name}</strong>
        <span>{n.tagline}</span>
      </header>
      {open !== null ? (
        <article className="news-article">
          <button className="link-btn" onClick={() => setOpen(null)}>
            <ChevronLeft aria-hidden /> {n.name}
          </button>
          <span className="news-tag">{items[open].tag}</span>
          <h3>{items[open].title}</h3>
          <div className="news-pic big" aria-hidden>
            {items[open].pic}
          </div>
          <p>{items[open].body}</p>
        </article>
      ) : (
        <>
          <ul className="news-list">
            {items.map((it, i) => (
              <li key={it.title}>
                <button onClick={() => read(i)}>
                  <span className="news-pic" aria-hidden>
                    {it.pic}
                  </span>
                  <span>
                    <span className="news-tag">{it.tag}</span>
                    <span className="news-title">{it.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="muted small news-cost">{n.cost}</p>
        </>
      )}
    </div>
  )
}

export function FaceSite() {
  return (
    <div className="pc-site face-site">
      <div className="site-bar face-bar">{S.phone.face.name}</div>
      <FaceApp />
    </div>
  )
}

const FOLDER_ICONS = [Inbox, Send, Trash2]

export function MailSite() {
  return (
    <div className="pc-site mail-site">
      <div className="site-bar mail-bar">
        <Mail aria-hidden /> {S.pc.mail.brand}
      </div>
      <div className="mail-cols">
        <nav className="mail-folders" aria-label={S.phone.mail.inbox}>
          <span className="mail-compose">
            <SquarePen aria-hidden /> {S.pc.mail.compose}
          </span>
          {S.pc.mail.folders.map((f, i) => {
            const Icon = FOLDER_ICONS[i]
            return (
              <span key={f} className={i === 0 ? 'mail-folder on' : 'mail-folder'}>
                <Icon aria-hidden /> {f}
                {i === 0 && <b>{S.phone.mail.items.length}</b>}
              </span>
            )
          })}
        </nav>
        <MailApp />
      </div>
    </div>
  )
}
