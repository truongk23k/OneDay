// "Liên Quậy" — mini-game đánh đường giữa trong điện thoại, kiểu Liên Quân thu nhỏ.
// Làn đi từ 0 (trụ nhà, phe xanh) tới 1 (trụ địch, phe đỏ). Có tướng địch AI, lính hai phe, trụ, 4 chiêu,
// lên cấp, vàng. Hàm thuần: một bước thời gian trả về trận mới và các sự kiện (để vẽ hiệu ứng, phát tiếng).
export const MOBA = {
  hero: { hp: 300, hpPerLevel: 45, speed: 0.15, attack: 22, perLevel: 0.2, range: 0.07, attackCd: 0.45 },
  skill1: { dmg: 55, range: 0.1, cd: 5 },
  skill2: { dmg: 45, dist: 0.16, cd: 7 },
  ult: { dmg: 160, range: 0.28, cd: 14, stun: 1.6, level: 3 },
  enemy: { speed: 0.11, attack: 18, range: 0.07, attackCd: 0.6, skillDmg: 45, skillRange: 0.1, skillCd: 6, retreatAt: 0.3 },
  minion: { hp: 80, speed: 0.07, attack: 9, range: 0.03, cd: 0.8 },
  tower: { hp: 600, allyX: 0.06, enemyX: 0.94, range: 0.13, dmg: 45, cd: 1 },
  wave: { every: 10, count: 3, gap: 0.035, first: 2 },
  respawn: 4,
  regenHome: 30,
  levels: [0, 60, 160, 300],
  reward: { minion: { gold: 15, xp: 20 }, hero: { gold: 150, xp: 100 } },
}

export type Side = 'ally' | 'enemy'
export type Minion = { id: number; side: Side; x: number; hp: number; cd: number }
export type Hero = { x: number; hp: number; level: number; xp: number; gold: number; cd0: number; cd1: number; cd2: number; cdU: number; dead: number }
export type EnemyHero = { x: number; hp: number; cd0: number; cdS: number; dead: number; stun: number }
export type Match = {
  hero: Hero
  enemy: EnemyHero
  minions: Minion[]
  towers: { ally: number; enemy: number }
  towerCd: { ally: number; enemy: number }
  waveIn: number
  nextId: number
  time: number
  kills: number
  deaths: number
  result: 'win' | 'lose' | null
}
export type MatchInput = { move: number; attack: boolean; skill1: boolean; skill2: boolean; ult: boolean }
export type MatchEvent = {
  kind: 'hit' | 'kill' | 'heroKill' | 'death' | 'levelUp' | 'skill' | 'ult' | 'towerHit' | 'towerDown' | 'enemySkill'
  x: number
  amount?: number
  // Phe bị trúng đòn (để tô màu số sát thương).
  side?: Side
}

const HOME_X = 0.1
const ENEMY_HOME = MOBA.tower.enemyX - 0.04
const MAX_X = MOBA.tower.enemyX - 0.03

export const levelFor = (xp: number) => MOBA.levels.filter((t) => xp >= t).length
export const maxHp = (level: number) => MOBA.hero.hp + MOBA.hero.hpPerLevel * (level - 1)

export const newMatch = (): Match => ({
  hero: { x: HOME_X, hp: MOBA.hero.hp, level: 1, xp: 0, gold: 0, cd0: 0, cd1: 0, cd2: 0, cdU: 0, dead: 0 },
  enemy: { x: ENEMY_HOME, hp: MOBA.hero.hp, cd0: 0, cdS: 0, dead: 0, stun: 0 },
  minions: [],
  towers: { ally: MOBA.tower.hp, enemy: MOBA.tower.hp },
  towerCd: { ally: 0, enemy: 0 },
  waveIn: MOBA.wave.first,
  nextId: 1,
  time: 0,
  kills: 0,
  deaths: 0,
  result: null,
})

