import { MOBA, levelFor, newMatch, stepMatch, type Match, type MatchInput } from './moba'

const idle: MatchInput = { move: 0, attack: false, skill1: false, skill2: false, ult: false }
const run = (m: Match, seconds: number, input: Partial<MatchInput> = {}) => {
  for (let i = 0; i < seconds * 30; i++) m = stepMatch(m, 1 / 30, { ...idle, ...input }).match
  return m
}
const quiet = (over: Partial<Match> = {}): Match => ({ ...newMatch(), waveIn: 999, ...over })

test('a match starts at home: full health, level 1, both towers standing, nobody won yet', () => {
  const m = newMatch()
  expect(m.hero.x).toBeLessThan(0.2)
  expect(m.hero.hp).toBe(MOBA.hero.hp)
  expect(m.hero.level).toBe(1)
  expect(m.towers).toEqual({ ally: MOBA.tower.hp, enemy: MOBA.tower.hp })
  expect(m.result).toBeNull()
})

test('the hero only moves when told: right, left, or stays', () => {
  const m = quiet()
  expect(run(m, 1).hero.x).toBeCloseTo(m.hero.x)
  expect(run(m, 1, { move: 1 }).hero.x).toBeGreaterThan(m.hero.x + 0.1)
  expect(run({ ...m, hero: { ...m.hero, x: 0.5 } }, 1, { move: -1 }).hero.x).toBeLessThan(0.45)
})

test('waves of minions spawn on both sides and fight in the middle', () => {
  const m = run(newMatch(), 9)
  expect(m.minions.some((n) => n.side === 'ally')).toBe(true)
  expect(m.minions.some((n) => n.side === 'enemy')).toBe(true)
  const hurt = m.minions.some((n) => n.hp < MOBA.minion.hp)
  expect(hurt).toBe(true)
})

test('towers shoot minions before heroes, so diving with your minions is safe-ish', () => {
  const x = MOBA.tower.enemyX - 0.05
  const away = { ...newMatch().enemy, dead: 99 }
  const withMinion = quiet({ hero: { ...newMatch().hero, x }, enemy: away, minions: [{ id: 1, side: 'ally', x: x + 0.01, hp: 999, cd: 0 }] })
  expect(run(withMinion, 1).hero.hp).toBe(MOBA.hero.hp)
  const alone = quiet({ hero: { ...newMatch().hero, x }, enemy: away })
  expect(run(alone, 1).hero.hp).toBeLessThan(MOBA.hero.hp)
})

test('basic attack hits the nearest enemy in range and has a short cooldown', () => {
  const m = quiet({ hero: { ...newMatch().hero, x: 0.4 }, minions: [{ id: 1, side: 'enemy', x: 0.45, hp: 100, cd: 9 }] })
  const a = stepMatch(m, 1 / 30, { ...idle, attack: true })
  expect(a.match.minions[0].hp).toBe(100 - MOBA.hero.attack)
  expect(a.events).toContainEqual(expect.objectContaining({ kind: 'hit' }))
  const b = stepMatch(a.match, 1 / 30, { ...idle, attack: true })
  expect(b.match.minions[0].hp).toBe(100 - MOBA.hero.attack)
})

test('Chém xoáy hits everything around; Lướt chém dashes forward through enemies', () => {
  const minions = [
    { id: 1, side: 'enemy' as const, x: 0.47, hp: 200, cd: 9 },
    { id: 2, side: 'enemy' as const, x: 0.35, hp: 200, cd: 9 },
  ]
  const m = quiet({ hero: { ...newMatch().hero, x: 0.4 }, minions })
  const spin = stepMatch(m, 1 / 30, { ...idle, skill1: true }).match
  expect(spin.minions.every((n) => n.hp < 200)).toBe(true)
  expect(spin.hero.cd1).toBeGreaterThan(0)
  const dash = stepMatch(m, 1 / 30, { ...idle, skill2: true }).match
  expect(dash.hero.x).toBeGreaterThan(0.5)
  expect(dash.minions.find((n) => n.id === 1)!.hp).toBeLessThan(200)
})

test('the ultimate is locked at level 1, then stuns and blasts everything ahead', () => {
  const enemy = { ...newMatch().enemy, x: 0.55 }
  const locked = quiet({ hero: { ...newMatch().hero, x: 0.4 }, enemy })
  expect(stepMatch(locked, 1 / 30, { ...idle, ult: true }).match.enemy.hp).toBe(MOBA.enemy.hp)
  const lv = MOBA.ult.level
  const lv3 = quiet({ hero: { ...newMatch().hero, x: 0.4, level: lv, xp: MOBA.levels[lv - 1] }, enemy })
  const r = stepMatch(lv3, 1 / 30, { ...idle, ult: true })
  expect(r.match.enemy.hp).toBeLessThan(MOBA.enemy.hp - 100)
  expect(r.match.enemy.stun).toBeGreaterThan(0)
  expect(r.events).toContainEqual(expect.objectContaining({ kind: 'ult' }))
})

