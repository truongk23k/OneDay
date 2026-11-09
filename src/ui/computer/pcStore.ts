import { create } from 'zustand'
import { useStory } from '../../story/store'

// Máy tính của Anh: biểu tượng trên màn hình, cửa sổ Chrome (Face bút, Tin tức, Mail là trang web) và Mes.
export type PcApp = 'chrome' | 'face' | 'mes' | 'news' | 'mail'
export type PcWin = 'chrome' | 'mes'
export type Site = 'home' | 'search' | 'face' | 'news' | 'mail'
export type Page = { site: Site; q: string }

const HOME: Page = { site: 'home', q: '' }

type Pc = {
  // Cửa sổ đang ở trên cùng (null = đang nhìn màn hình nền).
  win: PcWin | null
  running: PcWin[]
  page: Page
  history: Page[]
  startOpen: boolean
  launch: (app: PcApp) => void
  browse: (site: Site, q?: string) => void
  back: () => void
  focus: (w: PcWin) => void
  minimize: () => void
  closeWin: () => void
  toggleStart: () => void
  reset: () => void
}

const withWin = (running: PcWin[], w: PcWin) => (running.includes(w) ? running : [...running, w])
const same = (a: Page, b: Page) => a.site === b.site && a.q === b.q

export const usePc = create<Pc>()((set, get) => ({
  win: null,
  running: [],
  page: HOME,
  history: [],
  startOpen: false,
  launch: (app) => {
    const s = get()
    if (app === 'mes') {
      set({ win: 'mes', running: withWin(s.running, 'mes'), startOpen: false })
      return
    }
    // Chrome chưa bật: mở thẳng trang cần mở. Đang bật: sang trang đó, nút quay lại về trang trước.
    if (!s.running.includes('chrome')) {
      const page: Page = app === 'chrome' ? HOME : { site: app, q: '' }
      set({ win: 'chrome', running: [...s.running, 'chrome'], startOpen: false, page, history: [] })
      return
    }
    set({ win: 'chrome', startOpen: false })
    if (app !== 'chrome') get().browse(app)
  },
  browse: (site, q = '') => {
    const { page, history } = get()
    const next = { site, q }
    if (!same(page, next)) set({ page: next, history: [...history, page] })
  },
  back: () => {
    const { history } = get()
    if (!history.length) return
    set({ page: history[history.length - 1], history: history.slice(0, -1) })
  },
  focus: (w) => {
    const s = get()
    if (s.win === w) set({ win: null, startOpen: false })
    else if (s.running.includes(w)) set({ win: w, startOpen: false })
    else s.launch(w)
  },
  minimize: () => set({ win: null }),
  closeWin: () => {
    const { win, running } = get()
    if (!win) return
    set({ win: null, running: running.filter((r) => r !== win), ...(win === 'chrome' ? { page: HOME, history: [] } : {}) })
  },
  toggleStart: () => set({ startOpen: !get().startOpen }),
  reset: () => set({ win: null, running: [], page: HOME, history: [], startOpen: false }),
}))

// Tắt màn hình thì menu Bắt đầu đóng lại; sáng mới (chơi lại) thì máy tính như mới bật.
useStory.subscribe((st, prev) => {
  if (st.s.seed !== prev.s.seed) usePc.getState().reset()
  else if (prev.s.overlay === 'computer' && st.s.overlay !== 'computer') usePc.setState({ startOpen: false })
})
