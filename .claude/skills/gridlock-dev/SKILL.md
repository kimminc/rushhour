---
name: gridlock-dev
description: "Gridlock(러시아워 웹 클론, devgame/rushhour) 프로젝트의 개발 작업을 조율하는 오케스트레이터. 3D 렌더링/Kenney 에셋 통합, 퍼즐 생성 파이프라인/난이도 튜닝, 경계면 QA 관련 요청 시 사용. 예: '차량 3D로 렌더링해줘', 'Kenney 에셋 붙여줘', '퍼즐 더 만들어줘', '난이도 보정해줘', '경계면 검증해줘', 'QA 돌려줘'. 후속 작업(다시 실행, 수정, 보완, 업데이트, 퍼즐 일부만 다시 생성, 렌더링 성능 개선, 이전 결과 기반으로 개선)에도 반드시 이 스킬을 사용한다."
---

# Gridlock Dev Orchestrator

Gridlock 프로젝트(러시아워 웹 클론)의 남은 개발 작업 — 3D 렌더링/에셋 통합, 퍼즐 생성 파이프라인, 경계면 QA — 을 전문 에이전트에게 배분하고 조율하는 오케스트레이터.

## 실행 모드: 하이브리드

| 상황 | 모드 | 이유 |
|------|------|------|
| 단일 도메인 작업 (렌더링만, 퍼즐 생성만) | 서브 에이전트 (전문가 풀) | 팀 통신 오버헤드 없이 필요한 전문가만 호출 |
| 크로스커팅 변경 (스키마 필드 변경이 로직+렌더 양쪽에 영향) | 에이전트 팀 | 실시간 조율 필요, 한쪽 변경이 다른 쪽에 미치는 영향을 즉시 논의 |
| 모든 작업 완료 직후 | QA는 항상 서브 에이전트로 즉시 호출 (incremental QA) | 전체 완성 후 1회가 아니라 모듈 단위로 바로 검증 — 버그 누적 방지 |

## 에이전트 구성

| 에이전트 | 커스텀 타입 | 역할 | 스킬 |
|---------|-----------|------|------|
| renderer-engineer | `.claude/agents/renderer-engineer.md` | 3D/렌더링, Kenney 에셋 통합 | kenney-asset-pipeline |
| puzzle-pipeline-engineer | `.claude/agents/puzzle-pipeline-engineer.md` | 퍼즐 생성/난이도 파이프라인 | puzzle-generation-pipeline |
| qa-integration-agent | `.claude/agents/qa-integration-agent.md` (general-purpose 타입) | 경계면 정합성 검증 | boundary-consistency-check |

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

1. `_workspace/` 디렉토리 존재 여부 확인 (프로젝트 루트 기준)
2. 판별:
   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
   - **`_workspace/` 존재 + 부분 수정 요청** ("퍼즐만 더", "렌더링 성능만") → 부분 재실행. 해당 에이전트만 재호출
   - **`_workspace/` 존재 + 새로운 큰 요청** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 Phase 1
3. 부분 재실행 시 이전 산출물 경로를 에이전트 프롬프트에 포함해 기존 결과를 읽고 이어가도록 지시

### Phase 1: 요청 분류

사용자 요청을 다음 셋 중 하나로 분류한다:
- **단일 도메인**: "3D 렌더링", "Kenney 에셋" 류 → renderer-engineer만 / "퍼즐 생성", "난이도" 류 → puzzle-pipeline-engineer만
- **크로스커팅**: 데이터 스키마 필드 추가/변경처럼 로직·렌더 양쪽에 영향을 주는 요청, 또는 사용자가 명시적으로 "전체적으로", "한번에" 등을 언급
- **QA 전용**: "경계면 검증해줘", "정합성 확인" 류 → qa-integration-agent만 (생산 에이전트 호출 없이 검증만)

`_workspace/00_input/request.md`에 원본 요청과 분류 결과를 기록한다.

### Phase 2A: 단일 도메인 — 서브 에이전트 모드

**실행 모드:** 서브 에이전트

```
Agent({
  name: "{선택된 에이전트명}",
  subagent_type: "{선택된 에이전트명}",
  model: "opus",
  prompt: "[사용자 요청 요약] + 관련 산출물 경로(_workspace/ 존재 시) + '완료 후 변경한 파일 목록을 보고하라'",
  run_in_background: false
})
```

작업 완료 후 즉시 Phase 3(QA)로 진행한다 — 결과를 사용자에게 보고하기 전에 QA를 항상 거친다.

### Phase 2B: 크로스커팅 — 에이전트 팀 모드

**실행 모드:** 에이전트 팀

