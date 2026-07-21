import type { GameState, Vehicle } from './types'

/** 차량이 점유하는 셀들을 (row, col) 목록으로 반환 */
export function cellsOf(v: Vehicle): Array<[row: number, col: number]> {
  const cells: Array<[number, number]> = []
  for (let i = 0; i < v.length; i++) {
    const row = v.orientation === 'V' ? v.row + i : v.row
    const col = v.orientation === 'H' ? v.col + i : v.col
    cells.push([row, col])
  }
  return cells
}

function cellKey(row: number, col: number, cols: number): number {
  return row * cols + col
}

/** 특정 차량(excludeId)을 제외한 나머지 차량들이 점유한 셀 집합 */
export function occupancySet(state: GameState, excludeId?: string): Set<number> {
  const occ = new Set<number>()
  const { cols } = state.board
  for (const v of state.vehicles) {
    if (v.id === excludeId) continue
    for (const [row, col] of cellsOf(v)) {
      occ.add(cellKey(row, col, cols))
    }
  }
  return occ
}

export interface ValidationResult {
  ok: boolean
  error?: string
}

/**
 * 퍼즐 로드 시 1회 실행하는 정적 검증.
 * - 겹침 없음 / 보드 경계 안 / 목표 차량 정확히 1대 / 목표 차량이 출구 축에 정렬됨
 * - 로드 즉시 승리(이미 풀린 상태로 시작) 거부 — critic 엣지케이스 대응
 */
export function validatePlacement(state: GameState): ValidationResult {
  const { rows, cols, exitRow, exitCol, exitSide } = state.board
  const seen = new Set<number>()
  let target: Vehicle | undefined

  for (const v of state.vehicles) {
    if (v.isTarget) {
      if (target) return { ok: false, error: `multiple targets: ${target.id}, ${v.id}` }
      target = v
    }
    for (const [row, col] of cellsOf(v)) {
      if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return { ok: false, error: `out of bounds: ${v.id}` }
      }
      const key = cellKey(row, col, cols)
      if (seen.has(key)) return { ok: false, error: `overlap at vehicle ${v.id}` }
      seen.add(key)
    }
  }

  if (!target) return { ok: false, error: 'no target vehicle' }

  const isHorizontalExit = exitSide === 'right' || exitSide === 'left'
  if (isHorizontalExit) {
    if (target.orientation !== 'H' || target.row !== exitRow) {
      return { ok: false, error: 'target vehicle not aligned with horizontal exit' }
    }
  } else {
    if (target.orientation !== 'V' || target.col !== exitCol) {
      return { ok: false, error: 'target vehicle not aligned with vertical exit' }
    }
  }

  return { ok: true }
}
