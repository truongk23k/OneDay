import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { isDebug } from './debug'
import { DPR_CAP, hasWebGL2, isTouchDevice, pickQuality } from './device'
import { Player } from './player/Player'
import { Room } from './room/Room'
import { WardrobeScene } from './room/WardrobeScene'
import { StoryTicker } from './story/StoryTicker'
import { useStory } from './story/store'
import { S } from './strings'
import { AlarmScreen } from './ui/AlarmScreen'
import { BrushGame } from './ui/BrushGame'
import { DebugOverlay, DebugProbe } from './ui/DebugOverlay'
import { EndCard } from './ui/EndCard'
import { HelpPanel } from './ui/HelpPanel'
import { Hud } from './ui/Hud'
import { Phone } from './ui/Phone'
import { RotatePrompt } from './ui/RotatePrompt'
import { TouchControls } from './ui/TouchControls'
import { Wardrobe } from './ui/Wardrobe'
import { WashGame } from './ui/WashGame'

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
  // Chỉ khi có ?debug: mở store ra console để thử nhanh từng màn.
  if (debug) (window as unknown as { __story: typeof useStory }).__story = useStory

  if (!webgl) return <div className="no-webgl">{S.noWebGL}</div>

  return (
    <>
      <Canvas dpr={[1, DPR_CAP[quality]]} camera={{ fov: 70, near: 0.05, far: 50 }}>
        <hemisphereLight args={['#fffaf2', '#9a9184', 1.25]} />
        <directionalLight position={[-2, 5, 3]} intensity={0.9} color="#fff6e8" />
        <Room showLabels={debug} quality={quality} />
        <Player />
        <WardrobeScene />
        <StoryTicker />
        {debug && <DebugProbe />}
      </Canvas>
      {isTouch && <TouchControls />}
      <div className="title">{S.title}</div>
      {debug && <DebugOverlay quality={quality} />}
      <Hud isTouch={isTouch} />
      <AlarmScreen />
      <BrushGame isTouch={isTouch} />
      <WashGame />
      <Wardrobe />
      <Phone />
      <EndCard />
      <HelpPanel isTouch={isTouch} />
      <RotatePrompt />
    </>
  )
}
