# 발견 사항 & 공유 자료

## 2026-07-21 — leader: 사전 리서치 요약

### 러시아워 보드게임 규칙
- 보드: 6×6 격자, 우측(또는 지정된) 한 줄에 출구
- 차량: 자동차 12개(1×2칸, 가로/세로 배치), 트럭 4개(1×3칸), 빨간 차 1개(플레이어 목표 차량, 보통 2칸)
- 이동 규칙: 각 차량은 배치된 방향(가로 또는 세로)으로만 직선 슬라이드. 회전 불가. 다른 차량을 뛰어넘거나 들어올릴 수 없음. 겹침 불가
- 목표: 다른 차량을 슬라이드시켜 빨간 차의 출구까지의 경로를 확보 후 빨간 차를 출구로 이동
- 난이도: 카드 기반, Beginner~Expert(정규 40장), Grand Master 포함 시 60장, Ultimate 155장
- 각 카드 뒷면에 최소 이동 수 해법 인쇄
- 학술적 사실: 일반화된 Rush Hour의 해결가능성 판정은 PSPACE-complete (Tromp & Cilibrasi, 2005: 차량 크기 2로 고정해도 PSPACE-complete 유지). 최고난도 초기 배치는 51회 이동/93단계 필요
- 변형판: Rush Hour Jr., Railroad Rush Hour, Safari Rush Hour 등. 확장 카드셋(2~4)은 스포츠카(2칸)/리무진(3칸)/택시(2칸) 등 특수 목표차량 추가

### Kenney Car Kit (https://kenney.nl/assets/car-kit)
- 40개 이상 3D 차량 모델(승용차/트럭/밴, v3.0에서 카트 레이서 추가)
- 포맷: OBJ, FBX, glTF — glTF는 Three.js/Babylon.js 등 웹 3D 렌더러 표준 포맷
- 라이선스: CC0 1.0 Universal — 상업적 이용 포함 자유 사용, 크레딧 표기 의무 없음(권장)
- Godot/Unity/Unreal Engine 등 주요 엔진 호환
- 미확인: 페이지 자체에는 2D 탑뷰 스프라이트/텍스처 아틀라스 존재 여부 명시 안 됨 — 3D 모델을 직교(orthographic) 탑다운 카메라로 렌더링하는 방식이 유력해 보이나 각 전문가가 실제 적용 방식 판단 필요

---

## 2026-07-21 20:10 — game-systems-designer: 게임 시스템 설계안

> Analyst 원칙 적용: 모든 결론을 상태공간/알고리즘 근거로 뒷받침. 확정 불가 영역은 "한계"로 분리. MECE 분류 우선.

### TL;DR (3줄)
1. 보드 크기는 **"데이터·로직은 가변(N×M) 설계, UI/에셋은 6×6 우선 구현"** 하이브리드 권장 — 하드코딩 재작업 리스크를 스키마 단계에서 차단하되 초기 개발 범위는 6×6로 한정.
2. 난이도는 **BFS 최소 이동수(주지표) + 분기계수·강제이동수·차량수(보조지표)** 로 정량화하고, 5등급(Beginner/Easy/Intermediate/Advanced/Expert) 임계값을 실측 보정 전제로 잠정 설정.
3. 레벨 데이터는 **하이브리드(사전 큐레이션 40+ 시드 + 오프라인 절차적 생성 → solver 필터링 → 뱅크 적재)**, 스키마는 가변 보드를 수용하는 JSON. "유일해"는 실무상 **최소해 경로 수(solution multiplicity) 제약**으로 재정의(뒤 한계 섹션 참조).

---

### 1. 보드 크기 가변 여부 (MECE: 3안 비교)

| 안 | 정의 | 장점 | 단점 | 구현 난이도 |
|----|------|------|------|-----------|
| **A. 6×6 완전 고정** | 좌표계/렌더/solver 모두 6 하드코딩 | 원작 100% 호환, solver 상태공간 예측 가능(수천~수만), 렌더 레이아웃 단순 | 8×8·커스텀 확장 시 좌표계·렌더·solver·데이터 전체 재작업(도메인 실패패턴 명시) | 낮음 |
| **B. 완전 가변** | 임의 N×M(4×4~10×10+), 출구 위치·변도 파라미터화 | 확장팩·에디터·난이도 스케일 자유, Jr.(작은판) 수용 | solver 상태공간 폭증(8×8↑에서 BFS 메모리 부담), 렌더 반응형 복잡, 초기 개발/QA 비용 증가 | 높음 |
| **C. 하이브리드(권장)** | **데이터 스키마·이동/충돌 로직은 `boardW/boardH/exit` 파라미터로 가변**, 초기 **UI/에셋/퍼즐뱅크는 6×6만** 제공 | 재작업 리스크를 스키마에서 선제 차단(하드코딩 안티패턴 회피), 초기 범위는 6×6로 관리, 확장 시 데이터·solver 재작업 불필요 | 로직에 크기 인자 배선하는 초기 오버헤드(소폭) | 중간 |

**권장: C안.** 근거 — (a) 이동검증/충돌감지 로직은 크기를 상수 대신 인자로 받는 비용이 거의 0에 가깝다(루프 경계만 변수화). (b) solver·데이터가 크기 비의존이면 이후 8×8 확장이 "렌더+에셋 배치"만의 문제로 축소된다. (c) 반대로 UI/퍼즐뱅크까지 처음부터 가변으로 만들면 검증 표면적이 커져 초기 출시가 늦어진다.
**로직 계약(technical-architect에게 전달):** 좌표계는 `(col x, row y)` 0-index, 이동/충돌/승리 판정 함수는 `board: {w, h, exit:{side, index}}` 를 인자로 받을 것. 상수 `6` 하드코딩 금지.

---

### 2. 난이도 시스템 설계

#### 2-1. 측정 지표 (주 1 + 보조 4, MECE)
| 지표 | 정의 | 역할 | 산출 |
|------|------|------|------|
| **최소 이동수 (optimal move count)** | BFS로 구한 목표차 탈출까지 최소 이동 횟수. "이동"=한 차량을 한 번에 임의 칸수 슬라이드(ThinkFun 카운트 규약) | **주지표** | 서버/오프라인 BFS |
| 분기계수 (branching factor) | 해 경로 상 각 상태의 평균 합법 이동 수 | 보조 — 선택지 많을수록 길찾기 체감난이도↑ | solver 부산물 |
| 강제/우회 이동수 (forced & non-progress moves) | 목표차를 당장 전진시키지 않는(오히려 후퇴시키거나 무관 차량을 먼저 빼야 하는) 필수 이동 수 | 보조 — 함정형 난이도(이동수 적어도 어려움) 포착 | 해 경로 분석 |
| 최소해 경로 다중도 (solution multiplicity) | 동일 최소 이동수를 갖는 서로 다른 해 경로 개수 | 보조 — 적을수록 "정답이 좁아" 체감난이도↑ | BFS DAG 카운트 |
| 차량 수 / 밀도 | 배치 차량 대수, 점유 칸 비율 | 보조 — 시각적 복잡도·초심자 진입장벽 | 데이터 직접 |

