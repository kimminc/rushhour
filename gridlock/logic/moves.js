import { occupancySet } from './board.js'

/**
 * +1 = 좌표 증가 방향 (가로 차량은 오른쪽, 세로 차량은 아래쪽)
 * -1 = 좌표 감소 방향 (가로 차량은 왼쪽, 세로 차량은 위쪽)
 * 이 규약은 팀 검증(critic) 단계에서 지적된 "solution 부호 미정의" 문제를 해소하기 위해 고정한다.
 * @typedef {1|-1} Axis1
 */

/**
 * 지정한 차량이 dir 방향으로 최대 몇 칸까지 슬라이드 가능한지 계산한다.
 * 진행 경로의 모든 셀(swept path)을 한 칸씩 검사한다 — 끝점만 보면
 * 중간 장애물을 놓치는 버그가 생기므로 반드시 누적 검사한다.
 */
export function maxSlide(state, vehicleId, dir) {
  const v = state.vehicles.find((x) => x.id === vehicleId)
  if (!v) return 0
  const { rows, cols } = state.board
  const occ = occupancySet(state, vehicleId)

  let steps = 0
  for (;;) {
    const next = steps + 1
    let row
    let col
    if (v.orientation === 'H') {
      row = v.row
      col = dir > 0 ? v.col + v.length - 1 + next : v.col - next
    } else {
      col = v.col
      row = dir > 0 ? v.row + v.length - 1 + next : v.row - next
    }
    if (row < 0 || row >= rows || col < 0 || col >= cols) break
    if (occ.has(row * cols + col)) break
    steps = next
  }
  return steps
}

export function canMove(state, vehicleId, dir, steps) {
  if (steps < 1) return false
  return steps <= maxSlide(state, vehicleId, dir)
}

/** 이동이 불가능하면 원래 상태를 그대로 반환한다 (오류를 던지지 않음 — 호출부에서 canMove로 먼저 확인). */
export function applyMove(state, vehicleId, dir, steps) {
  if (!canMove(state, vehicleId, dir, steps)) return state
  const vehicles = state.vehicles.map((v) => {
    if (v.id !== vehicleId) return v
    return v.orientation === 'H' ? { ...v, col: v.col + steps * dir } : { ...v, row: v.row + steps * dir }
  })
  return { ...state, vehicles, moveCount: state.moveCount + 1 }
}

/**
 * 이동 표기 규약: `${vehicleId}${+|-}${steps}`  예) "X+3", "T1-2"
 * + 는 좌표 증가 방향(가로=오른쪽, 세로=아래), - 는 좌표 감소 방향(가로=왼쪽, 세로=위).
 */
export function serializeMove(vehicleId, dir, steps) {
  return `${vehicleId}${dir > 0 ? '+' : '-'}${steps}`
}

const MOVE_TOKEN_RE = /^(.+)([+-])(\d+)$/

export function parseMove(token) {
  const match = MOVE_TOKEN_RE.exec(token)
  if (!match) throw new Error(`invalid move token: ${token}`)
  const [, vehicleId, sign, stepsStr] = match
  return { vehicleId, dir: sign === '+' ? 1 : -1, steps: Number(stepsStr) }
}

/** 저장된 해법(문자열 배열)을 순서대로 재생한다. 힌트 재생, solver 검증에 사용. */
export function replaySolution(state, tokens) {
  return tokens.reduce((s, token) => {
    const { vehicleId, dir, steps } = parseMove(token)
    return applyMove(s, vehicleId, dir, steps)
  }, state)
}
