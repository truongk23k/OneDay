import { useEffect } from 'react'
import type { BikeState } from '../ride/bike'
import { ALLEY, BARRIERS, MARKERS, cityBounds } from '../ride/city'
import { ROAD_SEGMENTS, type Pt, type Route } from '../ride/nav'
import { CHECKPOINT } from '../ride/police'
import { targetFor } from '../ride/rules'
import { useGame } from '../store'
import type { Stage } from '../story/state'
import { S } from '../strings'

// Bản đồ khu phố nhìn từ trên xuống, bắc ở trên (toạ độ SVG = toạ độ x/z của phố).
const B = cityBounds()
const PAD = 5
const VIEW = `${B.minX - PAD} ${B.minZ - PAD} ${B.maxX - B.minX + PAD * 2} ${B.maxZ - B.minZ + PAD * 2}`

const PLACES = [
  { id: 'home', at: MARKERS.home, color: '#7bd88f', icon: '🏠' },
  { id: 'emHouse', at: MARKERS.emHouse, color: '#ff6b8b', icon: '❤️' },
  { id: 'emOffice', at: MARKERS.emOffice, color: '#c58cff', icon: '💼' },
  { id: 'anhOffice', at: MARKERS.anhOffice, color: '#5ab0ff', icon: '💻' },
] as const

type MapProps = { bike: Pick<BikeState, 'x' | 'z' | 'heading'>; route: Route | null; stage: Stage; big: boolean; police?: Pt | null }

export function MapSvg({ bike, route, stage, big, police }: MapProps) {
  const target = targetFor(stage)
  const k = big ? 1 : 1.8
  return (
    <svg viewBox={VIEW} className="map-svg" aria-hidden>
      <rect x={B.minX - PAD} y={B.minZ - PAD} width={B.maxX - B.minX + PAD * 2} height={B.maxZ - B.minZ + PAD * 2} fill="#3a404a" />
      {ROAD_SEGMENTS.map(([a, b], i) => {
        const alley = a.x === ALLEY.x && b.x === ALLEY.x
        return (
          <line key={i} x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke={alley ? '#c9b98f' : '#a3a9b2'} strokeWidth={alley ? 3.5 : 8} strokeLinecap="square" />
        )
      })}
      {BARRIERS.map((b) => (
        <rect key={b.id} x={b.minX} y={b.minZ} width={b.maxX - b.minX} height={b.maxZ - b.minZ} fill="#f07b1d" />
      ))}
      {route && (
        <polyline
          points={route.points.map((p) => `${p.x},${p.z}`).join(' ')}
          fill="none"
          stroke="#ffd23f"
          strokeWidth={big ? 3.5 : 5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {PLACES.map((p) => (
        <g key={p.id} transform={`translate(${p.at.x} ${p.at.z})`}>
          {target === p.at && <circle r={9 * k} className="map-target" fill="none" stroke="#ffd23f" strokeWidth={2.5} />}
          <circle r={5 * k} fill={p.color} stroke="#1d1f24" strokeWidth={1.2} />
          {big && (
            <text y={p.at.z < B.minZ + 20 ? 17 : -10} textAnchor="middle" className="map-label">
              {p.icon} {S.ride.map[p.id]}
            </text>
          )}
        </g>
      ))}
      <g transform={`translate(${CHECKPOINT.x + 7} ${CHECKPOINT.z})`} className="map-checkpoint">
        <rect x={-5 * k} y={-5 * k} width={10 * k} height={10 * k} rx={2.5 * k} fill="#1f4fbf" stroke="#fff" strokeWidth={1.2} />
        <rect x={-2.5 * k} y={-1 * k} width={5 * k} height={2 * k} fill="#ffd23f" />
        {big && (
          <text x={9} y={3} className="map-label" textAnchor="start">
            {S.police.checkpoint}
          </text>
        )}
      </g>
      {police && <circle cx={police.x} cy={police.z} r={5 * k} className="map-police" />}
      <g transform={`translate(${bike.x} ${bike.z}) rotate(${(-bike.heading * 180) / Math.PI}) scale(${k})`}>
        <path d="M0,-7 L5,6 L0,3 L-5,6 Z" fill="#ffffff" stroke="#e2574c" strokeWidth={1.6} strokeLinejoin="round" />
      </g>
    </svg>
  )
}

// Bản đồ nhỏ ở góc; chạm (hoặc phím M) để mở bản đồ lớn — lúc đó game tạm dừng.
export function RideMap({ bike, route, stage, police }: { bike: BikeState; route: Route | null; stage: Stage; police?: Pt | null }) {
  const open = useGame((g) => g.mapOpen)
  const setOpen = useGame((g) => g.setMapOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyM' || e.repeat) return
      const g = useGame.getState()
      if (g.helpOpen) return
      g.setMapOpen(!g.mapOpen)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      // Rời phố (về đích, chơi lại) khi đang mở bản đồ thì không được để game kẹt ở trạng thái dừng.
      useGame.getState().setMapOpen(false)
    }
  }, [])

  return (
    <>
      <button className="ride-minimap" aria-label={S.ride.map.title} onClick={() => setOpen(true)}>
        <MapSvg bike={bike} route={route} stage={stage} big={false} police={police} />
      </button>
      {open && (
        <div className="overlay-backdrop" onClick={() => setOpen(false)}>
          <div className="card map-card" role="dialog" aria-label={S.ride.map.title} onClick={(e) => e.stopPropagation()}>
            <h2>{S.ride.map.title}</h2>
            <MapSvg bike={bike} route={route} stage={stage} big={true} police={police} />
            <div className="map-legend">
              <span>
                <i className="swatch route" /> {S.ride.map.route}
              </span>
              <span>
                <i className="swatch works" /> {S.ride.map.roadworks}
              </span>
              <span>
                <i className="swatch alley" /> {S.ride.map.alley}
              </span>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              {S.hud.close}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
