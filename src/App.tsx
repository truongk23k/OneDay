import { Canvas } from '@react-three/fiber'
import { Player } from './player/Player'
import { Room } from './room/Room'
import { S } from './strings'

export default function App() {
  return (
    <>
      <Canvas camera={{ fov: 70, near: 0.05, far: 50 }}>
        <hemisphereLight args={['#ffffff', '#8a8a8a', 1.6]} />
        <directionalLight position={[3, 6, 4]} intensity={1.2} />
        <Room />
        <Player />
      </Canvas>
      <div className="title">{S.title}</div>
    </>
  )
}
