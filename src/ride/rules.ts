import type { Stage } from '../story/state'
import type { BikeState } from './bike'
import { MARKERS, type Marker } from './city'

// Dừng hẳn (dưới 1 m/s) trong vòng 4 m quanh điểm hẹn thì tính là tới nơi.
export const STOP_RADIUS = 4
export const STOP_SPEED = 1

const STOPS: Partial<Record<Stage, { at: Marker; arrival: 'pickup' | 'dropoff' | 'arrive' }>> = {
  toEm: { at: MARKERS.emHouse, arrival: 'pickup' },
  withEm: { at: MARKERS.emOffice, arrival: 'dropoff' },
  sprint: { at: MARKERS.anhOffice, arrival: 'arrive' },
}

export function targetFor(stage: Stage): Marker | null {
  return STOPS[stage]?.at ?? null
}

export function arrivedAt(stage: Stage, bike: BikeState): 'pickup' | 'dropoff' | 'arrive' | null {
  const stop = STOPS[stage]
  if (!stop) return null
  const near = Math.hypot(bike.x - stop.at.x, bike.z - stop.at.z) <= STOP_RADIUS
  return near && Math.abs(bike.speed) < STOP_SPEED ? stop.arrival : null
}
