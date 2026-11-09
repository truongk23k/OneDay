// "Liên Quậy" — mini-game đánh đường giữa trong điện thoại (1 làn, 1 tướng, lính và trụ địch).
// Làn đi từ 0 (trụ nhà) tới 1 (trụ địch). Hàm thuần: một bước thời gian, dễ test.
export const MOBA = {
  heroHp: 100,
  heroSpeed: 0.12,
  range: 0.08,
  attack: 12,
  attackCooldown: 0.25,
  skill: 30,
  skillRange: 0.13,
  skillCooldown: 3,
  towerX: 0.92,
  towerHp: 120,
  towerRange: 0.12,
  towerDps: 14,
  minionHp: 40,
  minionSpeed: 0.08,
  minionDps: 6,
  minionGap: 0.03,
  spawnEvery: 4,
  homeRegen: 10,
  gold: 10,
}

export type Minion = { x: number; hp: number }
export type Match = {
  hero: { x: number; hp: number }
  minions: Minion[]
  enemyTower: number
  spawnIn: number
  attackReady: number
  skillReady: number
  gold: number
  time: number
  result: 'win' | 'lose' | null
}
export type MatchInput = { attack: boolean; skill: boolean; back: boolean }

export const newMatch = (): Match => ({
  hero: { x: 0.1, hp: MOBA.heroHp },
  minions: [],
  enemyTower: MOBA.towerHp,
  spawnIn: 1.5,
  attackReady: 0,
  skillReady: 0,
  gold: 0,
  time: 0,
  result: null,
})

export function stepMatch(m: Match, dt: number, input: MatchInput): Match {
  if (m.result) return m
  let { x, hp } = m.hero
  let tower = m.enemyTower
  let gold = m.gold
  let minions = m.minions.map((n) => ({ ...n }))
  let attackReady = Math.max(0, m.attackReady - dt)
  let skillReady = Math.max(0, m.skillReady - dt)
  let spawnIn = m.spawnIn - dt
  if (spawnIn <= 0) {
    minions.push({ x: MOBA.towerX - 0.02, hp: MOBA.minionHp })
    spawnIn = MOBA.spawnEvery
  }

  const nearest = () => minions.filter((n) => n.x >= x).sort((a, b) => a.x - b.x)[0]
  const towerInRange = (r: number) => MOBA.towerX - x <= r

  // Đánh thường: lính gần nhất trong tầm, không có lính thì đánh trụ.
  if (input.attack && attackReady === 0) {
    const target = nearest()
    if (target && target.x - x <= MOBA.range) target.hp -= MOBA.attack
    else if (towerInRange(MOBA.range)) tower -= MOBA.attack
    attackReady = MOBA.attackCooldown
  }
  // Chiêu: trúng mọi lính trong tầm (và trụ nếu đứng gần).
  if (input.skill && skillReady === 0) {
    for (const n of minions) if (Math.abs(n.x - x) <= MOBA.skillRange) n.hp -= MOBA.skill
    if (towerInRange(MOBA.skillRange)) tower -= MOBA.skill
    skillReady = MOBA.skillCooldown
  }
  const before = minions.length
  minions = minions.filter((n) => n.hp > 0)
  gold += (before - minions.length) * MOBA.gold

  // Tướng tự đi lên, dừng khi gặp lính hoặc tới chân trụ; giữ "Lùi" thì đi về nhà.
  const block = nearest()
  if (input.back) x = Math.max(0.06, x - MOBA.heroSpeed * dt)
  else if (!(block && block.x - x <= MOBA.range) && x < MOBA.towerX - 0.06) x = Math.min(MOBA.towerX - 0.06, x + MOBA.heroSpeed * dt)

  // Lính đi xuống tới sát tướng thì đứng lại đánh.
  for (const n of minions) {
    if (n.x - x > MOBA.minionGap) n.x = Math.max(x + MOBA.minionGap, n.x - MOBA.minionSpeed * dt)
    else hp -= MOBA.minionDps * dt
  }
  if (towerInRange(MOBA.towerRange)) hp -= MOBA.towerDps * dt
  if (x < 0.15) hp = Math.min(MOBA.heroHp, hp + MOBA.homeRegen * dt)

  const result = tower <= 0 ? 'win' : hp <= 0 ? 'lose' : null
  return {
    hero: { x, hp: Math.max(0, hp) },
    minions,
    enemyTower: Math.max(0, tower),
    spawnIn,
    attackReady,
    skillReady,
    gold,
    time: m.time + dt,
    result,
  }
}