> 이동수 카운트 규약 주의: ThinkFun 카드는 "한 차량이 멈출 때까지가 아니라 밀 때마다 1회"가 아니라 **"한 차량을 한 방향으로 이동시키는 것을 1수"(칸수 무관)** 로 센다. solver·UI·해법표시 모두 이 규약으로 통일해야 라벨-체감 오차가 안 생김. (기획 확정 필요 사항)

#### 2-2. 등급 임계값 (5등급, 잠정 — 실측 보정 전제)
도메인 카드 4등급을 **5등급으로 세분**(초심자 온보딩 구간 확보):

| 등급 | 최소 이동수 | 보조 조건(가이드) | 근거 |
|------|-----------|------------------|------|
| Beginner | 1–5 | 차량 ≤6, blocker 1대 | ThinkFun 초급 카드 다수가 한 자릿수 초반 |
| Easy | 6–8 | 분기계수 낮음 | 온보딩→중급 완충 |
| Intermediate | 9–12 | 우회 이동 ≥1 | 정규판 중급 분포 |
| Advanced | 13–17 | 우회 이동 ≥2, 다중도 낮음 | 도메인 카드 11–16 상향 조정판 |
| Expert | 18+ | 우회 이동 다수 | 정규판 최상급~. 이론상 최대 51수(리서치)까지 |

**중요(반증 반영):** 최소 이동수 단독 라벨링은 도메인 실패패턴("이동수 적은데 분기계수 낮아 실제 쉬움 → Expert 오분류")에 취약. 따라서 **1차 분류는 이동수 밴드로 하되, 보조지표가 밴드와 2등급 이상 괴리되면 재분류 플래그**를 세워 사람이 검토(예: 이동수는 18인데 분기계수·다중도가 매우 높아 실제로는 쉬움 → Advanced 강등). 즉 이동수 = 필요조건, 보조지표 = 보정.

#### 2-3. 난이도별 퍼즐 수 (초기 출시 목표)
도메인 KPI(총 40+, 등급별 ≥10) 충족하는 분포 제안:

| 등급 | 초기 수량 | 비고 |
|------|----------|------|
| Beginner | 15 | 온보딩 이탈 방지 위해 가장 두껍게 |
| Easy | 12 | |
| Intermediate | 12 | |
| Advanced | 10 | |
| Expert | 8 | 생성 난도 높음(희소) → 큐레이션 비중↑ |
| **합계** | **57** | KPI 40 상회. 절차적 생성으로 무한 확장 여지 |

---

### 3. 레벨/퍼즐 데이터 관리 방식

#### 3-1. 생성 방식 비교 (MECE 3안)
| 방식 | 장점 | 단점 | 판정 |
|------|------|------|------|
| 사전 큐레이션(고정 N장) | 품질 100% 보증, 원작 카드 재현 | 콘텐츠 소진 빠름, 라이선스(ThinkFun 카드 배치 그대로 복제 시 저작권 이슈 가능) | 시드/Expert용으로만 |
| 순수 절차적 생성(런타임) | 무한 콘텐츠 | **클라이언트 BFS 실행 시 프리징 위험**(도메인 실패패턴), 품질 편차 | 단독 비권장 |
| **하이브리드(권장)** | 무한 콘텐츠 + 품질 보증 + 클라 부하 0 | 오프라인 생성 파이프라인 구축 필요 | **채택** |

**하이브리드 파이프라인(오프라인/빌드타임 또는 서버 배치):**
1. 생성기: 목표차 배치 → 랜덤 차량 채우기(밀도 파라미터) 또는 **역생성(해 상태에서 역방향 셔플)**.
2. solver(BFS): 풀림 여부 + 최소 이동수 + 보조지표 산출.
3. 필터: 품질 기준(4장) 통과분만 채택.
4. 정규화·중복제거 후 **퍼즐 뱅크(정적 JSON/DB)** 에 난이도 태그와 함께 적재.
5. 클라이언트는 뱅크에서 **읽기만** — solver 미탑재. 힌트는 저장된 해법 재생(또는 서버 API).

> 생성 알고리즘 노트: 순방향 랜덤 배치는 "풀리는" 비율이 낮아 비효율. **역방향 생성(goal에서 무작위 합법 이동 역적용 후 도달 상태 채택)** 이 solvable 보장 + 난이도 하한 제어에 유리. 단 역생성은 최소해가 셔플 길이보다 짧을 수 있으므로 최종 최소 이동수는 반드시 BFS로 재측정.

#### 3-2. 데이터 스키마 (가변 보드 수용 JSON)
```jsonc
{
  "id": "rh-0042",
  "version": 1,
  "board": { "w": 6, "h": 6, "exit": { "side": "E", "index": 2 } }, // side: N/E/S/W, index=행/열
  "vehicles": [
    { "id": "X", "x": 1, "y": 2, "len": 2, "dir": "H", "isTarget": true },  // 빨간차
    { "id": "A", "x": 0, "y": 0, "len": 2, "dir": "V" },
    { "id": "T1","x": 3, "y": 0, "len": 3, "dir": "H", "type": "truck" }
    // x,y = 좌상단 앵커 셀(0-index), dir: H(가로)/V(세로), len: 2|3
  ],
  "meta": {
    "minMoves": 14,           // BFS 최소 이동수 (라벨 산출 근거)
    "branching": 2.4,         // 평균 분기계수
    "forcedMoves": 3,         // 우회/강제 이동 수
    "solutionPaths": 2,       // 최소해 다중도
    "difficulty": "Advanced", // 최종 라벨(보정 후)
    "solution": ["A+1","T1-2","X+4"], // 힌트/정답 재생용 최소해 (id+부호+칸수)
    "canonicalHash": "…",     // 대칭 정규화 후 해시(중복제거 키)
    "generator": "reverse-gen@v1", "seed": 812374
  }
}
```
- `board` 파라미터화로 6×6 고정 하드코딩 회피(1안 계약과 정합).
- `type` 은 렌더링(에셋 매핑)·확장차량용 선택 필드. 규칙 로직은 `len`만 사용 → 확장차량 추가 시 로직 무변경.
- `solution`·`meta`는 오프라인 solver가 채워 클라 solver 불필요.

#### 3-3. 확장 콘텐츠 고려
- **확장 차량(리무진 3칸·스포츠카 목표차 등):** `len`·`isTarget`·`type`로 이미 표현 가능. 로직은 길이만 보므로 신규 규칙 불필요. 특수차량(예: 우회전 트럭 등 변형판 룰)은 별도 `rule` 필드로 격리 권장(초기 범위 밖).
- **확장팩 = 뱅크 태그(`pack: "classic"|"jr"|"pro"`):** 데이터로만 관리, 코드 무변경.

