import { MOBA, maxHp, type Match } from '../../story/moba'

// Đồ hoạ Liên Quậy: cảnh ban ngày kiểu fantasy, trụ có mái và quả cầu sáng, lính và tướng chibi,
// hiệu ứng chiêu. Mọi thứ vẽ bằng canvas 2D theo tỉ lệ chiều cao h để to nhỏ theo cỡ điện thoại.
export type Floater = { x: number; y: number; text: string; color: string; age: number; big?: boolean }
export type Fx = { kind: 'spin' | 'dash' | 'ult' | 'enemySkill' | 'shot' | 'levelUp'; x: number; age: number; from?: number; side?: 'ally' | 'enemy' }
export type Look = { flash: Map<number, number>; heroMoving: boolean; enemyMoving: boolean; now: number }

const ALLY = { main: '#3d8bff', dark: '#1f4fbf', light: '#9cc9ff' }
const ENEMY = { main: '#ff5b4d', dark: '#9c2418', light: '#ffb0a6' }
const INK = 'rgba(20, 16, 40, 0.75)'

// Số giả ngẫu nhiên cố định theo chỉ số (hoa cỏ không nhảy lung tung mỗi khung hình).
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function background(ctx: CanvasRenderingContext2D, w: number, h: number, ground: number, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, ground)
  sky.addColorStop(0, '#5bb8ff')
  sky.addColorStop(1, '#d6f1ff')
  ctx.fillStyle = sky
  ctx.fillRect(-20, -20, w + 40, ground + 20)
  const sun = ctx.createRadialGradient(w * 0.8, h * 0.16, 0, w * 0.8, h * 0.16, h * 0.22)
  sun.addColorStop(0, 'rgba(255, 250, 210, 1)')
  sun.addColorStop(0.35, 'rgba(255, 235, 150, 0.7)')
  sun.addColorStop(1, 'rgba(255, 235, 150, 0)')
  ctx.fillStyle = sun
  ctx.fillRect(w * 0.55, -10, w * 0.5, h * 0.5)
  // Mây trôi chậm.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  for (let i = 0; i < 4; i++) {
    const cx = ((((i * 0.31 + t * 0.008 * (1 + i * 0.4)) % 1.25) + 1.25) % 1.25 - 0.12) * w
    const cy = h * (0.12 + i * 0.045)
    const s = h * (0.05 + rnd(i) * 0.03)
    ctx.beginPath()
    ctx.ellipse(cx, cy, s * 1.6, s * 0.7, 0, 0, Math.PI * 2)
    ctx.ellipse(cx - s * 1.1, cy + s * 0.2, s, s * 0.55, 0, 0, Math.PI * 2)
    ctx.ellipse(cx + s * 1.2, cy + s * 0.25, s * 1.1, s * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Núi xa hai lớp và một dải rừng.
  const ridge = (color: string, base: number, amp: number, seed: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(-20, ground)
    for (let i = 0; i <= 10; i++) ctx.lineTo((i / 10) * w, base - h * amp * (0.4 + 0.6 * rnd(i + seed)))
    ctx.lineTo(w + 20, ground)
    ctx.fill()
  }
  ridge('#a6c8ea', ground - h * 0.12, 0.2, 3)
  ridge('#7fa9d6', ground - h * 0.06, 0.14, 11)
  ctx.fillStyle = '#2f7a45'
  for (let i = 0; i < 26; i++) {
    const tx = (i / 25) * w
    const r = h * (0.045 + rnd(i + 40) * 0.03)
    ctx.beginPath()
    ctx.arc(tx, ground - h * 0.05, r, Math.PI, 0)
    ctx.fill()
  }
  ctx.fillRect(-20, ground - h * 0.05, w + 40, h * 0.02)
  // Cỏ.
  const grass = ctx.createLinearGradient(0, ground - h * 0.04, 0, h)
  grass.addColorStop(0, '#6cc95c')
  grass.addColorStop(1, '#3a9139')
  ctx.fillStyle = grass
  ctx.fillRect(-20, ground - h * 0.04, w + 40, h)
  // Đường lát đá hai hàng so le.
  const top = ground - h * 0.025
  const lane = h * 0.11
  ctx.fillStyle = '#b39d74'
  ctx.fillRect(-20, top, w + 40, lane)
  const tw = h * 0.11
  for (let row = 0; row < 2; row++) {
    for (let i = -1; i < w / tw + 1; i++) {
      const x = i * tw + (row ? tw / 2 : 0)
      ctx.fillStyle = (i + row) % 2 ? '#d8c59d' : '#cdb88e'
      roundRect(ctx, x + 1.5, top + row * (lane / 2) + 1.5, tw - 3, lane / 2 - 3, 3)
      ctx.fill()
    }
  }
  ctx.fillStyle = '#7d6a48'
  ctx.fillRect(-20, top - 2, w + 40, 3)
  ctx.fillRect(-20, top + lane - 1, w + 40, 3)
  // Hoa và bụi cỏ dưới đường.
  for (let i = 0; i < 40; i++) {
    const fx = rnd(i + 90) * w
    const fy = top + lane + h * 0.02 + rnd(i + 130) * (h - top - lane) * 0.9
    if (i % 3 === 0) {
      ctx.fillStyle = ['#ffd84d', '#ff8fb1', '#ffffff'][i % 3 === 0 ? (i / 3) % 3 : 0]
      ctx.beginPath()
      ctx.arc(fx, fy, h * 0.008, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.strokeStyle = '#2f7f32'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(fx, fy)
      ctx.lineTo(fx - 2, fy - h * 0.02)
      ctx.moveTo(fx, fy)
      ctx.lineTo(fx + 2, fy - h * 0.018)
      ctx.stroke()
    }
  }
}

function bar(ctx: CanvasRenderingContext2D, cx: number, y: number, bw: number, v: number, color: string, h: number) {
  const bh = Math.max(4, h * 0.016)
  ctx.fillStyle = INK
  roundRect(ctx, cx - bw / 2 - 1.5, y - 1.5, bw + 3, bh + 3, 2)
  ctx.fill()
  ctx.fillStyle = color
  roundRect(ctx, cx - bw / 2, y, Math.max(0, bw * Math.min(1, v)), bh, 1.5)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(cx - bw / 2, y, Math.max(0, bw * Math.min(1, v)), bh * 0.4)
}

function tower(ctx: CanvasRenderingContext2D, tx: number, ground: number, h: number, hp: number, team: typeof ALLY, t: number) {
  // Bệ phát sáng màu phe.
  const glow = ctx.createRadialGradient(tx, ground + h * 0.03, 0, tx, ground + h * 0.03, h * 0.16)
  glow.addColorStop(0, `${team.main}aa`)
  glow.addColorStop(1, `${team.main}00`)
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.ellipse(tx, ground + h * 0.03, h * 0.16, h * 0.045, 0, 0, Math.PI * 2)
  ctx.fill()
  if (hp <= 0) {
    ctx.fillStyle = '#6f6a80'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(tx + (i - 2) * h * 0.025, ground - h * 0.01 - rnd(i) * h * 0.02, h * 0.022, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(80, 80, 90, 0.35)'
    ctx.beginPath()
    ctx.arc(tx, ground - h * 0.08 - ((t * 0.04) % 0.06) * h, h * 0.04, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.lineWidth = 2
  ctx.strokeStyle = INK
  // Chân trụ đá.
  ctx.fillStyle = '#8d8aa0'
  ctx.beginPath()
  ctx.moveTo(tx - h * 0.075, ground + h * 0.01)
  ctx.lineTo(tx + h * 0.075, ground + h * 0.01)
  ctx.lineTo(tx + h * 0.055, ground - h * 0.05)
  ctx.lineTo(tx - h * 0.055, ground - h * 0.05)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Thân trụ có vạch gạch và đai màu phe.
  ctx.fillStyle = '#b4b0c6'
  roundRect(ctx, tx - h * 0.04, ground - h * 0.24, h * 0.08, h * 0.2, 3)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(70, 60, 90, 0.35)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = ground - h * 0.05 - i * h * 0.045
    ctx.beginPath()
    ctx.moveTo(tx - h * 0.04, y)
    ctx.lineTo(tx + h * 0.04, y)
    ctx.stroke()
  }
  ctx.fillStyle = team.main
  ctx.fillRect(tx - h * 0.042, ground - h * 0.17, h * 0.084, h * 0.025)
  // Mái nhọn màu phe.
  ctx.fillStyle = team.dark
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tx - h * 0.06, ground - h * 0.24)
  ctx.lineTo(tx + h * 0.06, ground - h * 0.24)
  ctx.lineTo(tx, ground - h * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // Quả cầu năng lượng phát sáng nhấp nháy.
  const pulse = 0.75 + 0.25 * Math.sin(t * 3.5)
  const oy = ground - h * 0.37
  const orb = ctx.createRadialGradient(tx, oy, 0, tx, oy, h * 0.07)
  orb.addColorStop(0, '#ffffff')
  orb.addColorStop(0.35, team.light)
  orb.addColorStop(0.6, `${team.main}cc`)
  orb.addColorStop(1, `${team.main}00`)
  ctx.fillStyle = orb
  ctx.beginPath()
  ctx.arc(tx, oy, h * 0.07 * pulse, 0, Math.PI * 2)
  ctx.fill()
  // Cờ.
  ctx.strokeStyle = '#5b4a3a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tx + h * 0.05, ground - h * 0.24)
  ctx.lineTo(tx + h * 0.05, ground - h * 0.36)
  ctx.stroke()
  ctx.fillStyle = team.main
  ctx.beginPath()
  const wave = Math.sin(t * 5) * h * 0.006
  ctx.moveTo(tx + h * 0.05, ground - h * 0.36)
  ctx.lineTo(tx + h * 0.1, ground - h * 0.345 + wave)
  ctx.lineTo(tx + h * 0.05, ground - h * 0.32)
  ctx.fill()
  // Thanh máu trụ đặt ngay trên thân trụ (phía trên bị thanh HUD che).
  bar(ctx, tx, ground - h * 0.135, h * 0.17, hp / MOBA.tower.hp, team === ALLY ? '#4be36f' : '#ff4d4d', h)
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.beginPath()
  ctx.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
}

function minion(ctx: CanvasRenderingContext2D, x: number, ground: number, h: number, ally: boolean, hp: number, t: number, id: number, flash: boolean) {
  const team = ally ? ALLY : ENEMY
  const dir = ally ? 1 : -1
  const s = h * 0.034
  const step = Math.sin(t * 10 + id)
  const feet = ground + h * 0.04
  shadow(ctx, x, feet, s * 1.1)
  ctx.strokeStyle = '#3a3346'
  ctx.lineWidth = Math.max(2, s * 0.3)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - s * 0.3, feet - s * 0.9)
  ctx.lineTo(x - s * 0.3 + step * s * 0.35, feet)
  ctx.moveTo(x + s * 0.3, feet - s * 0.9)
  ctx.lineTo(x + s * 0.3 - step * s * 0.35, feet)
  ctx.stroke()
  const by = feet - s * 2.2 + Math.abs(step) * s * 0.12
  ctx.fillStyle = flash ? '#ffffff' : team.main
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.5
  roundRect(ctx, x - s * 0.7, by, s * 1.4, s * 1.4, s * 0.4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = flash ? '#ffffff' : '#ffd7b0'
  ctx.beginPath()
  ctx.arc(x, by - s * 0.45, s * 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = team.dark
  ctx.beginPath()
  ctx.arc(x, by - s * 0.55, s * 0.62, Math.PI, 0)
  ctx.fill()
  ctx.fillStyle = '#1b1530'
  ctx.beginPath()
  ctx.arc(x + dir * s * 0.25, by - s * 0.4, s * 0.1, 0, Math.PI * 2)
  ctx.fill()
  // Giáo.
  ctx.strokeStyle = '#8a6a3f'
  ctx.lineWidth = Math.max(1.5, s * 0.18)
  ctx.beginPath()
  ctx.moveTo(x + dir * s * 0.6, by + s * 1.2)
  ctx.lineTo(x + dir * s * 1.2, by - s * 0.9)
  ctx.stroke()
  ctx.fillStyle = '#dfe6ee'
  ctx.beginPath()
  ctx.moveTo(x + dir * s * 1.2, by - s * 1.3)
  ctx.lineTo(x + dir * s * 1.35, by - s * 0.8)
  ctx.lineTo(x + dir * s * 1.05, by - s * 0.85)
  ctx.fill()
  bar(ctx, x, by - s * 1.6, s * 2.4, hp / MOBA.minion.hp, ally ? '#4be36f' : '#ff4d4d', h * 0.7)
}

type HeroLook = { x: number; ground: number; h: number; hp: number; max: number; mine: boolean; dead: number; level: number; swing: number; moving: boolean; t: number; flash: boolean; lift: number }

function hero(ctx: CanvasRenderingContext2D, o: HeroLook) {
  const { x, ground, h, mine, t } = o
  const team = mine ? ALLY : ENEMY
  const dir = mine ? 1 : -1
  const s = h * 0.06
  const feet = ground + h * 0.045
  const step = o.moving ? Math.sin(t * 12) : 0
  ctx.globalAlpha = o.dead > 0 ? 0.35 : 1
  shadow(ctx, x, feet, s * 1.1)
  // Áo choàng.
  ctx.fillStyle = mine ? '#1a3f99' : '#4a1a66'
  ctx.beginPath()
  ctx.moveTo(x - dir * s * 0.2, feet - s * 1.9)
  ctx.quadraticCurveTo(x - dir * s * (1.4 + Math.abs(step) * 0.2), feet - s * 1, x - dir * s * 1.1, feet - s * 0.15)
  ctx.lineTo(x - dir * s * 0.1, feet - s * 0.5)
  ctx.closePath()
  ctx.fill()
  // Chân bước.
  ctx.strokeStyle = '#2a2438'
  ctx.lineWidth = s * 0.28
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - s * 0.25, feet - s * 0.8)
  ctx.lineTo(x - s * 0.25 + step * s * 0.4, feet)
  ctx.moveTo(x + s * 0.25, feet - s * 0.8)
  ctx.lineTo(x + s * 0.25 - step * s * 0.4, feet)
  ctx.stroke()
  // Thân giáp.
  const by = feet - s * 1.95
  ctx.fillStyle = o.flash ? '#ffffff' : team.main
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  roundRect(ctx, x - s * 0.62, by, s * 1.24, s * 1.25, s * 0.35)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffd23f'
  ctx.fillRect(x - s * 0.62, by + s * 0.8, s * 1.24, s * 0.16)
  // Đầu.
  const hy = by - s * 0.55
  ctx.fillStyle = o.flash ? '#ffffff' : mine ? '#f6cfa8' : '#b9a6c9'
  ctx.beginPath()
  ctx.arc(x, hy, s * 0.62, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  if (mine) {
    // Tóc đen dựng.
    ctx.fillStyle = '#1b1820'
    ctx.beginPath()
    ctx.arc(x, hy - s * 0.1, s * 0.64, Math.PI * 1.05, Math.PI * 1.95)
    ctx.fill()
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.1 + i * 0.2)
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * s * 0.5, hy + Math.sin(a) * s * 0.5)
      ctx.lineTo(x + Math.cos(a) * s * 0.95, hy + Math.sin(a) * s * 0.95 - s * 0.1)
      ctx.lineTo(x + Math.cos(a + 0.25) * s * 0.55, hy + Math.sin(a + 0.25) * s * 0.55)
      ctx.fill()
    }
    ctx.fillStyle = '#1b1530'
    ctx.beginPath()
    ctx.arc(x + dir * s * 0.25, hy + s * 0.05, s * 0.09, 0, Math.PI * 2)
    ctx.arc(x + dir * s * 0.02, hy + s * 0.05, s * 0.09, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Mũ sắt có sừng, mắt đỏ phát sáng.
    ctx.fillStyle = '#3b2a4f'
    ctx.beginPath()
    ctx.arc(x, hy, s * 0.66, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#f2e6c9'
    for (const k of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(x + k * s * 0.45, hy - s * 0.35)
      ctx.quadraticCurveTo(x + k * s * 1.1, hy - s * 0.8, x + k * s * 0.85, hy - s * 1.3)
      ctx.lineTo(x + k * s * 0.25, hy - s * 0.5)
      ctx.fill()
    }
    ctx.fillStyle = '#ff3b3b'
    ctx.shadowColor = '#ff3b3b'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(x + dir * s * 0.22, hy + s * 0.05, s * 0.09, 0, Math.PI * 2)
    ctx.arc(x - dir * s * 0.05, hy + s * 0.05, s * 0.09, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
  // Kiếm vung theo nhịp đánh, có vệt chém.
  const ang = -1.2 + o.swing * 2.4
  const hx = x + dir * s * 0.7
  const hyy = by + s * 0.5
  const tipX = hx + dir * Math.cos(ang) * s * 1.8
  const tipY = hyy + Math.sin(ang) * s * 1.8
  if (o.swing > 0.05 && o.swing < 0.95) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = s * 0.35
    ctx.beginPath()
    ctx.arc(hx, hyy, s * 1.6, dir > 0 ? -1.2 : Math.PI + 1.2 - 2.4 * o.swing, dir > 0 ? ang : Math.PI + 1.2, dir < 0)
    ctx.stroke()
  }
  ctx.strokeStyle = '#e8eef7'
  ctx.lineWidth = s * 0.22
  ctx.beginPath()
  ctx.moveTo(hx, hyy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()
  ctx.strokeStyle = '#ffd23f'
  ctx.lineWidth = s * 0.25
  ctx.beginPath()
  ctx.moveTo(hx - Math.sin(ang) * s * 0.3 * dir, hyy + Math.cos(ang) * s * 0.3)
  ctx.lineTo(hx + Math.sin(ang) * s * 0.3 * dir, hyy - Math.cos(ang) * s * 0.3)
  ctx.stroke()
  ctx.globalAlpha = 1
  // Bảng tên: huy hiệu cấp + tên + thanh máu.
  const top = hy - s * (1.25 + o.lift)
  bar(ctx, x, top, s * 2.6, o.hp / o.max, mine ? '#4be36f' : '#ff4d4d', h)
  ctx.font = `800 ${Math.round(h * 0.05)}px 'Baloo 2', sans-serif`
  ctx.textAlign = 'center'
  ctx.lineWidth = 3
  ctx.strokeStyle = INK
  ctx.fillStyle = '#fff'
  const name = mine ? 'Anh' : 'Địch'
  ctx.strokeText(name, x + s * 0.3, top - h * 0.012)
  ctx.fillText(name, x + s * 0.3, top - h * 0.012)
  ctx.fillStyle = mine ? '#ffd23f' : '#ff8a7a'
  ctx.beginPath()
  ctx.arc(x - s * 1.05, top - h * 0.025, h * 0.022, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2a1d00'
  ctx.font = `800 ${Math.round(h * 0.032)}px 'Baloo 2', sans-serif`
  ctx.fillText(String(o.level), x - s * 1.05, top - h * 0.014)
  if (o.dead > 0) {
    ctx.font = `800 ${Math.round(h * 0.08)}px 'Baloo 2', sans-serif`
    ctx.strokeStyle = INK
    ctx.fillStyle = '#fff'
    ctx.strokeText(String(Math.ceil(o.dead)), x, by + s * 0.5)
    ctx.fillText(String(Math.ceil(o.dead)), x, by + s * 0.5)
  }
}

function effects(ctx: CanvasRenderingContext2D, w: number, h: number, ground: number, fx: Fx[], heroX: number) {
  const X = (x: number) => x * w
  for (const f of fx) {
    const k = 1 - f.age
    const cy = ground - h * 0.08
    if (f.kind === 'spin') {
      // Ba lưỡi đao xoay quanh tướng.
      for (let i = 0; i < 3; i++) {
        const a = f.age * 12 + (i * Math.PI * 2) / 3
        ctx.strokeStyle = `rgba(140, 220, 255, ${k})`
        ctx.lineWidth = h * 0.02
        ctx.beginPath()
        ctx.arc(X(heroX), cy, X(MOBA.skill1.range) * (0.5 + f.age * 0.6), a, a + 1.2)
        ctx.stroke()
      }
    } else if (f.kind === 'enemySkill') {
      ctx.strokeStyle = `rgba(190, 80, 255, ${k})`
      ctx.lineWidth = h * 0.02 * k + 1
      ctx.beginPath()
      ctx.arc(X(f.x), cy, X(0.1) * (0.3 + f.age), 0, Math.PI * 2)
      ctx.stroke()
    } else if (f.kind === 'dash') {
      const from = X(f.from ?? f.x)
      const to = X(f.x)
      for (let i = 0; i < 4; i++) {
        const y = cy - h * 0.06 + i * h * 0.035
        const g = ctx.createLinearGradient(from, 0, to, 0)
        g.addColorStop(0, 'rgba(255,255,255,0)')
        g.addColorStop(1, `rgba(190, 240, 255, ${k * 0.9})`)
        ctx.strokeStyle = g
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(from + (to - from) * 0.15 * i, y)
        ctx.lineTo(to, y)
        ctx.stroke()
      }
    } else if (f.kind === 'ult') {
      for (let i = 0; i < 6; i++) {
        const bx = X(f.x + (i / 5) * MOBA.ult.range)
        const pts: [number, number][] = [[bx + (rnd(i) - 0.5) * h * 0.1, 0]]
        for (let st = 1; st <= 6; st++) pts.push([bx + (rnd(i * 7 + st + Math.floor(f.age * 10)) - 0.5) * h * 0.12, (st / 6) * (ground - h * 0.02)])
        for (const [width, color] of [[h * 0.03, `rgba(255, 230, 120, ${k * 0.35})`], [3, `rgba(255, 255, 255, ${k})`]] as const) {
          ctx.strokeStyle = color
          ctx.lineWidth = width
          ctx.beginPath()
          pts.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
          ctx.stroke()
        }
      }
      ctx.fillStyle = `rgba(255, 248, 210, ${k * 0.3})`
      ctx.fillRect(0, 0, w, h)
    } else if (f.kind === 'shot') {
      // Đạn năng lượng từ quả cầu trên trụ bay tới mục tiêu.
      const sx = X(f.from ?? f.x)
      const sy = ground - h * 0.37
      const p = Math.min(1, f.age * 2.2)
      const px = sx + (X(f.x) - sx) * p
      const py = sy + (cy - sy) * p
      const c = f.side === 'ally' ? ALLY : ENEMY
      if (p < 1) {
        const g = ctx.createRadialGradient(px, py, 0, px, py, h * 0.035)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(0.5, c.light)
        g.addColorStop(1, `${c.main}00`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, h * 0.035, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (f.kind === 'levelUp') {
      const g = ctx.createLinearGradient(0, 0, 0, ground)
      g.addColorStop(0, 'rgba(255, 230, 120, 0)')
      g.addColorStop(1, `rgba(255, 230, 120, ${k * 0.6})`)
      ctx.fillStyle = g
      ctx.fillRect(X(heroX) - h * 0.05, 0, h * 0.1, ground + h * 0.04)
      ctx.strokeStyle = `rgba(255, 220, 90, ${k})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(X(heroX), ground + h * 0.04, h * 0.05 + f.age * h * 0.12, (h * 0.05 + f.age * h * 0.12) * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, m: Match, t: number, fx: Fx[], floaters: Floater[], shake: number, look: Look) {
  const X = (x: number) => x * w
  // Làn đường nằm trên khu nút điều khiển (nửa dưới là cỏ, nút đặt lên đó).
  const ground = h * 0.56
  ctx.save()
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 8)
  background(ctx, w, h, ground, t)
  tower(ctx, X(MOBA.tower.allyX), ground, h, m.towers.ally, ALLY, t)
  tower(ctx, X(MOBA.tower.enemyX), ground, h, m.towers.enemy, ENEMY, t + 1)
  const flashing = (id: number) => look.now - (look.flash.get(id) ?? -1e9) < 110
  for (const n of m.minions) minion(ctx, X(n.x), ground, h, n.side === 'ally', n.hp, t, n.id, flashing(n.id))
  const enemyX = m.enemy.dead > 0 ? MOBA.tower.enemyX - 0.04 : m.enemy.x
  // Hai tướng đứng sát nhau: đẩy bảng tên của địch lên cho khỏi đè.
  const lift = Math.abs(enemyX - m.hero.x) < 0.08 ? 0.9 : 0
  hero(ctx, {
    x: X(enemyX),
    ground,
    h,
    hp: m.enemy.hp,
    max: MOBA.enemy.hp,
    mine: false,
    dead: m.enemy.dead,
    level: 1 + Math.min(3, Math.floor(m.time / 45)),
    swing: 1 - Math.max(0, m.enemy.cd0 / MOBA.enemy.attackCd),
    moving: look.enemyMoving,
    t,
    flash: flashing(-2),
    lift,
  })
  if (m.enemy.stun > 0) {
    ctx.fillStyle = '#ffd23f'
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + (i * Math.PI * 2) / 3
      ctx.beginPath()
      ctx.arc(X(enemyX) + Math.cos(a) * h * 0.06, ground - h * 0.2 + Math.sin(a) * h * 0.02, h * 0.012, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  hero(ctx, {
    x: X(m.hero.x),
    ground,
    h,
    hp: m.hero.hp,
    max: maxHp(m.hero.level),
    mine: true,
    dead: m.hero.dead,
    level: m.hero.level,
    swing: 1 - Math.max(0, m.hero.cd0 / MOBA.hero.attackCd),
    moving: look.heroMoving,
    t,
    flash: flashing(-1),
    lift: 0,
  })
  effects(ctx, w, h, ground, fx, m.hero.x)
  // Số sát thương và vàng bay lên.
  ctx.textAlign = 'center'
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, (1 - f.age) * 1.6)
    ctx.font = `800 ${Math.round(h * (f.big ? 0.085 : 0.062))}px 'Baloo 2', sans-serif`
    ctx.strokeStyle = INK
    ctx.lineWidth = 3.5
    const y = f.y - f.age * h * 0.14
    ctx.strokeText(f.text, X(f.x), y)
    ctx.fillStyle = f.color
    ctx.fillText(f.text, X(f.x), y)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}