test('killing minions and the enemy hero gives gold and xp; the enemy comes back later', () => {
  const m = quiet({ hero: { ...newMatch().hero, x: 0.5 }, enemy: { ...newMatch().enemy, x: 0.55, hp: 5 }, minions: [{ id: 1, side: 'enemy', x: 0.52, hp: 5, cd: 9 }] })
  const r = stepMatch(m, 1 / 30, { ...idle, skill1: true })
  expect(r.match.enemy.dead).toBeGreaterThan(0)
  expect(r.match.hero.gold).toBe(MOBA.reward.minion.gold + MOBA.reward.hero.gold)
  expect(r.events.filter((e) => e.kind === 'gold').map((e) => e.amount)).toEqual([MOBA.reward.minion.gold, MOBA.reward.hero.gold])
  expect(r.match.kills).toBe(1)
  expect(r.events).toContainEqual(expect.objectContaining({ kind: 'heroKill' }))
  const later = run(r.match, MOBA.respawn + 0.5)
  expect(later.enemy.dead).toBe(0)
  expect(later.enemy.hp).toBe(MOBA.enemy.hp)
})

test('xp levels the hero up and makes him hit harder', () => {
  expect(levelFor(0)).toBe(1)
  expect(levelFor(MOBA.levels[1])).toBe(2)
  expect(levelFor(99999)).toBe(MOBA.levels.length)
  const m = quiet({ hero: { ...newMatch().hero, x: 0.4, level: 3, xp: MOBA.levels[2] }, minions: [{ id: 1, side: 'enemy', x: 0.45, hp: 500, cd: 9 }] })
  const hit = stepMatch(m, 1 / 30, { ...idle, attack: true }).match
  expect(500 - hit.minions[0].hp).toBeGreaterThan(MOBA.hero.attack)
})

test('dying is not the end: Anh respawns at home after a few seconds', () => {
  const m = quiet({ hero: { ...newMatch().hero, x: MOBA.tower.enemyX - 0.05, hp: 1 } })
  const dead = run(m, 0.5)
  expect(dead.hero.dead).toBeGreaterThan(0)
  expect(dead.deaths).toBe(1)
  expect(dead.result).toBeNull()
  const back = run(dead, MOBA.respawn)
  expect(back.hero.dead).toBe(0)
  expect(back.hero.x).toBeLessThan(0.15)
})

test('the enemy hero walks back home to heal when low, and pushes when healthy', () => {
  const low = quiet({ enemy: { ...newMatch().enemy, x: 0.6, hp: 20 } })
  expect(run(low, 1).enemy.x).toBeGreaterThan(0.6)
  const healthy = quiet({ enemy: { ...newMatch().enemy, x: 0.7 } })
  expect(run(healthy, 1).enemy.x).toBeLessThan(0.7)
})

test('destroying the enemy tower wins; losing yours loses; a finished match stays finished', () => {
  const nearly = quiet({ hero: { ...newMatch().hero, x: MOBA.tower.enemyX - 0.06 }, enemy: { ...newMatch().enemy, dead: 3 }, towers: { ally: MOBA.tower.hp, enemy: 3 } })
  const won = stepMatch(nearly, 1 / 30, { ...idle, attack: true })
  expect(won.match.result).toBe('win')
  expect(won.events).toContainEqual(expect.objectContaining({ kind: 'towerDown' }))
  const falling = quiet({ hero: { ...newMatch().hero, x: 0.5 }, towers: { ally: 1, enemy: MOBA.tower.hp }, minions: [{ id: 1, side: 'enemy', x: MOBA.tower.allyX + 0.02, hp: 999, cd: 0 }] })
  expect(run(falling, 2).result).toBe('lose')
  const done = { ...newMatch(), result: 'win' as const }
  expect(stepMatch(done, 1, { ...idle, attack: true }).match).toBe(done)
})

test('towers shoot visibly: a shot event goes from the tower to its target', () => {
  const m = quiet({ hero: { ...newMatch().hero, x: MOBA.tower.enemyX - 0.05 }, enemy: { ...newMatch().enemy, dead: 99 } })
  const r = stepMatch(m, 1 / 30, idle)
  expect(r.events).toContainEqual(expect.objectContaining({ kind: 'towerShot', side: 'enemy', x: m.hero.x }))
})

test('out of a fight the hero slowly heals', () => {
  const m = quiet({ hero: { ...newMatch().hero, x: 0.5, hp: 100 }, enemy: { ...newMatch().enemy, dead: 99 } })
  expect(run(m, 3).hero.hp).toBeGreaterThan(100)
})

// Người mới chơi: cứ đi tới và giữ đánh, có chiêu là bấm, máu yếu thì lùi về hồi.
function beginner(seconds: number) {
  let m = newMatch()
  let retreat = false
  for (let i = 0; i < seconds * 30 && !m.result; i++) {
    const h = m.hero
    const max = MOBA.hero.hp + MOBA.hero.hpPerLevel * (h.level - 1)
    if (h.hp < max * 0.35) retreat = true
    if (h.hp > max * 0.9) retreat = false
    m = stepMatch(m, 1 / 30, { move: retreat ? -1 : 1, attack: true, skill1: !retreat, skill2: !retreat, ult: !retreat }).match
  }
  return m
}

test('a beginner who just pushes and attacks wins within a few minutes, but not instantly', () => {
  const m = beginner(240)
  expect(m.result).toBe('win')
  expect(m.time).toBeGreaterThan(40)
  expect(m.time).toBeLessThan(180)
})
