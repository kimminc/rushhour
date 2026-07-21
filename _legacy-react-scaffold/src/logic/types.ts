/**
 * +1 = 좌표 증가 방향 (가로 차량은 오른쪽, 세로 차량은 아래쪽)
 * -1 = 좌표 감소 방향 (가로 차량은 왼쪽, 세로 차량은 위쪽)
 * 이 규약은 팀 검증(critic) 단계에서 지적된 "solution 부호 미정의" 문제를 해소하기 위해 고정한다.
 */
export type Axis1 = 1 | -1

export type Orientation = 'H' | 'V'
export type ExitSide = 'right' | 'left' | 'top' | 'bottom'
export type GameStatus = 'IDLE' | 'ANIMATING' | 'SOLVED'

export interface Vehicle {
  id: string
  row: number
  col: number
  length: 2 | 3
  orientation: Orientation
  isTarget: boolean
  /** 렌더링 전용 참조 (Kenney 모델/색상 키). 규칙 로직은 이 필드를 절대 사용하지 않는다. */
  modelKey?: string
}

export interface Board {
  rows: number
  cols: number
  /** 가로(H) 출구일 때 목표 차량이 있어야 하는 행 */
  exitRow: number
  /** 세로(V) 출구일 때 목표 차량이 있어야 하는 열 */
  exitCol: number
  exitSide: ExitSide
}

export interface GameState {
  board: Board
  vehicles: Vehicle[]
  status: GameStatus
  moveCount: number
}
