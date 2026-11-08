import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { isDebug } from './debug'
import { DPR_CAP, hasWebGL2, isTouchDevice, pickQuality } from './device'
import { Player } from './player/Player'
import { Room } from './room/Room'
import { StoryTicker } from './story/StoryTicker'
import { S } from './strings'
import { DebugOverlay, DebugProbe } from './ui/DebugOverlay'
import { HelpPanel } from './ui/HelpPanel'
import { RotatePrompt } from './ui/RotatePrompt'
import { TouchControls } from './ui/TouchControls'

type NavigatorInfo = Navigator & { deviceMemory?: number }

function detect() {
  const isTouch = isTouchDevice()
  const nav = navigator as NavigatorInfo
  return {
    isTouch,
    quality: pickQuality({ isTouch, memoryGB: nav.deviceMemory, cores: nav.hardwareConcurrency }),
    webgl: hasWebGL2(),
    debug: isDebug(window.location.search),
  }
}

export default function App() {
  const [{ isTouch, quality, webgl, debug }] = useState(detect)

  if (!webgl) return <div className="no-webgl">{S.noWebGL}</div>

  return (
    <>
      <Canvas dpr={[1, DPR_CAP[quality]]} camera={{ fov: 70, near: 0.05, far: 50 }}>
        <hemisphereLight args={['#ffffff', '#8a8a8a', 1.6]} />
        <directionalLight position={[3, 6, 4]} intensity={1.2} />
        <Room />
        <Player />
        <StoryTicker />
        {debug && <DebugProbe />}
      </Canvas>
      {isTouch && <TouchControls />}
      <div className="title">{S.title}</div>
      {debug && <DebugOverlay quality={quality} />}
      <HelpPanel isTouch={isTouch} />
      <RotatePrompt />
    </>
  )
}
