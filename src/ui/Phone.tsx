import { useEffect, useRef } from 'react'
import { BEATS } from '../story/chat'
import { format } from '../story/clock'
import { useStory } from '../story/store'
import { S } from '../strings'

// Nút điện thoại trên HUD, có số tin chưa đọc.
export function PhoneButton() {
  const unread = useStory((st) => st.s.chat.unread)
  const dispatch = useStory((st) => st.dispatch)
  return (
    <button className="phone-button" aria-label={S.chat.phone} onClick={() => dispatch({ type: 'open', overlay: 'phone' })}>
      📱
      {unread > 0 && <span className="badge">{unread}</span>}
    </button>
  )
}

// Màn hình chat với Em ❤️ trong điện thoại (dáng iPhone xanh lá, không logo).
export function Phone() {
  const overlay = useStory((st) => st.s.overlay)
  const chat = useStory((st) => st.s.chat)
  const minute = useStory((st) => Math.floor(st.s.minutes))
  const dispatch = useStory((st) => st.dispatch)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (overlay === 'phone' && chat.unread > 0) dispatch({ type: 'chatSeen' })
  }, [overlay, chat.unread, dispatch])

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' })
  }, [chat.log.length, overlay])

  if (overlay !== 'phone') return null
  const replies = chat.pending !== null ? BEATS[chat.pending].replies : []
  return (
    <div className="overlay-backdrop">
      <div className="phone">
        <div className="phone-screen chat">
          <div className="chat-header">
            <button className="chat-back" aria-label="Đóng" onClick={() => dispatch({ type: 'close' })}>
              ‹
            </button>
            <div>
              <div className="chat-name">{S.chat.contact}</div>
              <div className="chat-status">
                {S.chat.online} · {format(minute)}
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  )
}
