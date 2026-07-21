---
name: boundary-consistency-check
description: "Gridlock 프로젝트의 데이터 스키마 ↔ 게임 로직 ↔ 렌더 계층 간 경계면 정합성을 교차 비교로 검증하는 절차. 필드명/부호 규약/좌표계/카운트 규약 불일치를 코드를 직접 대조해서 찾는다. '경계면 검증', '스키마-로직 정합성', 'QA' 요청 시 사용."
---

# 경계면 정합성 검증 절차

두 모듈이 각각 "올바르게" 구현되어도 연결 지점의 계약이 어긋나면 버그가 된다. 이 프로젝트는 실제로 그런 사례(퍼즐 데이터의 이동수 카운트 규약과 로직의 승리 판정이 처음엔 어긋나 있었음)가 있었으므로, "존재하는가"가 아니라 "양쪽이 맞물리는가"를 검증한다.

## 원칙: 양쪽을 동시에 읽어라
한쪽 문서나 커밋 메시지의 "정합 맞췄다"는 서술을 신뢰하지 말고, 관련된 두 파일을 함께 Read해서 실제 타입/필드명을 문자 그대로 대조한다.

## 검증 매트릭스

| 검증 대상 | 왼쪽 (정의) | 오른쪽 (사용처) | 확인할 것 |
|----------|-----------|---------------|----------|
| exit 표기 | gridlock/logic/adapter.js의 SIDE_MAP(N/E/S/W→right/left/top/bottom) | gridlock/logic/win.js의 exitSide switch | 4방향 모두 매핑되는가, 매핑 누락 시 조용히 undefined가 되지 않는가 |
| 차량 필드 | PuzzleSchema.vehicles(x/y/len/dir, gridlock/logic/adapter.js 상단 주석 참조) | gridlock/logic/board.js·moves.js의 Vehicle(row/col/length/orientation) | adapter.js에서 축 전치 없이 정확히 매핑되는가 |
| 승리 판정 | gridlock/logic/win.js isSolved() | gridlock/logic/solver.js solve()의 목표 상태 판정 | 동일한 isSolved()를 호출하는가, 별도로 승리 조건을 재구현하지 않았는가 (gridlock/game.js의 tryMove 콜백에서도 동일) |
| 이동 카운트 | gridlock/logic/moves.js applyMove()의 moveCount 증가 | gridlock/logic/solver.js의 BFS depth | 1 슬라이드 = 1 이동으로 항상 일치하는가 |
| 이동 부호 | gridlock/logic/moves.js의 serializeMove/parseMove | gridlock/game.js의 tryMove(dir 매핑: up/down/left/right → axisDir) | +/- 해석이 좌표 증가/감소 방향으로 일관되는가, 별도 부호 해석 로직이 새로 생기지 않았는가 |
| 좌표 하드코딩 | game.board.rows/cols | gridlock/game.js의 resizeCanvas/render(cellPx 계산) | 6이 상수로 박혀있지 않은가 |
| ESM import 경로 | gridlock/logic/*.js의 export | import하는 쪽의 상대 경로 | 브라우저 네이티브 ESM은 확장자 생략을 허용하지 않는다 — `.js` 확장자가 모든 import에 빠짐없이 붙어있는가 |

## 절차
1. 위 매트릭스의 "왼쪽"과 "오른쪽" 파일을 각각 Read
2. 필드명/타입/의미를 나란히 놓고 문자 그대로 비교 (변수명이 비슷해 보여도 의미가 다를 수 있음에 주의)
3. 불일치 발견 시: 심각도(치명/주의/경미) 분류 + 구체적 수정안(파일:라인) 작성
4. `npm run test`(vitest)와 각 파일 `node --check`(문법 검증)를 실제로 실행해 회귀 여부 확인 — 이 프로젝트는 빌드 단계가 없으므로 `npm run build`는 존재하지 않는다. 정적 추론만으로 "괜찮다"고 판단하지 않는다
5. 결과를 Critic 형식(동의하는 부분 / 반박·약점 / 미검증 가정 / 권장 조치)으로 보고

## 흔한 실패 패턴
- 브라우저 네이티브 ESM은 번들러와 달리 확장자 생략(`import './board'`)을 허용하지 않는다 — 로컬에서 vitest는 통과해도 실제 브라우저에서는 404가 날 수 있다
- "이 필드를 전달했다"는 코드 주석과 실제 전달 여부가 다를 수 있다 — 주석이 아니라 실제 호출 체인을 추적한다
- vitest 통과가 브라우저 동작을 보증하지 않는다 — game.js처럼 DOM에 의존하는 코드는 정적 서버로 실제 열어보는 것이 유일한 검증 방법이다
