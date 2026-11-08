import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { isTouchDevice } from './device'
import { Player } from './player/Player'
import { Room } from './room/Room'
import { S } from './strings'
import { HelpPanel } from './ui/HelpPanel'
import { RotatePrompt } from './ui/RotatePrompt'
import { TouchControls } from './ui/TouchControls'

export default function App() {
  const [isTouch] = useState(isTouchDevice)

  return (
    <>
      <Canvas camera={{ fov: 70, near: 0.05, far: 50 }}>
        <hemisphereLight args={['#ffffff', '#8a8a8a', 1.6]} />
        <directionalLight position={[3, 6, 4]} intensity={1.2} />
        <Room />
        <Player />
      </Canvas>
      {isTouch && <TouchControls />}
      <div className="title">{S.title}</div>
      <HelpPanel isTouch={isTouch} />
      <RotatePrompt />
    </>
  )
}
