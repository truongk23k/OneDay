import { Canvas } from '@react-three/fiber'
import { Room } from './room/Room'
import { S } from './strings'

export default function App() {
  return (
    <>
      <Canvas
        camera={{ position: [2.1, 7, 8], fov: 50 }}
        onCreated={({ camera }) => camera.lookAt(2.1, 0, 2.5)}
      >
        <hemisphereLight args={['#ffffff', '#8a8a8a', 1.6]} />
        <directionalLight position={[3, 6, 4]} intensity={1.2} />
        <Room />
      </Canvas>
      <div className="title">{S.title}</div>
    </>
  )
}
