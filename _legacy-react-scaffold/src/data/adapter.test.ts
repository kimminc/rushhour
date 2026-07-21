import { describe, it, expect } from 'vitest'
import { schemaToState } from './adapter'
import { seedPuzzles } from './puzzles'
import { validatePlacement } from '../logic/board'
import { solve } from '../logic/solver'
import { replaySolution } from '../logic/moves'
import { isSolved } from '../logic/win'

describe('schemaToState 어댑터', () => {
  it('필드명을 올바르게 변환한다 (x→col, y→row, len→length, dir→orientation, E→right)', () => {
    const state = schemaToState(seedPuzzles[0])
    expect(state.board).toEqual({ rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' })
    const x = state.vehicles.find((v) => v.id === 'X')!
    expect(x).toMatchObject({ row: 2, col: 1, length: 2, orientation: 'H', isTarget: true })
  })

  it('변환된 상태는 정적 검증을 통과한다', () => {
    const state = schemaToState(seedPuzzles[0])
    expect(validatePlacement(state).ok).toBe(true)
  })

  it('전체 파이프라인: 스키마 → 어댑터 → solver → 해법 재생까지 실제로 동작한다', () => {
    const state = schemaToState(seedPuzzles[0])
    const result = solve(state)
    expect(result.solvable).toBe(true)
    expect(result.minMoves).not.toBeNull()

    const finalState = replaySolution(state, result.solution)
    expect(isSolved(finalState)).toBe(true)
  })
})
