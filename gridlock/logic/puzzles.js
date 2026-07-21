/**
 * 초기 시드 퍼즐 (수동 큐레이션). 로직 검증(adapter.test.js)에 쓰이는 최소 샘플이다.
 */
export const seedPuzzles = [
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

/**
 * 5단계 스테이지 퍼즐. gridlock/logic/solver.js의 BFS solver로 오프라인 생성 후
 * 실제 최소 이동수(minMoves)를 검증한 결과다 (추정치 아님 — solve() 실행 결과 그대로).
 * 생성 방법: 동일한 조밀한 차량 배치(11대) 하나에서 도달 가능한 모든 상태를
 * 완전 탐색(BFS)한 뒤, 모든 "이미 풀린" 상태를 동시 출발점으로 삼는 다중 출발 BFS로
 * 상태별 진짜 최소 이동수를 계산하고, 그중 난이도가 고르게 퍼진 5개를 선택했다.
 */
export const stagePuzzles = [
  {
    id: 'rh-stage-1',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 3, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 0, y: 1, len: 2, dir: 'H', type: 'suv-blue' },
      { id: 'V1', x: 3, y: 5, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V2', x: 1, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V3', x: 2, y: 1, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 1, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V5', x: 0, y: 4, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V6', x: 5, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 1, y: 2, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V8', x: 3, y: 3, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V9', x: 4, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Beginner', minMoves: 2 },
  },
  {
    id: 'rh-stage-2',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 3, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 4, y: 1, len: 2, dir: 'H', type: 'suv-blue' },
      { id: 'V1', x: 1, y: 5, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V2', x: 1, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V3', x: 2, y: 1, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 3, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V5', x: 0, y: 2, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V6', x: 5, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V8', x: 3, y: 3, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V9', x: 4, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Easy', minMoves: 4 },
  },
  {
    id: 'rh-stage-3',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 3, y: 1, len: 2, dir: 'H', type: 'suv-blue' },
      { id: 'V1', x: 0, y: 5, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V2', x: 2, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V3', x: 2, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 3, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V5', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V6', x: 5, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V8', x: 3, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V9', x: 4, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Intermediate', minMoves: 6 },
  },
  {
    id: 'rh-stage-4',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 4, y: 1, len: 2, dir: 'H', type: 'suv-blue' },
      { id: 'V1', x: 2, y: 5, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V2', x: 0, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V3', x: 2, y: 0, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 3, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V5', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V6', x: 5, y: 3, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V8', x: 3, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V9', x: 2, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Advanced', minMoves: 9 },
  },
  {
    id: 'rh-stage-5',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 2, y: 1, len: 2, dir: 'H', type: 'suv-blue' },
      { id: 'V1', x: 2, y: 5, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V2', x: 1, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V3', x: 2, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 2, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V5', x: 0, y: 3, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V6', x: 5, y: 3, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V8', x: 3, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V9', x: 3, y: 4, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Expert', minMoves: 11 },
  },
]