---

### 4. 퍼즐 품질 기준 (채택 필터, 4장)

1. **해 존재(solvability):** solver가 해 1개 이상 발견. 미해결 배치 즉시 폐기.
2. **비자명성(non-triviality):** 목표차가 초기 **최소 1대 이상에 막혀** 있어야 함(빈 경로면 즉시 클리어 = 폐기). 강화 기준: `minMoves ≥ 등급 하한`.
3. **최소해 경로 다중도 제약(≈"유일해" 재정의):** 동일 최소 이동수를 갖는 서로 다른 해 경로 수 `solutionPaths` 를 측정, **등급이 높을수록 상한을 낮게**(예: Expert는 ≤3). 다중도가 과다하면 "아무 차나 밀어도 풀리는" 느슨한 퍼즐 → 폐기 또는 하향 등급.
4. **대칭·중복 제거:** 아래 정규화로 `canonicalHash` 산출, 동일 해시 폐기.

**대칭 정규화 정확성 노트(analyst 정밀):**
- 러시아워 보드는 **출구 위치가 대칭을 대부분 깨뜨린다.** 출구를 특정 변·행에 고정하면 남는 비자명 대칭은 (출구가 그 변의 중앙축일 때) **출구 축에 대한 반사 1개**뿐. 6×6·출구=E변 index2(비중앙)면 비자명 대칭은 사실상 없음 → 중복제거는 (a)완전동일 배치 (b)ID 라벨만 다른 배치 로의 정규화가 핵심.
- 반면 **출구를 임의 변에 허용**하면 정사각 보드의 완전 대칭군(2면체군 D4, 8개: 회전4×반사2)이 적용됨. 이때 정규화 규칙: **모든 8개 변환을 적용→출구를 표준 위치(예: E변)로 보내는 변환 선택→차량 배치를 사전식 최소 문자열로 만드는 라벨링 → 그 문자열이 canonicalHash.** 이러면 회전/반사로 동형인 퍼즐이 하나로 접힘.
- 즉 **중복제거 강도는 "출구를 고정하느냐 자유롭게 두느냐"에 종속** — 6×6·고정출구 초기 범위에선 배치+라벨 정규화로 충분, 가변/자유출구 확장 시 D4 정규화 필요.

---

### 이상값 / 예외 케이스
- **Expert 희소성:** 18수+·다중도 낮은 퍼즐은 랜덤 생성 수율이 급감(상태공간 깊은 곳). Expert는 큐레이션+장시간 생성 배치로 확보, 수량 목표를 8로 보수 설정.
- **밀도 상한:** 차량이 과밀하면(점유율↑) 오히려 이동 불가로 최소 이동수가 작아지는 역전 현상. 밀도-난이도는 단조가 아님 → 밀도는 생성 파라미터일 뿐 난이도 지표로 직접 쓰지 말 것.
- **목표차 세로/비표준 출구 변형:** 데이터 스키마는 수용하나 초기 범위 밖(가로 목표차·E변 출구 고정 권장).

### 한계 / 불확실성 (반증 반영)
1. **"유일해 100%"(도메인 KPI)는 문헌·실무상 문자 그대로는 비현실적.** 슬라이딩 블록 퍼즐은 최소해와 무관한 여분 이동으로 대체 경로가 거의 항상 존재. → **KPI를 "solvable 100% + 비자명 + 최소해 다중도 등급별 상한 준수"로 재정의** 권장(팀장 승인 필요). 신뢰도: 높음(구조적 사실).
2. **등급 임계값은 실측 없이 확정 불가.** 위 밴드는 ThinkFun 분포 관찰 기반 잠정치. 플레이테스트 10인 이상 데이터로 라벨-체감 오차<10%(KPI) 검증 후 조정 필요. 신뢰도: 중간.
3. **분기계수·다중도의 정확한 컷오프 값은 미정** — 샘플 생성 후 분포를 보고 백분위로 잡아야 함(선험적 상수 금지). 현재는 "상대적으로 높음/낮음" 수준. 신뢰도: 중간.
4. **역방향 생성의 난이도 분포 편향 가능성:** 셔플 길이와 실제 최소해가 어긋나므로 특정 난이도대가 과다/과소 생성될 수 있음. BFS 재측정으로 라벨은 정확하나 목표 분포 채우기 효율은 미검증. 신뢰도: 중간.
5. solver 성능(6×6 BFS <200ms)은 technical-architect 구현·벤치 확인 필요(내 영역 밖, 상태공간 추정상 타당하나 미실측).

---

## 2026-07-21 19:57 — technical-architect: 기술 구현 설계안

> Builder 관점. 게임 로직은 렌더링과 완전히 분리된 **순수 함수 + 불변 상태**로 설계한다. 아래 로직은 프레임워크(React/Vue)와 렌더러(3D/2D) 무관하게 재사용 가능하며 UI 없이 Vitest로 100% 단위 테스트할 수 있게 만드는 것이 핵심 목표다.

### 0. 핵심 데이터 모델 (모든 로직의 기반)

그리드를 2차원 배열로 들지 않는다. **차량 리스트 + 점유 셀 Set**을 소스 오브 트루스로 삼는다. (2D 배열은 파생 캐시일 뿐)

```ts
type Orientation = 'H' | 'V';          // 가로 / 세로
type Axis1 = 1 | -1;                    // 축 방향: H→(+오른쪽/-왼쪽), V→(+아래/-위)
type ExitSide = 'right' | 'left' | 'top' | 'bottom';

interface Vehicle {
  id: string;
  row: number;        // 좌상단 셀 (0-index)
  col: number;
  length: 2 | 3;      // 승용차 2, 트럭 3
  orientation: Orientation;
  isTarget: boolean;  // 빨간 차 여부
  modelKey?: string;  // Kenney 모델/색상 참조 (렌더 계층 전용, 로직 무관)
}

interface Board {
  rows: number;       // 기본 6 (가변)
  cols: number;       // 기본 6
  exitRow: number;    // 출구가 뚫린 행 (right/left일 때)
  exitCol: number;    // 출구가 뚫린 열 (top/bottom일 때)
  exitSide: ExitSide; // 클래식 = 'right', exitRow=2 (0-index)
}

interface GameState {
  board: Board;
  vehicles: Vehicle[];
  status: 'IDLE' | 'ANIMATING' | 'SOLVED';  // 입력 게이팅용 상태머신
  moveCount: number;
}
```

셀 인덱스 = `row * cols + col` (1차원 정수) → Set 연산 O(1).

