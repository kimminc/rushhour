import { describe, it, expect } from 'vitest'
import { maxSlide, canMove, applyMove, serializeMove, parseMove, replaySolution } from './moves.js'

function makeState() {
  return {
    board: { rows: 6, cols: 6, exitRow: 2, exitCol: 0, exitSide: 'right' },
    vehicles: [
      { id: 'X', row: 2, col: 1, length: 2, orientation: 'H', isTarget: true },
      { id: 'B', row: 2, col: 4, length: 2, orientation: 'V', isTarget: false },
      { id: 'W', row: 0, col: 0, length: 2, orientation: 'H', isTarget: false },
    ],
    status: 'IDLE',
    moveCount: 0,
  }
}

describe('maxSlide / canMove', () => {
  it('경계 밖 이동을 거부한다', () => {
    const s = makeState()
    expect(maxSlide(s, 'W', -1)).toBe(0)
    expect(canMove(s, 'W', -1, 1)).toBe(false)
  })

  it('인접 차량에 막히면 그 앞까지만 이동 가능하다', () => {
    const s = makeState()
    expect(maxSlide(s, 'X', 1)).toBe(1)
    expect(canMove(s, 'X', 1, 1)).toBe(true)
    expect(canMove(s, 'X', 1, 2)).toBe(false)
  })

  it('사이 빈칸만큼 정확히 카운트한다', () => {
    const s = makeState()
    expect(maxSlide(s, 'X', -1)).toBe(1)
  })

  it('steps=0 이동은 거부한다', () => {
    const s = makeState()
    expect(canMove(s, 'X', 1, 0)).toBe(false)
  })

  it('경로 중간 장애물을 끝점만 보지 않고 감지한다 (swept path)', () => {
    const s = makeState()
    expect(canMove(s, 'X', 1, 2)).toBe(false)
  })

  it('세로(V) 방향 이동도 동일하게 동작한다', () => {
    const s = makeState()
    expect(maxSlide(s, 'B', 1)).toBe(2)
    expect(maxSlide(s, 'B', -1)).toBe(2)
  })

  it('자기 자신의 셀은 충돌 대상에서 제외한다', () => {
    const s = makeState()
    expect(maxSlide(s, 'X', 1)).toBeGreaterThan(0)
  })

  it('트럭(길이 3) 이동도 지원한다', () => {
    const s = {
      board: { rows: 6, cols: 6, exitRow: 0, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'T', row: 3, col: 0, length: 3, orientation: 'H', isTarget: false }],
      status: 'IDLE',
      moveCount: 0,
    }
    expect(maxSlide(s, 'T', 1)).toBe(3)
  })
})

describe('applyMove', () => {
  it('유효한 이동을 적용하고 moveCount를 증가시킨다', () => {
    const s = makeState()
    const next = applyMove(s, 'X', 1, 1)
    const x = next.vehicles.find((v) => v.id === 'X')
    expect(x.col).toBe(2)
    expect(next.moveCount).toBe(1)
  })

  it('불가능한 이동은 원래 상태를 그대로 반환한다', () => {
    const s = makeState()
    const next = applyMove(s, 'X', 1, 10)
    expect(next).toBe(s)
  })
})

describe('serializeMove / parseMove 라운드트립', () => {
  it('직렬화-역직렬화가 원본과 일치한다', () => {
    const cases = [
      ['X', 1, 4],
      ['T1', -1, 2],
      ['abc', 1, 12],
    ]
    for (const [id, dir, steps] of cases) {
      const token = serializeMove(id, dir, steps)
      const parsed = parseMove(token)
      expect(parsed).toEqual({ vehicleId: id, dir, steps })
    }
  })

  it('+ 는 좌표 증가 방향(가로=오른쪽), - 는 감소 방향(가로=왼쪽)이다', () => {
    const s = makeState()
    const afterPlus = replaySolution(s, ['X+1'])
    const afterMinus = replaySolution(s, ['X-1'])
    expect(afterPlus.vehicles.find((v) => v.id === 'X').col).toBe(2)
    expect(afterMinus.vehicles.find((v) => v.id === 'X').col).toBe(0)
  })
})
