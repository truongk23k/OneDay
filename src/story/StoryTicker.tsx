import { useFrame } from '@react-three/fiber'
import { useStory } from './store'

// Đặt trong <Canvas>: cho đồng hồ trong game chạy theo từng khung hình (giới hạn 0.1 s khi đổi tab).
export function StoryTicker() {
  useFrame((_, dt) => useStory.getState().tick(Math.min(dt, 0.1)))
  return null
}