```ts
function cellsOf(v: Vehicle, cols: number): number[] {
  const cells: number[] = [];
  for (let i = 0; i < v.length; i++) {
    const r = v.orientation === 'V' ? v.row + i : v.row;
    const c = v.orientation === 'H' ? v.col + i : v.col;
    cells.push(r * cols + c);
  }
  return cells;
}

// 특정 차량을 제외한 나머지 전체 점유 셀 (이동 검증 시 자기 자신은 빼야 함)
function occupancySet(state: GameState, excludeId?: string): Set<number> {
  const occ = new Set<number>();
  for (const v of state.vehicles) {
    if (v.id === excludeId) continue;
    for (const cell of cellsOf(v, state.board.cols)) occ.add(cell);
  }
  return occ;
}
```

### 1. 차량 이동 검증 로직 (직선 이동만 + 경계 + 충돌)

**직선 이동 강제는 런타임 검사가 아니라 API 설계로 구조적으로 보장한다.** 이동 함수는 차량 방향(orientation)에 대해 `dir: Axis1`(+1/-1)만 받는다. 수직 이동을 표현할 방법 자체가 없으므로 "직선 슬라이드만 가능" 규칙이 타입 레벨에서 깨질 수 없다.

경로 검사는 **엔드포인트만이 아니라 새로 진입하는 모든 셀(swept path)**을 검사해야 한다. (엔드포인트만 보면 `[1,2]→[4,5]` 이동 시 col 3의 장애물을 놓치는 버그 발생.) 아래 `maxSlide`는 한 칸씩 전진하며 "새로 밟는 앞쪽 셀" 하나만 검사하므로 O(steps)에 경로 전체가 검증된다.

```ts
// dir 방향으로 미끄러질 수 있는 최대 칸 수 반환 (0이면 못 움직임)
function maxSlide(state: GameState, id: string, dir: Axis1): number {
  const v = state.vehicles.find(x => x.id === id)!;
  const { rows, cols } = state.board;
  const occ = occupancySet(state, id);
  let steps = 0;
  for (;;) {
    const next = steps + 1;
    let r: number, c: number;
    if (v.orientation === 'H') {
      r = v.row;
      c = dir > 0 ? v.col + v.length - 1 + next  // 오른쪽 진입 셀
                  : v.col - next;                 // 왼쪽 진입 셀
    } else {
      c = v.col;
      r = dir > 0 ? v.row + v.length - 1 + next : v.row - next;
    }
    if (r < 0 || r >= rows || c < 0 || c >= cols) break; // 경계
    if (occ.has(r * cols + c)) break;                    // 충돌
    steps = next;
  }
  return steps;
}

function canMove(state: GameState, id: string, dir: Axis1, steps: number): boolean {
  return steps >= 1 && steps <= maxSlide(state, id, dir);
}

// 순수 함수: 불변 새 상태 반환 (DOM/렌더 무관)
function applyMove(state: GameState, id: string, dir: Axis1, steps: number): GameState {
  if (!canMove(state, id, dir, steps)) return state; // 무효 이동은 상태 불변
  const vehicles = state.vehicles.map(v => {
    if (v.id !== id) return v;
    const d = steps * dir;
    return v.orientation === 'H' ? { ...v, col: v.col + d } : { ...v, row: v.row + d };
  });
  return { ...state, vehicles, moveCount: state.moveCount + 1 };
}
```

**검증 방법(테스트 케이스, Vitest 대상):** 경계 밖 이동 거부 / 인접 차량에 막힘 / 사이 빈칸 정확히 카운트 / steps=0 거부 / 경로 중간 장애물 감지(`[1,2]→[4,5]` with block@3) / 자기 자신 셀 제외 확인 / H·V 양방향 / 트럭(len 3). 목표 커버리지 100%.

### 2. 충돌 감지 알고리즘 (2계층)

- **정적(배치) 충돌** — 퍼즐 로드 시 1회. 겹침/경계 이탈/목표차 행 불일치 검증. 잘못된 퍼즐 데이터를 런타임 진입 전에 걸러낸다.
- **동적(이동) 충돌** — 위 `maxSlide`의 `occ.has()`가 곧 충돌 감지. **매 프레임 전체 그리드 순회 안 함.** 이동 시점에만 점유 Set으로 O(진행칸수) 검사 → KPI(60fps) 방어.

```ts
function validatePlacement(state: GameState): { ok: boolean; error?: string } {
  const { rows, cols, exitRow, exitSide } = state.board;
  const seen = new Set<number>();
  let target: Vehicle | undefined;
  for (const v of state.vehicles) {
    if (v.isTarget) target = v;
    for (let i = 0; i < v.length; i++) {
      const r = v.orientation === 'V' ? v.row + i : v.row;
      const c = v.orientation === 'H' ? v.col + i : v.col;
      if (r < 0 || r >= rows || c < 0 || c >= cols)
        return { ok: false, error: `out of bounds: ${v.id}` };
      const cell = r * cols + c;
      if (seen.has(cell)) return { ok: false, error: `overlap at ${cell}: ${v.id}` };
      seen.add(cell);
    }
  }
  if (!target) return { ok: false, error: 'no target vehicle' };
  // 클래식: 목표차는 출구 축과 평행해야 출구로 나갈 수 있음
  if (exitSide === 'right' || exitSide === 'left') {
    if (target.orientation !== 'H' || target.row !== exitRow)
      return { ok: false, error: 'target not aligned to exit' };
  } else {
    if (target.orientation !== 'V' || target.col !== state.board.exitCol)
      return { ok: false, error: 'target not aligned to exit' };
  }
  return { ok: true };
}
```

### 3. 승리 조건 체크 로직

물리 러시아워 규칙과 동일하게 **"빨간 차를 출구로 슬라이드해 빼내면 승리"**. 구현 상 canonical 판정은 **목표차 전방 → 출구 경계까지 경로가 완전히 비었는가**로 정의한다(= 마지막 한 번의 슬라이드로 나갈 수 있는 상태). 이 술어가 true가 되는 순간 최종 "빠져나가는" 슬라이드 애니메이션을 자동 재생하고 `status='SOLVED'`로 전이한다. (전방 셀이 곧 가장자리여야만 승리로 치는 더 엄격한 변형도 한 줄로 대체 가능 — 아래 주석.)

```ts
function isSolved(state: GameState): boolean {
  const t = state.vehicles.find(v => v.isTarget);
  if (!t) return false;
  const { cols, rows, exitRow, exitCol, exitSide } = state.board;
  const occ = occupancySet(state, t.id);
  if (exitSide === 'right') {
    if (t.orientation !== 'H' || t.row !== exitRow) return false;
    const front = t.col + t.length - 1;
    for (let c = front + 1; c < cols; c++) if (occ.has(t.row * cols + c)) return false;
    return true;   // 엄격판: 대신 `return front === cols - 1;`
  }
  if (exitSide === 'left') {
    if (t.orientation !== 'H' || t.row !== exitRow) return false;
    for (let c = t.col - 1; c >= 0; c--) if (occ.has(t.row * cols + c)) return false;
    return true;
  }
  if (exitSide === 'bottom') {
    if (t.orientation !== 'V' || t.col !== exitCol) return false;
    const front = t.row + t.length - 1;
    for (let r = front + 1; r < rows; r++) if (occ.has(r * cols + t.col)) return false;
    return true;
  }
  /* top */
  if (t.orientation !== 'V' || t.col !== exitCol) return false;
  for (let r = t.row - 1; r >= 0; r--) if (occ.has(r * cols + t.col)) return false;
  return true;
}
```

