---
name: kenney-asset-pipeline
description: "Kenney Car Kit(glTF, CC0) 에셋을 무빌드 바닐라 JS 웹 게임에 통합하는 절차. CDN importmap 기반 three.js 로딩, 직교 카메라 탑다운 설정, 런타임 머티리얼 recolor로 색상 변형, 지연 로딩. 'Kenney 에셋', '차량 모델 로드', '직교 카메라', '색상 변형', 'glTF 통합', '3D로 바꿔줘' 요청 시 사용."
---

# Kenney Car Kit 통합 절차

Kenney Car Kit은 3D 전용(glTF/OBJ/FBX, CC0 라이선스)이며 2D 스프라이트를 제공하지 않는다. 탑다운 보드게임에 쓰려면 직교 카메라로 원근 왜곡 없이 렌더링해야 그리드와 정확히 정렬된다.

## 0. 착수 전 확인 (무빌드 제약)
이 프로젝트는 번들러 없는 정적 사이트(바이브코딩 게임 스터디 CLAUDE.md 규약)다. three.js는 npm 패키지를 그대로 쓰지 않고 **CDN + `<script type="importmap">`** 으로 로드한다:
```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.169.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.169.0/examples/jsm/"
  }
}
</script>
```
이러면 `gridlock/game.js`처럼 `import * as THREE from 'three'`를 브라우저가 직접 처리한다. 이 방식이 부담스럽거나(오프라인 개발, CDN 장애 리스크) 셰이더/후처리까지 필요해지면 빌드 도구 재도입이 필요할 수 있다 — 착수 전 반드시 사용자에게 이 트레이드오프를 확인한다.

## 1. 다운로드/배치
- https://kenney.nl/assets/car-kit 에서 glTF 포맷 번들을 받아 `gridlock/assets/car-kit/`에 배치 (CC0 — 크레딧 의무 없음, 저장소에 커밋 가능)
- Draco 압축이 적용된 버전이 있으면 우선 사용하되, DracoLoader도 importmap의 `three/addons/`에서 로드

## 2. glTF 로딩
`GLTFLoader`(three/addons/loaders/GLTFLoader.js)로 모델을 로드하고, **현재 퍼즐에 실제로 필요한 색상/타입만** 로드한다. 40여 종을 전부 프리로드하면 초기 로딩이 느려진다 — 프리로드 5종 이하를 유지한다.

## 3. 직교 카메라 설정
`THREE.OrthographicCamera`를 보드 정중앙 위에서 수직으로 내려다보게 배치한다. 카메라의 절두체 크기는 `game.board.rows/cols`에서 계산해 가변 보드에서도 전체 보드가 프레임에 들어오도록 한다 — 6을 하드코딩하지 않는다.

## 4. 런타임 recolor
모델의 바디 머티리얼을 `material.clone()`한 뒤 `material.color.set(hexColor)`로 색을 바꾼다. 이렇게 하면 모델 1개(sedan.glb)로 여러 색상 차량(빨강/파랑/노랑…)을 표현할 수 있어, 색상별로 별도 glTF 파일을 만들 필요가 없다. vehicle.modelKey에서 "타입-색상"(예: "sedan-red")을 파싱해 베이스 모델 + 색상을 결정한다.

## 5. 좌표 매핑
GameState의 (row, col)을 3D 월드 좌표로 변환할 때 셀 크기 상수(예: 1 unit/cell)를 명확히 정의하고, 차량의 orientation(H/V)에 따라 모델을 90도 회전시킨다. `gridlock/game.js`의 기존 `cellPx`/좌표 계산 로직과 동일한 기준(board.rows/cols)을 공유한다.

## 6. 저사양 폴백
초기 그림자는 끄고 시작한다. 실제 기기에서 60fps가 확인되면 그림자를 옵션으로 켠다. 렌더링 함수는 게임 상태 읽기 전용으로 유지해, 성능 문제 시 기존 Canvas 2D 구현으로 되돌릴 수 있게 한다.