1. 팀 생성:
   ```
   TeamCreate(
     team_name: "gridlock-dev-team",
     members: [
       { name: "renderer-engineer", agent_type: "renderer-engineer", model: "opus", prompt: "..." },
       { name: "puzzle-pipeline-engineer", agent_type: "puzzle-pipeline-engineer", model: "opus", prompt: "..." },
       { name: "qa-integration-agent", agent_type: "qa-integration-agent", model: "opus", prompt: "..." }
     ]
   )
   ```
2. `TaskCreate`로 작업 등록. 스키마 변경처럼 순서가 있는 작업은 `depends_on`으로 명시 (예: 렌더링 작업은 스키마 변경 작업에 의존)
3. 팀원들이 자체 조율: renderer-engineer/puzzle-pipeline-engineer가 모듈을 완성하면 즉시 qa-integration-agent에게 SendMessage로 알리고, qa-integration-agent는 완성 직후 해당 모듈만 검증(incremental QA) — 전체 완료까지 기다리지 않는다
4. 리더(오케스트레이터)는 TaskGet으로 진행 상황을 모니터링하고, 팀원 유휴 알림 수신 시 개입

**산출물 저장:** `_workspace/{phase}_{agent}_{artifact}.md`

### Phase 3: QA (모든 경로 공통, 생략 불가)

**실행 모드:** 서브 에이전트 (단일 도메인/크로스커팅 모두 최종적으로 이 단계를 거침 — 크로스커팅은 팀 내 QA 팀원이 이미 incremental로 수행했다면 최종 통합 검증만 추가로 수행)

```
Agent({
  name: "qa-integration-agent",
  subagent_type: "qa-integration-agent",
  model: "opus",
  prompt: "boundary-consistency-check 스킬을 사용해 [변경된 영역]의 경계면 정합성을 검증하라. npm run test와 각 파일 node --check를 실제로 실행해 회귀 여부를 확인하라 (이 프로젝트는 빌드 단계가 없다).",
  run_in_background: false
})
```

QA 리포트에 "치명" 등급 항목이 있으면 해당 에이전트에게 수정을 재요청한다 (1회 재시도).

### Phase 4: 통합 및 사용자 보고

1. 변경된 파일 목록 수집 (renderer-engineer/puzzle-pipeline-engineer 반환값 + QA 리포트)
2. `_workspace/` 보존 (중간 산출물 삭제 안 함 — 사후 추적용)
3. 하네스 구성/에이전트/스킬 자체가 변경된 경우(신규 에이전트 추가 등) `CLAUDE.md` 변경 이력에 기록
4. 사용자에게 요약 보고: 무엇을 했는지, QA 결과, 남은 리스크

### Phase 5: 정리 (에이전트 팀 모드로 진행한 경우)

1. 팀원들에게 종료 요청 (SendMessage)
2. `TeamDelete`
3. `_workspace/` 보존

## 데이터 흐름

```
[사용자 요청]
   → Phase 1 분류
   → Phase 2A(서브) 또는 2B(팀)
   → 산출물 → _workspace/
   → Phase 3 QA (항상 실행)
   → Phase 4 통합 보고
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 에이전트 실패/중지 | 1회 재시도. 재실패 시 사용자에게 알리고 진행 여부 확인 |
| QA가 치명 등급 발견 | 담당 에이전트에게 파일:라인 단위 수정 재요청 (1회), 그래도 실패하면 미해결로 보고 |
| 팀원 유휴 2회 연속 | 리더가 SendMessage로 진행 확인 |
| 팀원 유휴 3회 연속 | 리더가 교체 또는 작업 재배정 |
| npm run test / build 실패 | QA가 즉시 "치명"으로 분류, 통과 전까지 완료 처리 금지 |

## 테스트 시나리오

### 정상 흐름 (단일 도메인)
1. 사용자: "Kenney 에셋으로 3D 렌더링 붙여줘"
2. Phase 1: 단일 도메인(렌더링)으로 분류
3. Phase 2A: renderer-engineer 서브 에이전트 호출, kenney-asset-pipeline 스킬 활용
4. Phase 3: qa-integration-agent가 boundary-consistency-check로 렌더-로직 경계 검증 + npm run test/build 실행
5. Phase 4: 결과 요약 보고 (변경 파일, QA 통과 여부)

### 에러 흐름
1. 사용자: "퍼즐 데이터 스키마에 필드 추가하고 렌더링도 반영해줘" (크로스커팅)
2. Phase 2B: 팀 구성, puzzle-pipeline-engineer가 스키마 변경 → renderer-engineer가 반영 시도 중 필드명 불일치로 에러
3. renderer-engineer가 SendMessage로 puzzle-pipeline-engineer에게 확인 요청
4. qa-integration-agent가 incremental QA에서 불일치를 재확인, 양쪽에 구체적 수정안 전달
5. 재수정 후 npm run test/build 통과 확인, Phase 4 진행
6. 최종 보고서에 "1차 시도에서 필드명 불일치 발견 → 수정 후 통과" 명시