판정 비용 O(cols) — 매 이동 후 1회. 그리드 전수 순회 없음.

**입력 게이팅 상태머신(필수):** 입력은 `status==='IDLE'`일 때만 수신 → `applyMove` → `ANIMATING`(트윈 재생) → 완료 콜백에서 `isSolved` 검사 → `SOLVED` 또는 `IDLE` 복귀. 이 게이트가 "애니메이션 중 입력 → 논리상태·화면 불일치, 차량 겹쳐 보임" 실패 패턴을 원천 차단한다.

### 4. Kenney Car Kit 적용: 3D 직교 렌더 vs 2D 사전렌더 스프라이트

전제(TEAM_FINDINGS): Kenney Car Kit은 **3D 전용**(glTF/OBJ/FBX), 2D 탑뷰 스프라이트 미포함. CC0. → 2D로 가려면 별도 렌더 파이프라인이 반드시 선행된다.

**옵션 A — 3D 직교(Orthographic) 탑다운 렌더 [권장]**
- 방법: React Three Fiber(three.js) + drei. **Orthographic 카메라를 보드 정중앙 상공에서 수직(-Y) 배치**해 원근 왜곡 0 → 격자 셀 경계가 화면에서 완벽히 직사각형으로 정렬. glTF는 `useGLTF`(+ Draco 압축)로 로드. 셀 크기=1 유닛으로 정규화하면 차량 좌표=`(col, 0, row)` 변환만으로 배치.
- 색상 변형: glTF 바디 머티리얼을 런타임에 clone 후 `material.color.set()`로 틴트 → **모델 1개로 N색 차량 생성**. Kenney 킷은 색 변형이 이 방식으로 처리된다. → 2D의 "색마다 스프라이트 재렌더" 폭발 문제를 근본 해결.
- 로딩: 현재 퍼즐에 실제 존재하는 바디 타입(승용차/트럭)만 lazy load, geometry 공유(`<Instances>`/clone). 초기 프리로드 ≤5종(KPI 충족). 나머지 차종은 필요 시 로드.
- 장점: 아트 파이프라인 0(킷 그대로), 무료 라이팅/그림자로 고급스러운 룩, 직교=완벽 정렬, 저폴리 16대는 중급 모바일도 60fps 여유.
- 단점: three.js 런타임 ~150KB gzip 추가(로직 번들과 별개, 코드 스플릿으로 격리). 3D 튜닝(라이트/그림자/카메라 프러스텀) 초기 세팅 비용.

**옵션 B — 2D 사전렌더 스프라이트 (경량 폴백)**
- 방법: Blender headless(`blender -b --python render.py`)로 각 모델을 오소그래픽 탑다운 스냅샷 → PNG 스프라이트 아틀라스 1회 생성. 런타임은 Canvas2D/SVG/PixiJS로 스프라이트만 그림.
- 장점: 3D 런타임 0 → 최소 번들·최고 저사양 호환. 로직-렌더 완전 단순.
- 단점: **색/스킨 변형마다 재렌더 필요**(런타임 틴트는 셰이더로 부분 완화 가능하나 음영까지 자연스럽게는 어려움). Blender 스크립팅 초기 세팅 비용. 회전/그림자 등 각도 자산은 사전 고정.

**권장안: 옵션 A(3D 직교)를 기본으로 채택.** 근거 — (1) 킷이 3D 네이티브라 아트 파이프라인 비용 0, (2) 런타임 recolor가 변형 폭발을 없애 유지보수 우위, (3) 직교 카메라로 정렬 정확성 확보, (4) 목표 KPI(16대 60fps) 달성 여유. **단, 렌더 계층을 인터페이스로 추상화**(`<BoardRenderer state={} onMove={} />`)해 3D 구현을 먼저 출시하고, 저사양 타깃에서 성능 문제가 실측되면 동일 인터페이스의 2D 구현으로 드롭인 교체할 수 있게 설계한다. 로직 계층은 어느 쪽이든 무변경.

### 5. 전체 기술 스택 및 아키텍처

| 계층 | 선택 | 근거 |
|------|------|------|
| 언어 | **TypeScript** | 상태 모델·이동 방향을 타입으로 강제(직선 이동 구조적 보장) |
| 빌드 | **Vite** | 빠른 HMR, 코드 스플�팅으로 3D 청크 격리 |
| UI 프레임워크 | **React** (대안: Vue) | R3F 생태계 성숙, 렌더러 교체 용이 |
| 상태관리 | **Zustand** | 게임 로직(순수 함수)을 store 액션으로 얇게 래핑, 프레임워크 결합 최소 |
| 렌더링 | **React Three Fiber + drei**, Orthographic 카메라 | 옵션 A. 렌더 계층은 인터페이스로 추상화 → 2D 폴백 가능 |
| 에셋 | **glTF + Draco 압축**, lazy load, 런타임 머티리얼 recolor | 웹 표준·GLTFLoader 직접 호환, 프리로드 ≤5종 |
| 애니메이션 | tween(150–250ms), `status` 상태머신으로 입력 게이팅 | 즉각 반응+인지 균형, 겹침 버그 차단 |
| 저장소 | **localStorage** (진행/클리어/최소이동 기록) | 서버리스 클라이언트 완결형에 충분 |
| 퍼즐 데이터 | **JSON**(game-systems-designer 스키마 그대로 초기 상태로 로드) | 로직-데이터 분리, solver 포맷 일치 |
| 테스트 | **Vitest** (순수 로직 100% 커버리지) | UI 없이 canMove/maxSlide/applyMove/isSolved/validatePlacement 단위 검증 |
| 배포 | **Vercel/Netlify 정적 호스팅** | 서버 불필요, glTF는 CDN 정적 서빙 |

**아키텍처 3계층 (엄격 분리):**
1. **Logic(순수/프레임워크 무관):** `engine/` — 위 모델·함수 전부. 부작용 0, 100% 테스트.
2. **State(Zustand):** `store/` — logic 함수 호출 + `status` 상태머신 + localStorage 영속화. DOM/픽셀을 상태 소스로 절대 쓰지 않음(핵심 실패 패턴 회피).
3. **Render/Input(React+R3F):** `render/` — store 구독해 그리기만. 입력은 store 액션 dispatch. **렌더가 상태를 만들지 않고 반영만.**

