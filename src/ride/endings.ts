import type { StoryState } from '../story/state'

export type EndingId = 'overslept' | 'late' | 'emUpset' | 'noBrush' | 'perfect' | 'ok'
export type Ending = { id: EndingId; also: EndingId[]; emText?: string }

const ANH_DEADLINE = 510
const UPSET_MOOD = 40
const HAPPY_MOOD = 70

// Kết thúc theo thứ tự ưu tiên của kịch bản: ngủ quên → trễ giờ → Em giận → quên đánh răng → hoàn hảo.
export function pickEnding(s: StoryState): Ending {
  if (s.phase === 'overslept') return { id: 'overslept', also: [] }
  const hits: EndingId[] = []
  if (s.minutes > ANH_DEADLINE) hits.push('late')
  if (s.mood < UPSET_MOOD || s.emDropLate) hits.push('emUpset')
  if (!s.tasks.brushed) hits.push('noBrush')
  const t = s.tasks
  const allDone = t.brushed && t.washed && t.dressed && t.texted && t.keys && t.helmets === 2
  if (!hits.length) hits.push(allDone && s.mood >= HAPPY_MOOD ? 'perfect' : 'ok')
  const [id, ...also] = hits
  return { id, also, emText: hits.includes('emUpset') ? 'Mai em tự đi làm ko cần đón' : undefined }
}
