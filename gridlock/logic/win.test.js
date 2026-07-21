import { describe, it, expect } from 'vitest'
import { isSolved } from './win.js'
import { applyMove } from './moves.js'

describe('isSolved (엄격판 — 목표 차량이 경계 마지막 칸에 도달)', () => {
  it('오른쪽 출구: 전방이 마지막 열에 닿아야 승리', () => {
    const s = {
      board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'X', row: 2, col: 3, length: 2, orientation: 'H', isTarget: true }],
      status: 'IDLE',
      moveCount: 0,
    }
    expect(isSolved(s)).toBe(false)
    const moved = applyMove(s, 'X', 1, 1)
    expect(isSolved(moved)).toBe(true)
  })

  it('로드 즉시 이미 풀린 상태는 감지되어야 한다', () => {
    const s = {
      board: { rows: 6, cols: 6, exitRow: 0, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'X', row: 0, col: 4, length: 2, orientation: 'H', isTarget: true }],
      status: 'IDLE',
      moveCount: 0,
    }
    expect(isSolved(s)).toBe(true)
  })

  it('방향/정렬이 다르면 승리로 판정하지 않는다', () => {
    const s = {
      board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'X', row: 1, col: 4, length: 2, orientation: 'H', isTarget: true }],
      status: 'IDLE',
      moveCount: 0,
    }
    expect(isSolved(s)).toBe(false)
  })

  it('세로 출구(bottom)도 동일 규칙으로 동작한다', () => {
    const s = {
      board: { rows: 6, cols: 6, exitRow: 0, exitCol: 2, exitSide: 'bottom' },
      vehicles: [{ id: 'X', row: 3, col: 2, length: 2, orientation: 'V', isTarget: true }],
      status: 'IDLE',
      moveCount: 0,
    }
    expect(isSolved(s)).toBe(false)
    const moved = applyMove(s, 'X', 1, 1)
    expect(isSolved(moved)).toBe(true)
  })
})
