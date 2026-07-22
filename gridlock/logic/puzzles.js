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
 * 10단계 스테이지 퍼즐. gridlock/logic/solver.js의 BFS solver로 오프라인 생성 후
 * 실제 최소 이동수(minMoves)를 검증한 결과다 (추정치 아님 — solve() 실행 결과 그대로).
 *
 * 1~2단계는 규칙을 가르치는 손수 설계 배치다.
 *
 * 3~10단계는 gridlock/scripts/generate-puzzles.mjs로 생성했다. 이전 방식(하나의 베이스
 * 보드에서 도달 가능한 여러 상태를 여러 스테이지에 나눠 배분 → 스테이지들이 시각적으로
 * 거의 동일)을 폐기하고, **스테이지마다 완전히 독립적으로 랜덤 생성한 베이스 보드**를
 * 그대로 퍼즐로 쓴다. 수천 개의 서로 다른 랜덤 조밀 보드를 만들어 각각 solve()로 실제
 * minMoves를 구한 뒤, minMoves가 낮은→높은 순으로 고르게 퍼지도록(4·6·8·10·12·14·16·18)
 * 8개를 골랐다. 어떤 두 스테이지도 같은 베이스 보드에서 파생되지 않는다.
 * 전 스테이지의 minMoves는 gridlock/logic/solver.test.js에서 solve()와 대조 검증된다.
 */
