import { MOBA, newMatch, stepMatch, type Match } from './moba'

const idle = { attack: false, skill: false, back: false }
const run = (m: Match, seconds: number, input = idle) => {
  for (let i = 0; i < seconds * 30; i++) m = stepMatch(m, 1 / 30, input)
  return m
}

test('a match starts at our tower with full health and no result', () => {
  const m = newMatch()
  expect(m.hero.x).toBeLessThan(0.2)
  expect(m.hero.hp).toBe(MOBA.heroHp)
  expect(m.enemyTower).toBe(MOBA.towerHp)
  expect(m.result).toBeNull()
})

test('the hero walks up the lane by himself while nothing is in the way', () => {
  const m = run({ ...newMatch(), spawnIn: 99 }, 1)
  expect(m.hero.x).toBeGreaterThan(newMatch().hero.x + 0.05)
})

test('enemy minions come down the lane and stop the hero', () => {
  const m = run(newMatch(), 6)
  expect(m.minions.length).toBeGreaterThan(0)
  const ahead = Math.min(...m.minions.map((n) => n.x))
  expect(m.hero.x).toBeLessThan(ahead)
})

test('attacking hurts the nearest minion in range; the skill hits every minion in range, then cools down', () => {
  const base: Match = { ...newMatch(), spawnIn: 99, hero: { ...newMatch().hero, x: 0.4 }, minions: [{ x: 0.45, hp: 40 }, { x: 0.47, hp: 40 }] }
  const hit = stepMatch(base, 1 / 30, { ...idle, attack: true })
  expect(hit.minions.map((n) => n.hp)).toEqual([40 - MOBA.attack, 40])
  const blast = stepMatch(base, 1 / 30, { ...idle, skill: true })
  expect(blast.minions.every((n) => n.hp === 40 - MOBA.skill)).toBe(true)
  expect(blast.skillReady).toBeGreaterThan(0)
  const again = stepMatch(blast, 1 / 30, { ...idle, skill: true })
  expect(again.minions.every((n) => n.hp === 40 - MOBA.skill)).toBe(true)
})

test('dead minions are removed and give gold', () => {
  const base: Match = { ...newMatch(), spawnIn: 99, hero: { ...newMatch().hero, x: 0.4 }, minions: [{ x: 0.45, hp: 5 }] }
  const m = stepMatch(base, 1 / 30, { ...idle, attack: true })
  expect(m.minions).toHaveLength(0)
  expect(m.gold).toBeGreaterThan(0)
})

test('standing under the enemy tower hurts; backing off walks home', () => {
  const near: Match = { ...newMatch(), spawnIn: 99, hero: { ...newMatch().hero, x: MOBA.towerX - 0.05 } }
  expect(run(near, 1).hero.hp).toBeLessThan(MOBA.heroHp)
  expect(run(near, 1, { ...idle, back: true }).hero.x).toBeLessThan(near.hero.x)
})

test('knocking the enemy tower down wins; running out of health loses', () => {
  const win: Match = { ...newMatch(), spawnIn: 99, enemyTower: 3, hero: { ...newMatch().hero, x: MOBA.towerX - 0.05 } }
  expect(stepMatch(win, 1 / 30, { ...idle, attack: true }).result).toBe('win')
  const lose: Match = { ...newMatch(), spawnIn: 99, hero: { ...newMatch().hero, x: MOBA.towerX - 0.05, hp: 1 } }
  expect(run(lose, 1).result).toBe('lose')
})

test('a finished match does not change any more', () => {
  const done: Match = { ...newMatch(), result: 'win' }
  expect(stepMatch(done, 1, { ...idle, attack: true })).toBe(done)
})
