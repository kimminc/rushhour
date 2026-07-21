/**
 * @typedef {'H'|'V'} Orientation
 * @typedef {'right'|'left'|'top'|'bottom'} ExitSide
 * @typedef {'IDLE'|'ANIMATING'|'SOLVED'} GameStatus
 * @typedef {{id:string,row:number,col:number,length:2|3,orientation:Orientation,isTarget:boolean,modelKey?:string}} Vehicle
 * @typedef {{rows:number,cols:number,exitRow:number,exitCol:number,exitSide:ExitSide}} Board
 * @typedef {{board:Board,vehicles:Vehicle[],status:GameStatus,moveCount:number}} GameState
 */

/** 차량이 점유하는 셀들을 [row, col] 목록으로 반환 */
export function cellsOf(v) {
  const cells = []
  for (let i = 0; i < v.length; i++) {
    const row = v.orientation === 'V' ? v.row + i : v.row
    const col = v.orientation === 'H' ? v.col + i : v.col
    cells.push([row, col])
  }
  return cells
}

function cellKey(row, col, cols) {
  return row * cols + col
}

/** 특정 차량(excludeId)을 제외한 나머지 차량들이 점유한 셀 집합 */
export function occupancySet(state, excludeId) {
  const occ = new Set()
  const { cols } = state.board
  for (const v of state.vehicles) {
    if (v.id === excludeId) continue
    for (const [row, col] of cellsOf(v)) {
      occ.add(cellKey(row, col, cols))
    }
  }
  return occ
}

/**
 * 퍼즐 로드 시 1회 실행하는 정적 검증.
 * - 겹침 없음 / 보드 경계 안 / 목표 차량 정확히 1대 / 목표 차량이 출구 축에 정렬됨
 * - 로드 즉시 승리(이미 풀린 상태로 시작) 거부 — critic 엣지케이스 대응
 * @returns {{ok:boolean,error?:string}}
 */
export function validatePlacement(state) {
  const { rows, cols, exitRow, exitCol, exitSide } = state.board
  const seen = new Set()
  let target

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
