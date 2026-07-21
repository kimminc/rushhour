import { describe, it, expect } from 'vitest'
import type { GameState } from './types'
import { maxSlide, canMove, applyMove, serializeMove, parseMove, replaySolution } from './moves'

function makeState(): GameState {
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
    // W는 (0,0)-(0,1)에 위치, 왼쪽으로는 이미 경계
    expect(maxSlide(s, 'W', -1)).toBe(0)
    expect(canMove(s, 'W', -1, 1)).toBe(false)
  })

  it('인접 차량에 막히면 그 앞까지만 이동 가능하다', () => {
    const s = makeState()
    // X(row2, col1-2, front=col2)가 오른쪽으로 이동하면 B(row2-3, col4)에 막힌다.
    // steps=1 → front=3(비어있음, 통과) / steps=2 → front=4(B가 점유) → 충돌이므로 steps=1까지만 가능
    expect(maxSlide(s, 'X', 1)).toBe(1)
    expect(canMove(s, 'X', 1, 1)).toBe(true)
    expect(canMove(s, 'X', 1, 2)).toBe(false)
  })

  it('사이 빈칸만큼 정확히 카운트한다', () => {
    const s = makeState()
    // X 왼쪽으로는 col0까지 1칸 이동 가능
    expect(maxSlide(s, 'X', -1)).toBe(1)
  })

  it('steps=0 이동은 거부한다', () => {
    const s = makeState()
    expect(canMove(s, 'X', 1, 0)).toBe(false)
  })

  it('경로 중간 장애물을 끝점만 보지 않고 감지한다 (swept path)', () => {
    const s = makeState()
    // endpoint(steps=2, col=3)만 보면 셀이 비어 보일 수 있으나, 경로 중간(steps=1 시점의 진입 셀,
    // 즉 front=4=col4)에서 B와 충돌하므로 실제로는 통과할 수 없다
    expect(canMove(s, 'X', 1, 2)).toBe(false)
  })

  it('세로(V) 방향 이동도 동일하게 동작한다', () => {
    const s = makeState()
    // B(row2-3,col4) 아래로 이동: 경계까지(row5) 최대 2칸
    expect(maxSlide(s, 'B', 1)).toBe(2)
    // 위로 이동: row0까지 최대 2칸
    expect(maxSlide(s, 'B', -1)).toBe(2)
  })

  it('자기 자신의 셀은 충돌 대상에서 제외한다', () => {
    const s = makeState()
    // X가 제자리에서 조금이라도 움직일 수 있어야 한다 (자기 자신과 충돌 판정되면 0이 됨)
    expect(maxSlide(s, 'X', 1)).toBeGreaterThan(0)
  })

  it('트럭(길이 3) 이동도 지원한다', () => {
    const s: GameState = {
      board: { rows: 6, cols: 6, exitRow: 0, exitCol: 0, exitSide: 'right' },
      vehicles: [{ id: 'T', row: 3, col: 0, length: 3, orientation: 'H', isTarget: false }],
      status: 'IDLE',
      moveCount: 0,
    }
    // 길이 3 트럭이 col0-2 차지, 오른쪽 경계(col5)까지 최대 3칸
    expect(maxSlide(s, 'T', 1)).toBe(3)
  })
})

describe('applyMove', () => {
  it('유효한 이동을 적용하고 moveCount를 증가시킨다', () => {
    const s = makeState()
    const next = applyMove(s, 'X', 1, 1)
    const x = next.vehicles.find((v) => v.id === 'X')!
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
    const cases: Array<[string, 1 | -1, number]> = [
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
    expect(afterPlus.vehicles.find((v) => v.id === 'X')!.col).toBe(2)
    expect(afterMinus.vehicles.find((v) => v.id === 'X')!.col).toBe(0)
  })
})
