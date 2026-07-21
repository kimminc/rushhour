import { describe, it, expect } from 'vitest'
import { solve } from './solver.js'
import { replaySolution } from './moves.js'
import { isSolved } from './win.js'

describe('solve (BFS 최소 이동수)', () => {
  it('막힌 퍼즐의 최소 이동수를 정확히 계산하고, 해법을 재생하면 실제로 풀린다', () => {
    const puzzle = {
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

    const finalState = replaySolution(puzzle, result.solution)
    expect(isSolved(finalState)).toBe(true)
  })

  it('이미 풀린 상태는 0수로 판정한다', () => {
    const puzzle = {
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
    const puzzle = {
      board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
      vehicles: [
        { id: 'X', row: 2, col: 3, length: 2, orientation: 'H', isTarget: true },
        { id: 'A', row: 0, col: 5, length: 3, orientation: 'V', isTarget: false },
        { id: 'B', row: 3, col: 5, length: 3, orientation: 'V', isTarget: false },
      ],
      status: 'IDLE',
      moveCount: 0,
    }
    const result = solve(puzzle)
    expect(result.solvable).toBe(false)
    expect(result.minMoves).toBeNull()
  })
})
