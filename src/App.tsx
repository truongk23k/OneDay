import { Canvas } from '@react-three/fiber'
import { S } from './strings'

export default function App() {
  return (
    <>
      <Canvas camera={{ position: [3, 4, 6], fov: 60 }}>
        <hemisphereLight args={['#ffffff', '#666666', 2]} />
        <mesh rotation-x={-Math.PI / 2}>
          <planeGeometry args={[4.2, 5]} />
          <meshStandardMaterial color="#9a9a9a" />
        </mesh>
      </Canvas>
      <div className="title">{S.title}</div>
    </>
  )
}
