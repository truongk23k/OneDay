// Giờ trong game tính bằng phút kể từ nửa đêm. 7:30 = 450.
export const GAME_START = 450
// Số giây trong game trôi qua cho mỗi giây thật: 60 phút game ≈ 7 phút thật.
export const SPEED = 8.5

export function advance(minutes: number, realDt: number, speed = SPEED): number {
  return minutes + (realDt * speed) / 60
}

// Ngoài đường đồng hồ chạy nhanh hơn để quãng đường ngắn vẫn tốn đủ phút (có thể chỉnh).
export const STREET_SPEED = 18

export function format(minutes: number): string {
  const m = Math.floor(minutes)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}