export function stepMatch(prev: Match, dt: number, input: MatchInput): { match: Match; events: MatchEvent[] } {
  if (prev.result) return { match: prev, events: [] }
  const m: Match = {
    ...prev,
    hero: { ...prev.hero },
    enemy: { ...prev.enemy },
    minions: prev.minions.map((n) => ({ ...n })),
    towers: { ...prev.towers },
    towerCd: { ...prev.towerCd },
    time: prev.time + dt,
  }
  const ev: MatchEvent[] = []
  const h = m.hero
  const e = m.enemy
  const tick = (v: number) => Math.max(0, v - dt)
  h.cd0 = tick(h.cd0)
  h.cd1 = tick(h.cd1)
  h.cd2 = tick(h.cd2)
  h.cdU = tick(h.cdU)
  e.cd0 = tick(e.cd0)
  e.cdS = tick(e.cdS)
  m.towerCd.ally = tick(m.towerCd.ally)
  m.towerCd.enemy = tick(m.towerCd.enemy)
  const enemyAlive = e.dead === 0

  // Ai gây đòn chí mạng cho lính / tướng địch thì nhận thưởng (chỉ tướng của mình mới có vàng, kinh nghiệm).
  const reward = (r: { gold: number; xp: number }) => {
    h.gold += r.gold
    const before = h.level
    h.xp += r.xp
    h.level = levelFor(h.xp)
    if (h.level > before) {
      h.hp = Math.min(maxHp(h.level), h.hp + maxHp(h.level) * 0.3)
      ev.push({ kind: 'levelUp', x: h.x, amount: h.level })
    }
  }
  const power = 1 + MOBA.hero.perLevel * (h.level - 1)
  const hitMinion = (n: Minion, dmg: number, byHero: boolean) => {
    if (n.hp <= 0) return
    n.hp -= dmg
    ev.push({ kind: 'hit', x: n.x, amount: Math.round(dmg), side: n.side })
    if (n.hp <= 0) {
      ev.push({ kind: 'kill', x: n.x, side: n.side })
      if (byHero && n.side === 'enemy') reward(MOBA.reward.minion)
    }
  }
  const hitEnemyHero = (dmg: number, byHero: boolean) => {
    if (e.dead > 0) return
    e.hp -= dmg
    ev.push({ kind: 'hit', x: e.x, amount: Math.round(dmg), side: 'enemy' })
    if (e.hp <= 0) {
      e.hp = 0
      e.dead = MOBA.respawn
      m.kills++
      ev.push({ kind: 'heroKill', x: e.x })
      if (byHero) reward(MOBA.reward.hero)
    }
  }
  const hitHero = (dmg: number) => {
    if (h.dead > 0) return
    h.hp -= dmg
    ev.push({ kind: 'hit', x: h.x, amount: Math.round(dmg), side: 'ally' })
    if (h.hp <= 0) {
      h.hp = 0
      h.dead = MOBA.respawn
      m.deaths++
      ev.push({ kind: 'death', x: h.x })
    }
  }
  const hitTower = (side: Side, dmg: number) => {
    m.towers[side] = Math.max(0, m.towers[side] - dmg)
    const x = side === 'ally' ? MOBA.tower.allyX : MOBA.tower.enemyX
    ev.push({ kind: 'towerHit', x, amount: Math.round(dmg), side })
    if (m.towers[side] === 0) ev.push({ kind: 'towerDown', x, side })
  }
  const enemiesNear = (x: number, r: number) => m.minions.filter((n) => n.side === 'enemy' && n.hp > 0 && Math.abs(n.x - x) <= r)

  // ---------- Tướng của mình ----------
  if (h.dead > 0) {
    h.dead = tick(h.dead)
    if (h.dead === 0) {
      h.x = HOME_X
      h.hp = maxHp(h.level)
    }
  } else {
    h.x = Math.max(0.04, Math.min(MAX_X, h.x + Math.sign(input.move) * MOBA.hero.speed * dt))
    if (h.x < 0.14) h.hp = Math.min(maxHp(h.level), h.hp + MOBA.regenHome * dt)
    if (input.attack && h.cd0 === 0) {
      h.cd0 = MOBA.hero.attackCd
      const dmg = MOBA.hero.attack * power
      // Đánh mục tiêu gần nhất trong tầm: lính, tướng địch, rồi trụ.
      const near = enemiesNear(h.x, MOBA.hero.range).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0]
      if (near) hitMinion(near, dmg, true)
      else if (enemyAlive && Math.abs(e.x - h.x) <= MOBA.hero.range) hitEnemyHero(dmg, true)
      else if (MOBA.tower.enemyX - h.x <= MOBA.hero.range) hitTower('enemy', dmg)
    }
    if (input.skill1 && h.cd1 === 0) {
      h.cd1 = MOBA.skill1.cd
      ev.push({ kind: 'skill', x: h.x, amount: 1 })
      const dmg = MOBA.skill1.dmg * power
      for (const n of enemiesNear(h.x, MOBA.skill1.range)) hitMinion(n, dmg, true)
      if (enemyAlive && Math.abs(e.x - h.x) <= MOBA.skill1.range) hitEnemyHero(dmg, true)
      if (MOBA.tower.enemyX - h.x <= MOBA.skill1.range) hitTower('enemy', dmg * 0.5)
    }
    if (input.skill2 && h.cd2 === 0) {
      h.cd2 = MOBA.skill2.cd
      ev.push({ kind: 'skill', x: h.x, amount: 2 })
      const from = h.x
      h.x = Math.min(MAX_X, h.x + MOBA.skill2.dist)
      const dmg = MOBA.skill2.dmg * power
      for (const n of m.minions) if (n.side === 'enemy' && n.x >= from - 0.02 && n.x <= h.x + 0.03) hitMinion(n, dmg, true)
      if (enemyAlive && e.x >= from - 0.02 && e.x <= h.x + 0.03) hitEnemyHero(dmg, true)
    }
    if (input.ult && h.cdU === 0 && h.level >= MOBA.ult.level) {
      h.cdU = MOBA.ult.cd
      ev.push({ kind: 'ult', x: h.x })
      const dmg = MOBA.ult.dmg * power
      for (const n of m.minions) if (n.side === 'enemy' && n.x >= h.x - 0.03 && n.x - h.x <= MOBA.ult.range) hitMinion(n, dmg, true)
      if (enemyAlive && e.x >= h.x - 0.03 && e.x - h.x <= MOBA.ult.range) {
        hitEnemyHero(dmg, true)
        e.stun = MOBA.ult.stun
      }
    }
  }

  // ---------- Tướng địch (AI) ----------
  if (e.dead > 0) {
    e.dead = tick(e.dead)
    if (e.dead === 0) {
      e.x = ENEMY_HOME
      e.hp = MOBA.hero.hp
    }
  } else if (e.stun > 0) {
    e.stun = tick(e.stun)
  } else {
    if (e.x > MOBA.tower.enemyX - 0.12) e.hp = Math.min(MOBA.hero.hp, e.hp + MOBA.regenHome * dt)
    const low = e.hp < MOBA.hero.hp * MOBA.enemy.retreatAt
    // Mục tiêu gần nhất: lính xanh, tướng mình, trụ xanh.
    const allies = m.minions.filter((n) => n.side === 'ally' && n.hp > 0)
    const nearMinion = allies.sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0]
    const dMinion = nearMinion ? Math.abs(nearMinion.x - e.x) : Infinity
    const dHero = h.dead === 0 ? Math.abs(h.x - e.x) : Infinity
    const dTower = e.x - MOBA.tower.allyX
    if (low) {
      e.x = Math.min(ENEMY_HOME, e.x + MOBA.enemy.speed * dt)
    } else {
      if (h.dead === 0 && e.cdS === 0 && dHero <= MOBA.enemy.skillRange) {
        e.cdS = MOBA.enemy.skillCd
        ev.push({ kind: 'enemySkill', x: e.x })
        hitHero(MOBA.enemy.skillDmg)
      }
      const inRange = Math.min(dMinion, dHero, dTower) <= MOBA.enemy.range
      if (inRange) {
        if (e.cd0 === 0) {
          e.cd0 = MOBA.enemy.attackCd
          if (dMinion <= dHero && dMinion <= MOBA.enemy.range) hitMinion(nearMinion!, MOBA.enemy.attack, false)
          else if (dHero <= MOBA.enemy.range) hitHero(MOBA.enemy.attack)
          else hitTower('ally', MOBA.enemy.attack)
        }
      } else {
        // Không lao vào tầm trụ xanh nếu không có lính đỏ đi cùng.
        const escorted = m.minions.some((n) => n.side === 'enemy' && n.hp > 0 && n.x - MOBA.tower.allyX <= MOBA.tower.range)
        const nextX = e.x - MOBA.enemy.speed * dt
        if (escorted || nextX - MOBA.tower.allyX > MOBA.tower.range + 0.02) e.x = nextX
      }
    }
  }

  // ---------- Lính hai phe ----------
  for (const n of m.minions) {
    if (n.hp <= 0) continue
    n.cd = tick(n.cd)
    const dir = n.side === 'ally' ? 1 : -1
    const foes = m.minions.filter((o) => o.side !== n.side && o.hp > 0)
    const nearFoe = foes.sort((a, b) => Math.abs(a.x - n.x) - Math.abs(b.x - n.x))[0]
    const dFoe = nearFoe ? Math.abs(nearFoe.x - n.x) : Infinity
    const foeHeroX = n.side === 'ally' ? (e.dead === 0 ? e.x : null) : h.dead === 0 ? h.x : null
    const dHero = foeHeroX === null ? Infinity : Math.abs(foeHeroX - n.x)
    const towerX = n.side === 'ally' ? MOBA.tower.enemyX : MOBA.tower.allyX
    const dTower = Math.abs(towerX - n.x)
    const best = Math.min(dFoe, dHero, dTower)
    if (best <= MOBA.minion.range) {
      if (n.cd === 0) {
        n.cd = MOBA.minion.cd
        if (best === dFoe) hitMinion(nearFoe!, MOBA.minion.attack, false)
        else if (best === dHero) {
          if (n.side === 'ally') hitEnemyHero(MOBA.minion.attack, false)
          else hitHero(MOBA.minion.attack)
        } else hitTower(n.side === 'ally' ? 'enemy' : 'ally', MOBA.minion.attack)
      }
    } else n.x += dir * MOBA.minion.speed * dt
  }

  // ---------- Trụ: bắn lính địch trong tầm trước, rồi mới tới tướng ----------
  const towerShoot = (side: Side) => {
    if (m.towerCd[side] > 0 || m.towers[side] <= 0) return
    const tx = side === 'ally' ? MOBA.tower.allyX : MOBA.tower.enemyX
    const foe: Side = side === 'ally' ? 'enemy' : 'ally'
    const target = m.minions
      .filter((n) => n.side === foe && n.hp > 0 && Math.abs(n.x - tx) <= MOBA.tower.range)
      .sort((a, b) => Math.abs(a.x - tx) - Math.abs(b.x - tx))[0]
    if (target) hitMinion(target, MOBA.tower.dmg, false)
    else if (side === 'enemy' && h.dead === 0 && Math.abs(h.x - tx) <= MOBA.tower.range) hitHero(MOBA.tower.dmg)
    else if (side === 'ally' && e.dead === 0 && Math.abs(e.x - tx) <= MOBA.tower.range) hitEnemyHero(MOBA.tower.dmg, false)
    else return
    m.towerCd[side] = MOBA.tower.cd
  }
  towerShoot('ally')
  towerShoot('enemy')

  m.minions = m.minions.filter((n) => n.hp > 0)

  // ---------- Đợt lính mới ----------
  m.waveIn -= dt
  if (m.waveIn <= 0) {
    m.waveIn = MOBA.wave.every
    for (let i = 0; i < MOBA.wave.count; i++) {
      m.minions.push({ id: m.nextId++, side: 'ally', x: MOBA.tower.allyX + 0.03 - i * MOBA.wave.gap, hp: MOBA.minion.hp, cd: 0 })
      m.minions.push({ id: m.nextId++, side: 'enemy', x: MOBA.tower.enemyX - 0.03 + i * MOBA.wave.gap, hp: MOBA.minion.hp, cd: 0 })
    }
  }

  m.result = m.towers.enemy <= 0 ? 'win' : m.towers.ally <= 0 ? 'lose' : null
  return { match: m, events: ev }
}