export const stagePuzzles = [
  {
    id: 'rh-stage-1',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      // 목표 차 앞을 가로막은 세로 차량 하나를 위로 올린 뒤 탈출한다.
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 4, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      // 규칙을 익히는 동안 보드가 너무 비어 보이지 않도록, 해법을 방해하지 않는 차량 하나만 둔다.
      { id: 'V1', x: 0, y: 0, len: 2, dir: 'H', type: 'sedan-yellow' },
    ],
    meta: { difficulty: 'Beginner', minMoves: 2 },
  },
  {
    id: 'rh-stage-2',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      // V1을 먼저 왼쪽으로 비켜야 V0을 위로 올릴 수 있다. 첫 연쇄 이동을 가르치는 배치다.
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 4, y: 2, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V1', x: 3, y: 0, len: 2, dir: 'H', type: 'sedan-yellow' },
      // 아래 차량들은 이동 축을 읽는 연습용이며, 정답 경로를 우연히 막지 않는다.
      // V2는 V0이 아래로 빠지는 지름길을 막아, 위쪽 연쇄 해법만 남긴다.
      { id: 'V2', x: 3, y: 4, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V3', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-purple' },
    ],
    meta: { difficulty: 'Easy', minMoves: 3 },
  },
  {
    id: 'rh-stage-3',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 2, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 1, y: 2, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V1', x: 3, y: 3, len: 2, dir: 'V', type: 'sedan-green' },
      { id: 'V2', x: 4, y: 5, len: 2, dir: 'H', type: 'sedan-orange' },
      { id: 'V3', x: 5, y: 0, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 0, y: 2, len: 3, dir: 'V', type: 'bus-mint' },
      { id: 'V5', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-lime' },
      { id: 'V6', x: 1, y: 5, len: 2, dir: 'H', type: 'sedan-brown' },
      { id: 'V7', x: 3, y: 0, len: 2, dir: 'V', type: 'sedan-purple' },
      { id: 'V8', x: 4, y: 1, len: 2, dir: 'V', type: 'sedan-navy' },
      { id: 'V9', x: 2, y: 0, len: 2, dir: 'V', type: 'sedan-teal' },
      { id: 'V10', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-pink' },
      { id: 'V11', x: 5, y: 2, len: 3, dir: 'V', type: 'bus-yellow' },
    ],
    meta: { difficulty: 'Intermediate', minMoves: 4 },
  },
  {
    id: 'rh-stage-4',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 4, y: 0, len: 2, dir: 'V', type: 'sedan-navy' },
      { id: 'V1', x: 1, y: 4, len: 2, dir: 'V', type: 'sedan-pink' },
      { id: 'V2', x: 2, y: 4, len: 2, dir: 'H', type: 'sedan-orange' },
      { id: 'V3', x: 5, y: 1, len: 2, dir: 'V', type: 'sedan-white' },
      { id: 'V4', x: 2, y: 0, len: 3, dir: 'V', type: 'truck-amber' },
      { id: 'V5', x: 0, y: 3, len: 3, dir: 'V', type: 'bus-yellow' },
      { id: 'V6', x: 3, y: 1, len: 2, dir: 'V', type: 'sedan-lime' },
      { id: 'V7', x: 5, y: 4, len: 2, dir: 'V', type: 'sedan-purple' },
      { id: 'V8', x: 2, y: 3, len: 2, dir: 'H', type: 'sedan-green' },
    ],
    meta: { difficulty: 'Advanced', minMoves: 6 },
  },
  {
    id: 'rh-stage-5',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 1, y: 0, len: 2, dir: 'H', type: 'sedan-teal' },
      { id: 'V1', x: 0, y: 3, len: 3, dir: 'V', type: 'bus-yellow' },
      { id: 'V2', x: 2, y: 1, len: 2, dir: 'V', type: 'sedan-pink' },
      { id: 'V3', x: 3, y: 3, len: 3, dir: 'V', type: 'truck-green' },
      { id: 'V4', x: 5, y: 2, len: 2, dir: 'V', type: 'sedan-white' },
      { id: 'V5', x: 3, y: 0, len: 2, dir: 'V', type: 'sedan-green' },
      { id: 'V6', x: 1, y: 3, len: 2, dir: 'H', type: 'sedan-purple' },
      { id: 'V7', x: 4, y: 1, len: 3, dir: 'V', type: 'truck-amber' },
      { id: 'V8', x: 4, y: 0, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V9', x: 4, y: 5, len: 2, dir: 'H', type: 'suv-blue' },
    ],
    meta: { difficulty: 'Advanced', minMoves: 8 },
  },
  {
    id: 'rh-stage-6',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 2, y: 1, len: 2, dir: 'V', type: 'sedan-navy' },
      { id: 'V1', x: 0, y: 3, len: 2, dir: 'V', type: 'sedan-lime' },
      { id: 'V2', x: 3, y: 4, len: 3, dir: 'H', type: 'truck-amber' },
      { id: 'V3', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-teal' },
      { id: 'V4', x: 4, y: 1, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V5', x: 2, y: 5, len: 3, dir: 'H', type: 'bus-yellow' },
      { id: 'V6', x: 5, y: 1, len: 2, dir: 'V', type: 'sedan-brown' },
      { id: 'V7', x: 3, y: 3, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V8', x: 2, y: 0, len: 2, dir: 'H', type: 'sedan-pink' },
      { id: 'V9', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-purple' },
      { id: 'V11', x: 3, y: 1, len: 2, dir: 'V', type: 'sedan-orange' },
      { id: 'V12', x: 1, y: 3, len: 2, dir: 'V', type: 'sedan-white' },
    ],
    meta: { difficulty: 'Expert', minMoves: 10 },
  },
  {
    id: 'rh-stage-7',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 2, y: 0, len: 2, dir: 'H', type: 'sedan-lime' },
      { id: 'V1', x: 5, y: 2, len: 3, dir: 'V', type: 'truck-green' },
      { id: 'V2', x: 3, y: 2, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V3', x: 4, y: 0, len: 3, dir: 'V', type: 'truck-amber' },
      { id: 'V4', x: 1, y: 1, len: 2, dir: 'H', type: 'sedan-white' },
      { id: 'V5', x: 3, y: 5, len: 2, dir: 'H', type: 'sedan-navy' },
      { id: 'V6', x: 0, y: 3, len: 3, dir: 'H', type: 'bus-mint' },
      { id: 'V7', x: 2, y: 4, len: 2, dir: 'V', type: 'sedan-green' },
      { id: 'V8', x: 0, y: 1, len: 2, dir: 'V', type: 'sedan-orange' },
      { id: 'V9', x: 0, y: 4, len: 2, dir: 'V', type: 'sedan-purple' },
    ],
    meta: { difficulty: 'Master', minMoves: 12 },
  },
  {
    id: 'rh-stage-8',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 2, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 1, y: 3, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V1', x: 5, y: 1, len: 3, dir: 'V', type: 'truck-green' },
      { id: 'V2', x: 0, y: 1, len: 2, dir: 'V', type: 'sedan-purple' },
      { id: 'V3', x: 3, y: 4, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V4', x: 4, y: 4, len: 2, dir: 'H', type: 'sedan-lime' },
      { id: 'V5', x: 0, y: 0, len: 3, dir: 'H', type: 'bus-yellow' },
      { id: 'V6', x: 0, y: 3, len: 3, dir: 'V', type: 'bus-mint' },
      { id: 'V7', x: 3, y: 0, len: 2, dir: 'H', type: 'sedan-green' },
      { id: 'V8', x: 4, y: 2, len: 2, dir: 'V', type: 'sedan-orange' },
      { id: 'V9', x: 1, y: 5, len: 2, dir: 'H', type: 'sedan-white' },
      { id: 'V10', x: 4, y: 5, len: 2, dir: 'H', type: 'sedan-brown' },
      { id: 'V11', x: 1, y: 1, len: 2, dir: 'V', type: 'sedan-pink' },
    ],
    meta: { difficulty: 'Master', minMoves: 14 },
  },
  {
    id: 'rh-stage-9',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 1, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 1, y: 0, len: 2, dir: 'V', type: 'sedan-green' },
      { id: 'V1', x: 3, y: 1, len: 2, dir: 'V', type: 'sedan-pink' },
      { id: 'V2', x: 0, y: 5, len: 2, dir: 'H', type: 'sedan-purple' },
      { id: 'V3', x: 3, y: 4, len: 3, dir: 'H', type: 'truck-amber' },
      { id: 'V4', x: 0, y: 0, len: 2, dir: 'V', type: 'sedan-white' },
      { id: 'V5', x: 2, y: 3, len: 3, dir: 'V', type: 'bus-mint' },
      { id: 'V6', x: 4, y: 0, len: 2, dir: 'V', type: 'suv-blue' },
      { id: 'V7', x: 5, y: 2, len: 2, dir: 'V', type: 'sedan-brown' },
      { id: 'V8', x: 4, y: 5, len: 2, dir: 'H', type: 'sedan-yellow' },
      { id: 'V9', x: 2, y: 0, len: 2, dir: 'H', type: 'sedan-teal' },
      { id: 'V10', x: 0, y: 3, len: 2, dir: 'H', type: 'sedan-lime' },
    ],
    meta: { difficulty: 'Legend', minMoves: 16 },
  },
  {
    id: 'rh-stage-10',
    version: 1,
    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },
    vehicles: [
      { id: 'X', x: 0, y: 2, len: 2, dir: 'H', isTarget: true, type: 'sedan-red' },
      { id: 'V0', x: 2, y: 1, len: 2, dir: 'V', type: 'sedan-yellow' },
      { id: 'V1', x: 5, y: 0, len: 3, dir: 'V', type: 'bus-yellow' },
      { id: 'V2', x: 2, y: 4, len: 3, dir: 'H', type: 'bus-mint' },
      { id: 'V3', x: 0, y: 5, len: 2, dir: 'H', type: 'sedan-teal' },
      { id: 'V4', x: 2, y: 3, len: 2, dir: 'H', type: 'sedan-green' },
      { id: 'V5', x: 2, y: 0, len: 3, dir: 'H', type: 'truck-green' },
      { id: 'V6', x: 4, y: 3, len: 2, dir: 'H', type: 'sedan-pink' },
      { id: 'V7', x: 1, y: 3, len: 2, dir: 'V', type: 'sedan-lime' },
      { id: 'V8', x: 2, y: 5, len: 2, dir: 'H', type: 'sedan-brown' },
      { id: 'V9', x: 0, y: 1, len: 2, dir: 'H', type: 'sedan-purple' },
    ],
    meta: { difficulty: 'Legend', minMoves: 18 },
  },
]
