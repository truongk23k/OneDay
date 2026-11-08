// Thêm ?debug vào link để bật bảng đo hiệu năng.
export function isDebug(search: string): boolean {
  return new URLSearchParams(search).has('debug')
}

// Số khung hình trong 1 giây gần nhất.
export class FpsMeter {
  private times: number[] = []

  tick(nowMs: number): number {
    this.times.push(nowMs)
    while (this.times.length && this.times[0] <= nowMs - 1000) this.times.shift()
    return this.times.length
  }
}
