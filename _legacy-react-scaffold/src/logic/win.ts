import type { GameState } from './types'

/**
 * 승리 조건 — "엄격판" 채택 (critic 검증에서 지적된 exit 슬라이드 카운트 불일치 해소).
 * 목표 차량의 전방 끝이 보드 경계(마지막 유효 칸)에 도달하면 승리로 판정한다.
 * 이 이동은 일반 슬라이드와 동일하게 maxSlide/applyMove로 처리되며 별도로 카운트를 빼거나
 * 더하지 않는다 — solver의 minMoves와 실제 플레이어의 moveCount가 항상 일치한다.
 */
export function isSolved(state: GameState): boolean {
  const target = state.vehicles.find((v) => v.isTarget)
  if (!target) return false
  const { rows, cols, exitRow, exitCol, exitSide } = state.board

  switch (exitSide) {
    case 'right': {
      if (target.orientation !== 'H' || target.row !== exitRow) return false
      const front = target.col + target.length - 1
      return front === cols - 1
    }
    case 'left': {
      if (target.orientation !== 'H' || target.row !== exitRow) return false
      return target.col === 0
    }
    case 'bottom': {
      if (target.orientation !== 'V' || target.col !== exitCol) return false
      const front = target.row + target.length - 1
      return front === rows - 1
    }
    case 'top': {
      if (target.orientation !== 'V' || target.col !== exitCol) return false
      return target.row === 0
    }
  }
}
