import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { FpsMeter } from '../debug'
import { DPR_CAP, type Quality } from '../device'
import { useGame } from '../store'

// Đặt trong <Canvas>: đo FPS, số lệnh vẽ, số tam giác và gửi lên store 4 lần mỗi giây.
export function DebugProbe() {
  const meter = useRef(new FpsMeter())
  const lastPush = useRef(0)
  useFrame(({ gl }) => {
    const now = performance.now()
    const fps = meter.current.tick(now)
    if (now - lastPush.current < 250) return
    lastPush.current = now
    useGame.getState().setDebugStats({ fps, calls: gl.info.render.calls, triangles: gl.info.render.triangles })
  })
  return null
}

export function DebugOverlay({ quality }: { quality: Quality }) {
  const s = useGame((st) => st.debugStats)
  const dpr = Math.min(window.devicePixelRatio, DPR_CAP[quality])
  return (
    <div className="debug-overlay">
      <div>FPS {s.fps}</div>
      <div>Lệnh vẽ {s.calls}</div>
      <div>Tam giác {s.triangles.toLocaleString('vi-VN')}</div>
      <div>
        DPR {dpr.toFixed(2)} · {quality}
      </div>
    </div>
  )
}
