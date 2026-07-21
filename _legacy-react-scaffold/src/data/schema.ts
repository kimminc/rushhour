/**
 * 게임 시스템 디자이너가 정의한 퍼즐 데이터 스키마 (오프라인 생성 파이프라인의 산출 포맷).
 * 로직 레이어(src/logic)의 GameState와는 필드명이 다르므로 반드시 adapter.ts를 거쳐 변환한다.
 */
export interface PuzzleVehicleSchema {
  id: string
  x: number
  y: number
  len: 2 | 3
  dir: 'H' | 'V'
  isTarget?: boolean
  /** 렌더링용 참조 (Kenney 모델/색상 타입). 로직에서는 사용하지 않음. */
  type?: string
}

export interface PuzzleSchema {
  id: string
  version: number
  board: {
    w: number
    h: number
    exit: { side: 'N' | 'E' | 'S' | 'W'; index: number }
  }
  vehicles: PuzzleVehicleSchema[]
  meta?: {
    minMoves?: number
    difficulty?: 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert'
    solution?: string[]
    [key: string]: unknown
  }
}