입력 UX: 차량 탭 → 방향 화살표, 또는 드래그(포인터를 `maxSlide` 허용 범위로 클램프 후 릴리스 시 스냅). 드래그 중에도 논리 상태는 불변, 릴리스에서만 `applyMove`.

**퍼즐 JSON 스키마 — game-systems-designer의 스키마를 그대로 채택(정합 확정).** 와이어 포맷은 디자이너 §3-2 (`board:{w,h,exit:{side:N/E/S/W, index}}`, 차량 `{id,x,y,len,dir:H/V,isTarget,type}`, `meta.minMoves/solution/...`)을 canonical로 쓴다. 내 로직 타입(§0)은 로드 시 **얇은 어댑터**로 1:1 매핑한다 — 필드 대응은 `x→col, y→row, len→length, dir→orientation, exit.side E/W/N/S→exitSide right/left/top/bottom, exit.index→exitRow(E/W)|exitCol(N/S)`. 로직은 `type`(에셋 매핑용)을 무시하고 `len`만 사용하므로 확장 차량 추가 시 규칙 로직 무변경(디자이너 §3-3과 정합). 별도 자체 스키마를 두지 않는다(중복/드리프트 방지).

**이동수 카운트 규약 정합(디자이너 계약 수용):** ThinkFun 규약 = "한 차량을 한 방향으로 슬라이드 = 1수(칸수 무관)". 내 `applyMove`는 호출 1회당 `moveCount +1`(steps 무관)로 이미 이 규약과 일치. 드래그 1제스처 = 1 `applyMove` = 1수로 UI/solver/해법표시 카운트를 통일한다.

### 미해결 / 리스크
- **Kenney glTF 실제 축/원점/스케일 미확인** — 모델별 로컬 원점이 중심이 아닐 수 있어 셀 정렬 시 오프셋 보정 로직 필요할 수 있음(실제 에셋 로드 후 검증 필요).
- **three.js 번들 무게** — 코드 스플릿으로 격리하되, 3G/저사양에서 초기 3D 청크 로딩 지연 가능. 실측 후 필요 시 옵션 B 폴백.
- **isSolved 규칙 컨벤션** — "경로 클리어 시 자동 슬라이드 승리" vs "가장자리 도달 시 승리" 중 최종안은 디자이너/기획 합의 필요(둘 다 한 줄로 전환 가능하게 설계함).
- **드래그 입력의 터치 정밀도** — 모바일에서 셀 스냅 임계값 튜닝 필요(사용성 테스트 대상).
- **가변 보드 크기** — 로직은 rows/cols 파라미터화로 이미 지원. 카메라 프러스텀·직교 스케일을 보드 크기에 맞춰 자동 fit하는 처리 필요.
- **실행 검증 한계(솔직)** — 본 설계는 코드로 실행 검증하지 않은 설계 단계 산출물. 로직 함수는 자기완결적이라 Vitest로 즉시 검증 가능하게 작성했으나, 실제 프로젝트 스캐폴딩·에셋 로드·60fps 실측은 구현 단계에서 확인 요망.

---

## 2026-07-21 20:45 — critic: 독립 검증 리포트

> Critic 원칙: 동의는 검증이 아니다. 두 문서가 "정합 확정"이라 각자 서술한 계약을 **믿지 않고 문자 그대로 나란히 대조**하는 것에서 시작. 반박 시나리오 우선, 심각도 등급화, 각 반박에 대안 첨부.

### 검증 요약
- 전체 신뢰도: **중간** (설계 골격은 견고하나, "정합 확정" 주장 뒤에 미봉합 계약 2건 + 미대응 법적 리스크 1건)
- 치명적(구현 즉시 붕괴) 리스크: **0건 확인함.** 두 문서의 핵심 알고리즘(순수함수 이동검증/충돌/승리, BFS 난이도)은 논리적으로 성립.
- 단, **미대응 법적 리스크 1건(상표명)** 과 **미봉합 정합 계약 2건(exit 슬라이드 카운트·solution 부호)** 존재 — 방치 시 스코어링/힌트 기능과 출시 네이밍에서 실제 결함으로 발현.

### 정합성 문자 대조 (두 문서가 "맞췄다"고 주장한 계약 7항목)
| # | 계약 항목 | 디자이너 표기 | 아키텍트 표기 | 판정 |
|---|----------|--------------|--------------|------|
| 1 | 좌표계 | `x=col, y=row` 0-index | `row/col`, 어댑터 `x→col,y→row` | ✅ 일치 |
| 2 | 이동수 규약 | 1차량 1방향 슬라이드=1수(칸수 무관) | `applyMove` 호출당 `+1`(steps 무관) | ✅ 일치 |
| 3 | board 파라미터 | `{w,h,exit:{side,index}}` | `{rows,cols,exit*}`, 어댑터 `w→cols,h→rows` | ✅ 일치 |
| 4 | exit.side 표기 | `E/W/N/S`(나침반) | `right/left/top/bottom` | ⚠️ **명목상 불일치이나 아키텍트가 어댑터 명시로 처리** (E→right/W→left/N→top/S→bottom, y-down 기준 정합). 카드가 우려한 "즉시 깨짐"은 아님. 단 프로즈 온리·미테스트·단방향·디자이너측 미승인 |
| 5 | 차량 필드 | `{len,dir,type}` | `{length,orientation,modelKey?}` | ⚠️ 로직 필드는 어댑터로 일치. **`type`→`modelKey` 렌더 매핑은 미명시** (경미) |
| 6 | **exit 슬라이드 카운트** | solver가 목표차 탈출을 1수로 셈 (solution 종단 `X+4`) | `isSolved`는 경로 클리어 순간 승리 + **무카운트** 자동 슬라이드-아웃 | ❌ **불일치·미봉합** |
| 7 | **solution 배열 부호(+/-) 방향** | `["A+1","T1-2","X+4"]` — 부호 의미 정의 없음 | `Axis1` H→(+右/−左) V→(+下/−上) | ❌ **미정의·미봉합** |

→ 5개 이상 대조 KPI 충족. **결정적으로, 두 문서가 "정합 확정"이라 서술했음에도 #6·#7은 실제로 봉합되지 않았다.** 두 전문가가 각자 상대 스키마를 "채택했다"고 선언한 것이 곧 두 move-model이 호환된다는 뜻은 아니다.

