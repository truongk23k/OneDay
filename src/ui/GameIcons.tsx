// Icon nhiều màu kiểu game (viền tối dày, mảng màu tươi, vệt sáng) cho các nút HUD hay bấm.
const INK = '#1b1530'

export function PhoneGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="glyph" aria-hidden>
      <defs>
        <linearGradient id="g-phone-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd6ff" />
          <stop offset="1" stopColor="#8a5cff" />
        </linearGradient>
      </defs>
      <rect x="8" y="2.5" width="16" height="27" rx="4" fill="#5d9a6b" stroke={INK} strokeWidth="2" />
      <rect x="10" y="5.5" width="12" height="20" rx="2" fill="url(#g-phone-screen)" />
      <rect x="13.5" y="6.5" width="5" height="1.8" rx="0.9" fill={INK} />
      <path d="M11.5 10.5h6M11.5 13.5h8M11.5 16.5h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <path d="M10.5 22.5 14 19l2.5 2.5L19 19l2.5 3.5" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
      <path d="M10 3.6h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

export function DanceGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="glyph" aria-hidden>
      <defs>
        <linearGradient id="g-note" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5fa2" />
          <stop offset="1" stopColor="#8a5cff" />
        </linearGradient>
      </defs>
      <path d="M11 22V8.5l12-3V19" fill="none" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M11 22V8.5l12-3V19" fill="none" stroke="url(#g-note)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M11 11.5l12-3" stroke={INK} strokeWidth="1" />
      <ellipse cx="7.8" cy="22.5" rx="4" ry="3.2" fill="#ff5fa2" stroke={INK} strokeWidth="2" />
      <ellipse cx="19.8" cy="19.5" rx="4" ry="3.2" fill="#8a5cff" stroke={INK} strokeWidth="2" />
      <path d="M26.5 23.5l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z" fill="#ffd84d" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      <path d="M4.5 4l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7L2 6.5l1.7-.8z" fill="#3de0ff" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
      <ellipse cx="6.6" cy="21.6" rx="1.3" ry="0.8" fill="#fff" opacity="0.6" />
      <ellipse cx="18.6" cy="18.6" rx="1.3" ry="0.8" fill="#fff" opacity="0.6" />
    </svg>
  )
}

export function BackGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="glyph" aria-hidden>
      <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Ba điệu nhảy, mỗi điệu một hình.
export function DanceMoveGlyph({ move }: { move: 'danceTiktok' | 'danceHips' | 'danceSpin' }) {
  if (move === 'danceTiktok')
    return (
      <svg viewBox="0 0 24 24" className="glyph small" aria-hidden>
        <path d="M13 3v11.5a3.5 3.5 0 1 1-3-3.46" fill="none" stroke="#3de0ff" strokeWidth="3" strokeLinecap="round" transform="translate(-1 1)" />
        <path d="M13 3v11.5a3.5 3.5 0 1 1-3-3.46" fill="none" stroke="#ff4f7b" strokeWidth="3" strokeLinecap="round" transform="translate(1 -1)" />
        <path d="M13 3v11.5a3.5 3.5 0 1 1-3-3.46M13 3c.5 2.5 2.5 4 5 4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    )
  if (move === 'danceHips')
    return (
      <svg viewBox="0 0 24 24" className="glyph small" aria-hidden>
        <path d="M3 9c3-4 6 4 9 0s6 4 9 0M3 15c3-4 6 4 9 0s6 4 9 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M3 9c3-4 6 4 9 0s6 4 9 0" fill="none" stroke="#ffd84d" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M3 15c3-4 6 4 9 0s6 4 9 0" fill="none" stroke="#ff8a3d" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className="glyph small" aria-hidden>
      <path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="#5cec7f" strokeWidth="3" strokeLinecap="round" />
      <path d="M18.5 3.5v4.2h-4.2" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 3.5v4.2h-4.2" fill="none" stroke="#5cec7f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Bảng nhiệm vụ: kẹp giấy có dấu tích xanh.
export function QuestGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="glyph quest-glyph" aria-hidden>
      <rect x="4" y="3.5" width="16" height="19" rx="2.5" fill="#c9844a" stroke={INK} strokeWidth="1.6" />
      <rect x="6.3" y="6" width="11.4" height="14.2" rx="1" fill="#fffaf0" />
      <rect x="8.5" y="2" width="7" height="4" rx="1.4" fill="#9aa3b5" stroke={INK} strokeWidth="1.4" />
      <path d="M8.5 13.2l2.4 2.4 4.6-5" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 13.2l2.4 2.4 4.6-5" fill="none" stroke="#3ddc6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
