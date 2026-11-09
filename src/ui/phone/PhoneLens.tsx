import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { PerspectiveCamera } from 'three'
import { CHARACTER_HEIGHT } from '../../room/layout'
import { useRide } from '../../ride/store'
import { shutter } from '../../sfx'
import { player } from '../../story/interact'
import { useStory } from '../../story/store'
import { lensPose, type Subject } from './lens'
import { usePhone } from './phoneStore'

// Đầu người lái khi ngồi trên xe (m).
const RIDER_HEAD = 1.62

function subject(): Subject {
  const s = useStory.getState().s
  if (s.phase === 'street') {
    const b = useRide.getState().bike
    return { x: b.x, z: b.z, facing: b.heading, head: RIDER_HEAD, pair: s.stage === 'withEm' }
  }
  return { x: player.x, z: player.z, facing: player.facing, head: CHARACTER_HEIGHT * 0.93 }
}

// Kính ngắm của app Camera: vẽ khung hình chính như thường, rồi vẽ thêm cảnh camera điện thoại nhìn thấy
// vào đúng ô kính ngắm (phần màn hình điện thoại trong suốt). Chụp = cắt đúng ô đó ra ảnh.
function LensRender() {
  const lensCam = useMemo(() => new PerspectiveCamera(62, 1, 0.05, 260), [])
  useFrame(({ gl, scene, camera, size }) => {
    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
    gl.render(scene, camera)
    const el = document.querySelector('.viewfinder')
    if (!el) return
    const c = gl.domElement.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const x = r.left - c.left
    const y = r.top - c.top
    if (r.width < 4 || r.height < 4) return
    const phone = usePhone.getState()
    const pose = lensPose(phone.lens, subject(), phone.aim)
    lensCam.fov = pose.fov
    lensCam.aspect = r.width / r.height
    lensCam.far = (camera as PerspectiveCamera).far
    lensCam.updateProjectionMatrix()
    lensCam.position.set(...pose.pos)
    lensCam.lookAt(...pose.look)
    const vy = size.height - y - r.height
    gl.setScissorTest(true)
    gl.setViewport(x, vy, r.width, r.height)
    gl.setScissor(x, vy, r.width, r.height)
    gl.render(scene, lensCam)
    gl.setScissorTest(false)
    gl.setViewport(0, 0, size.width, size.height)
    if (!phone.shoot) return
    // Đọc ảnh ngay trong khung vừa vẽ (chưa bị xoá), cắt đúng ô kính ngắm.
    const dpr = gl.getPixelRatio()
    const out = document.createElement('canvas')
    out.width = Math.round(r.width * dpr)
    out.height = Math.round(r.height * dpr)
    out.getContext('2d')?.drawImage(gl.domElement, x * dpr, y * dpr, out.width, out.height, 0, 0, out.width, out.height)
    usePhone.setState({ photo: out.toDataURL('image/jpeg', 0.9), shoot: false })
    shutter()
  }, 1)
  return null
}

// Chỉ giành quyền vẽ khi đang mở app Camera; còn lại để R3F tự vẽ như thường.
export function PhoneLens() {
  const open = useStory((st) => st.s.overlay === 'phone')
  const camera = usePhone((p) => p.app === 'camera')
  return open && camera ? <LensRender /> : null
}