### 동의하는 부분 (근거 포함)
- **로직-렌더 분리 + 순수함수/불변상태 (아키텍트 §0~3):** DOM을 상태 소스로 쓰지 않는 원칙, `maxSlide`의 swept-path 검사(엔드포인트만 보는 흔한 버그를 구조적으로 회피), 직선이동을 `dir:Axis1` 타입으로 강제하는 설계 — 모두 견고. Vitest 100% 커버 목표 타당.
- **충돌감지를 매 프레임 전수순회 대신 이동 시점 점유 Set `has()`로 처리 (§2):** 60fps 방어 근거로 합당.
- **클라이언트 solver 미탑재 + 오프라인 생성→뱅크 적재 (디자이너 §3):** 6×6에서도 BFS는 <200ms지만, 가변/대형 보드 확장을 고려하면 solver를 데이터 파이프라인으로 격리한 결정은 방향성 옳음.
- **"유일해 100%"의 문자적 비현실성 지적 + 재정의 제안을 승인요청으로 라우팅한 것 (디자이너 한계 §1):** 스텔스 변경이 아니라 "(팀장 승인 필요)"를 명시 — 절차적으로 정직함.
- **Kenney CC0 라이선스:** 리서치대로 상업적 자유이용·크레딧 불요. 에셋 법적 리스크 낮음. (이 부분은 문제 없음을 명시 확인.)
- **hybrid 보드(로직 가변 + UI/뱅크 6×6 우선):** 하드코딩 재작업 리스크를 스키마에서 선제 차단하면서 초기 범위를 좁힌 트레이드오프 합리적.

