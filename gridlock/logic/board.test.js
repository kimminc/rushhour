import { describe, it, expect } from 'vitest'
import { validatePlacement } from './board.js'

function baseState() {
  return {
    board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
    vehicles: [{ id: 'X', row: 2, col: 1, length: 2, orientation: 'H', isTarget: true }],
    status: 'IDLE',
    moveCount: 0,
  }
}

describe('validatePlacement', () => {
  it('정상 배치는 통과한다', () => {
    expect(validatePlacement(baseState()).ok).toBe(true)
  })

  it('목표 차량이 없으면 거부한다', () => {
    const s = baseState()
    s.vehicles[0].isTarget = false
    expect(validatePlacement(s).ok).toBe(false)
  })

  it('목표 차량이 2대면 거부한다 (critic 엣지케이스)', () => {
    const s = baseState()
    s.vehicles.push({ id: 'Y', row: 3, col: 1, length: 2, orientation: 'H', isTarget: true })
    expect(validatePlacement(s).ok).toBe(false)
  })

  it('목표 차량이 출구 축에 정렬되지 않으면 거부한다', () => {
    const s = baseState()
    s.vehicles[0].row = 3 // exitRow=2와 불일치
    expect(validatePlacement(s).ok).toBe(false)
  })

  it('차량이 경계 밖에 있으면 거부한다', () => {
    const s = baseState()
    s.vehicles[0].col = 5 // length 2 → col5,col6, col6은 경계 밖
    expect(validatePlacement(s).ok).toBe(false)
  })

  it('차량이 겹치면 거부한다', () => {
    const s = baseState()
    s.vehicles.push({ id: 'Z', row: 2, col: 2, length: 2, orientation: 'H', isTarget: false })
    expect(validatePlacement(s).ok).toBe(false)
  })
})
