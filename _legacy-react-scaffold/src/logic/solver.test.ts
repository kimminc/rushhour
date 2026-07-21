import { describe, it, expect } from 'vitest'
import type { GameState } from './types'
import { solve } from './solver'
import { replaySolution } from './moves'
import { isSolved } from './win'

describe('solve (BFS 최소 이동수)', () => {
  it('막힌 퍼즐의 최소 이동수를 정확히 계산하고, 해법을 재생하면 실제로 풀린다', () => {
    // X(row2,col1-2)가 오른쪽으로 나가려면 B(row2-3,col4)를 먼저 치워야 한다.
    // 이론상 최소 2수: B를 한 방향으로 옮기고(1수) X를 경계까지 슬라이드(1수).
    const puzzle: GameState = {
      board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
      vehicles: [
        { id: 'X', row: 2, col: 1, length: 2, orientation: 'H', isTarget: true },
        { id: 'B', row: 2, col: 4, length: 2, orientation: 'V', isTarget: false },
      ],
      status: 'IDLE',
      moveCount: 0,
    }

    const result = solve(puzzle)

    expect(result.solvable).toBe(true)
    expect(result.minMoves).toBe(2)
    expect(result.solution).toHaveLength(2)

    // 실제 그라운딩: 반환된 해법을 그대로 재생해서 진짜로 풀리는지 실행 확인
    const finalState = replaySolution(puzzle, result.solution)
    expect(isSolved(finalState)).toBe(true)
  })

  it('이미 풀린 상태는 0수로 판정한다', () => {
    const puzzle: GameState = {
      board: { rows: 6, cols: 6, exitRow: 0, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'X', row: 0, col: 4, length: 2, orientation: 'H', isTarget: true }],
      status: 'IDLE',
      moveCount: 0,
    }
    const result = solve(puzzle)
    expect(result.minMoves).toBe(0)
    expect(result.solution).toEqual([])
  })

  it('풀 수 없는 배치는 solvable=false를 반환한다', () => {
    // col5 전체를 길이3 트럭 두 대(A: row0-2, B: row3-5)가 빈틈없이 채워
    // 위아래로 1칸도 움직일 수 없는 벽을 만든다. X는 row2에 고정된 채 좌우로만
    // 움직일 수 있으므로 col5,row2를 영원히 지날 수 없어 절대 못 빠져나간다.
    const puzzle: GameState = {
      board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
      vehicles: [
        { id: 'X', row: 2, col: 3, length: 2, orientation: 'H', isTarget: true }, // col3-4
        { id: 'A', row: 0, col: 5, length: 3, orientation: 'V', isTarget: false }, // col5, row0-2
        { id: 'B', row: 3, col: 5, length: 3, orientation: 'V', isTarget: false }, // col5, row3-5
      ],
      status: 'IDLE',
      moveCount: 0,
    }
    const result = solve(puzzle)
    expect(result.solvable).toBe(false)
    expect(result.minMoves).toBeNull()
  })
})