### 반박 / 약점
- **[주의] exit 슬라이드 카운트 불일치 — par/별점 오차 + 힌트 재생 불가 (대조 #6).**
  디자이너 solver의 `minMoves`는 목표차가 판을 빠져나가는 마지막 슬라이드를 1수로 포함한다(예시 solution 종단 `X+4`). 그러나 아키텍트 `isSolved`는 "전방→출구 경계 경로가 비는 순간" true가 되어, 마지막 목표차 이동 없이 SOLVED로 전이하고 무카운트 자동 애니메이션을 재생한다. 결과: 최적 플레이 시 플레이어 `moveCount = minMoves − 1`. "par 14인데 나는 13에 풀었다" 식 라벨-체감 불일치가 상시 발생하고, 별점/최소이동 기록 KPI가 어긋난다. 게다가 **아키텍트 `maxSlide`는 경계 밖(`c>=cols`)에서 break하므로 목표차를 판 밖으로 미는 이동을 애초에 실행할 수 없다** → 디자이너 `solution`의 종단 이동(`X+4`)은 `applyMove`로 재생 불가 → 힌트/정답재생 기능이 마지막 스텝에서 깨진다.
  - 대안: "exit 이동"의 canonical 정의를 단일화. 권장안 — solver도 `isSolved`도 **"경로 클리어 = 승리, 최종 슬라이드-아웃은 카운트하지 않음"** 으로 통일하고 solver의 `minMoves`·`solution`에서 종단 목표차 이동을 제거(둘 다 −1 정규화). 또는 반대로 `applyMove`가 목표차에 한해 판 밖 이동을 허용하고 그 이동을 카운트. 어느 쪽이든 **두 팀이 같은 정의를 문서에 못박아야** 함. 아키텍트가 "엄격판 한 줄 전환 가능"이라 적었으나, 이는 카운트 규약까지 자동 정렬해주지 않는다.

- **[주의] solution 부호(+/-) 방향 규약 미정의 (대조 #7).**
  디자이너 `solution:["A+1","T1-2","X+4"]`에서 `+`/`-`의 의미(H차의 +는 오른쪽? V차의 +는 아래?)가 디자이너 문서에 정의되지 않았다. 아키텍트는 `Axis1`을 H→(+오른쪽/−왼쪽), V→(+아래/−위)로 정의했으나 **이건 아키텍트 내부 규약일 뿐 디자이너 solver 출력이 이를 따른다는 보장이 없다.** 힌트 재생기가 부호를 반대로 해석하면 차를 반대로 밀어 즉시 불법상태.
  - 대안: solution 토큰 문법을 스키마에 명문화 — `<id><+/-><steps>`, 부호는 "orientation 축의 증가 방향이 +"(H:+=col증가=오른쪽, V:+=row증가=아래)로 아키텍트 `Axis1`과 일치시켜 고정. 디자이너 오프라인 solver가 이 규약으로 emit하도록 계약 추가.

- **[주의] "Rush Hour" 상표 — 두 문서 모두 제품 네이밍/상표 리스크 미언급.**
  "Rush Hour"는 ThinkFun의 등록상표다. 디렉터리명이 `rushhour`이고 어느 문서도 출시 제품명을 오리지널로 바꾸라고 명시하지 않았다. 게임 **규칙(직선 슬라이드 퍼즐)은 저작권/특허 대상이 아니어서 자유 구현 가능**하지만, 상표명을 제품명·UI·스토어 리스팅에 쓰면 상표권 리스크. 또한 ThinkFun 정규 40장의 **정확한 차량 배치를 시드로 그대로 내장**하면 퍼즐 컴필레이션 복제 논란 소지(디자이너가 "시드/Expert용 큐레이션"이라 적었는데 그 시드가 ThinkFun 배치면 위험).
  - 대안: 제품명은 "슬라이드 러시", "Gridlock", "Traffic Jam Puzzle" 등 오리지널로. 시드 퍼즐은 ThinkFun 카드 복제 대신 자체 절차생성분을 사용하거나, 공개된 CC/퍼블릭도메인 배치만 채택. UI 카피에서 "Rush Hour" 문자열 배제.

- **[주의] 3D 60fps 주장에서 실시간 그림자 비용 누락.**
  아키텍트는 "무료 라이팅/그림자로 고급스러운 룩" + "중급 모바일도 60fps 여유"를 함께 주장하나, **모바일 GPU에서 실시간 shadow map은 '무료'가 아니다** — 저사양/중급 모바일에서 그림자맵 렌더는 프레임 예산을 크게 먹는다. 게다가 three.js+R3F+drei+Draco WASM 디코더까지 합치면 3D 청크는 "~150KB gzip"보다 실제로 크다(체감 200~300KB+ 및 WASM 디코드 지연).
  - 대안: 초기엔 그림자 비활성 또는 baked/blob 그림자로 대체, 실시간 그림자는 데스크탑 한정 opt-in. 번들은 실측 후 판단하되 아키텍트가 이미 설계한 렌더 인터페이스 추상화(옵션 B 2D 폴백)를 저사양 실측 게이트와 연결.

- **[경미] 애니메이션 중 입력 차단의 사용자 피드백 UX 공백.**
  `status==='ANIMATING'`에서 입력을 게이팅하는 상태머신은 옳으나, 차단된 탭/드래그를 사용자에게 어떻게 알릴지(또는 마지막 입력을 버퍼링할지)가 미설계. 빠른 연속 조작 시 입력이 조용히 소실되어 "반응 안 함" 체감. `applyMove`가 불법 이동에 상태 불변 반환하는 경로도 무피드백.
  - 대안: (a) ANIMATING 중 마지막 입력 1개를 큐잉해 완료 후 소비, 또는 (b) 애니 tween을 150ms 이하로 짧게 + 진행 중 대상차 하이라이트로 "처리 중" 시각 신호. 불법 이동은 살짝 흔들림(shake) 마이크로 피드백.

- **[경미] "다중도 제약" 재정의 자체는 타당하나 팀장의 실제 결정이 남았고, 제품감 변경을 수반.**
  디자이너의 재정의(등급별 최소해 다중도 상한)는 슬라이딩블록 퍼즐 특성상 구조적으로 옳다(여분 이동으로 대체경로가 거의 항상 존재 → 문자적 "유일해"는 불가능). 그러나 이는 "각 퍼즐에 사실상 하나의 정해진 풀이"라는 원 KPI 취지를 **easy 등급에서 다중해 허용으로 완화**하는 제품 의사결정이다.
  - 대안: 팀장이 러버스탬프가 아니라 명시적으로 승인하되, "유일 최소해(다중도=1)"를 Advanced/Expert 필수조건으로 두고 하위 등급만 상한 완화하는 절충안을 옵션으로 제시. 원 요청자가 "결정론적 퍼즐"을 의도했는지 확인 권장.

### 미검증 가정
- **가정 1 (아키텍트):** "저폴리 16대 + 직교 카메라 = 중급 모바일 60fps." → 실측 없음. 검증: 실제 Kenney glTF 16대 + 그림자 on/off 조건으로 중급 안드로이드(예: 스냅드래곤 6xx급)에서 프레임 측정.
- **가정 2 (아키텍트):** "three.js 3D 청크 ~150KB gzip." → Draco WASM·drei 포함 시 과소추정 가능. 검증: 실제 프로덕션 번들 분석(`vite build` + bundle analyzer).
- **가정 3 (디자이너):** "6×6 BFS 상태공간 수천~수만, <200ms." → 대략 타당하나(고정 6×6은 PSPACE와 무관, 도달 상태 유한) 최난도(51수급) 배치의 도달 상태 그래프는 수만~10만+까지 갈 수 있음. 검증: 최난도 시드로 BFS 노드수·시간 실측. 다중도(`solutionPaths`) 카운트는 최단경로 수가 지수적으로 커질 수 있어 별도 상한/오버플로 처리 필요.
- **가정 4 (디자이너):** "역방향 생성이 목표 난이도 분포를 효율적으로 채운다." → 디자이너 스스로 편향 가능성 인정. 검증: 파일럿 배치 생성 후 등급별 수율 측정.
- **가정 5 (양측):** "어댑터 계층으로 스키마 차이가 무해하게 흡수된다." → 어댑터는 프로즈로만 존재, 단방향(wire→로직), 미테스트. 검증: 어댑터를 단일 모듈로 구현 + 라운드트립(wire→logic→wire) 및 solution 부호 재생 유닛테스트.

### 엣지케이스 시나리오
1. **최적 플레이 종료 순간:** 경로가 클리어되는 blocker 이동으로 `isSolved`가 즉시 true → 목표차가 판 좌측 끝에 있어도 승리. moveCount는 minMoves−1. (반박 #6 발현)
2. **힌트 마지막 스텝:** solution 종단 `X+4`를 재생하려 하면 `maxSlide`가 경계에서 막아 `applyMove` no-op → 힌트가 마지막에 멈춤. (반박 #6)
3. **부호 반대 solver:** 오프라인 solver가 V차 `+`를 "위"로 emit했는데 클라가 "아래"로 해석 → 힌트가 차를 반대로 밀어 불법/겹침. (반박 #7)
4. **목표차 2대 이상/0대 데이터:** `validatePlacement`는 target ≥1만 검사(정확히 1대 미검증), `isSolved`는 `find` 첫 target만 사용 → 2대면 미정의 거동.
5. **로드 즉시 승리 데이터:** 목표차 전방이 이미 비어 있는 배치를 런타임 로드하면 즉시 SOLVED. 생성 필터의 non-triviality가 못 걸러낸 오염 데이터/수기 편집 데이터에서 발생. `validatePlacement`에 승리상태 거부 없음.
6. **exit index 경계 오류:** `exitRow >= rows` 같은 잘못된 board 데이터에 대한 검증 없음 → 승리 판정 루프가 빈 범위로 항상/never true.
7. **저장 스키마 드리프트:** localStorage 진행/기록에 퍼즐뱅크 버전/스키마 버저닝 없음 → 뱅크 갱신 시 저장된 인덱스·기록 오염.
8. **가변 보드 카메라 fit 미구현:** 로직은 rows/cols 파라미터화됐으나 직교 카메라 프러스텀 자동 fit은 "필요"로만 언급 → 8×8 로드 시 화면 잘림/오정렬.
9. **glTF 원점 오프셋:** 모델 로컬 원점이 중심이 아니면 셀 정렬 어긋남(아키텍트 자가 flag) → 차량이 셀 경계에서 반칸 밀림.
10. **접근성/키보드:** 3D canvas는 스크린리더 비접근·키보드 조작 미설계 → 웹 게임 접근성 공백(WCAG). 입력이 탭/드래그 전제.

### 권장 조치
- **즉시 (출시 전 반드시):**
  1. **exit 슬라이드 카운트 규약 단일화** — solver `minMoves`/`solution` 종단 이동 포함 여부와 `isSolved` 승리시점·`applyMove` 목표차 판밖이동 허용을 한 정의로 못박고 양 문서에 반영. (반박 #6)
  2. **solution 토큰 문법 + 부호 방향을 스키마에 명문화**, 어댑터를 단일 모듈로 구현하고 라운드트립·힌트재생 유닛테스트 추가. (반박 #7, 미검증 가정 5)
  3. **제품명을 오리지널로 확정**하고 UI/스토어에서 "Rush Hour" 상표 배제, 시드 퍼즐은 ThinkFun 배치 복제 회피. (반박 #3-법적)
  4. **"유일해→다중도 제약" 재정의를 팀장이 명시적으로 승인/수정** (러버스탬프 금지, 원 요청 의도 확인).
- **후속 (구현/베타 단계):**
  5. 그림자 off 기준 + 실제 Kenney 에셋으로 중급 모바일 60fps·번들 크기 실측, 미달 시 2D 폴백 게이트. (반박 4·미검증 1·2)
  6. 애니메이션 중 입력 버퍼링 또는 처리중 시각피드백 추가. (반박 5)
  7. `validatePlacement` 강화 — target 정확히 1대, 로드-즉시-승리 거부, exit index 경계 검증. (엣지 4·5·6)
  8. localStorage 스키마 버저닝, 가변보드 카메라 fit, glTF 원점 보정, 키보드/접근성 대안 입력. (엣지 7·8·9·10)

---

# DEAD_ENDS (시도했으나 실패한 접근)

(아직 없음)
