import type { PuzzleSchema } from './schema'

/**
 * 초기 시드 퍼즐 (수동 큐레이션). 실제 57개 뱅크는 오프라인 절차 생성 +
 * solver 필터링 파이프라인으로 채우는 것이 기획 방향이며, 이 파일은 그 전까지
 * UI/로직을 검증하기 위한 최소 샘플이다.
 */
export const seedPuzzles: PuzzleSchema[] = [
  {
    id: 'rh-seed-001',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'B', x: 4, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'W', x: 0, y: 0, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'T1', x: 3, y: 4, len: 3, dir: 'H', type: 'truck-green' },
    ],
    meta: { difficulty: 'Beginner' },
  },
]
