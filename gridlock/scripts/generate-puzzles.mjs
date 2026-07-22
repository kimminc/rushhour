/**
 * 스테이지 3~10 퍼즐 생성기 (오프라인 전용).
 *
 * 설계 원칙 (이전 generate-levels-v4.mjs 버그 수정):
 *   이전 스크립트는 블로커 개수별로 "베이스 보드를 하나만" 만들고, 그 보드의 도달 가능
 *   상태 그래프(BFS)에서 서로 다른 depth의 상태를 여러 스테이지에 나눠 배분했다. 그래서
 *   스테이지 6~10이 시각적으로 거의 동일했다. 여기서는 그 방식을 버리고, **스테이지마다
 *   완전히 독립적으로 랜덤 생성한 베이스 보드**를 그대로 퍼즐로 쓴다. 어떤 두 스테이지도
 *   같은 베이스 보드에서 파생되지 않는다.
 *
 * 절차:
 *   1) 수백 개의 서로 독립적인 랜덤 조밀 보드를 생성한다 (각각 X + 랜덤 블로커들).
 *   2) 각 보드를 solve()로 풀어 실제 minMoves를 얻는다 (추정 없음).
 *   3) solvable + 비자명(minMoves>=4)인 후보를 minMoves별로 버킷에 모은다.
 *   4) 낮은→높은 minMoves로 고르게 퍼지는 8개 값을 고르고, 각 값마다 후보 보드 1개를
 *      뽑는다. 뽑힌 8개는 서로 다른 랜덤 생성 결과이므로 배치가 겹치지 않는다.
 *   5) 배치 서명(정렬된 차량 좌표)으로 8개가 실제로 서로 다른지 재확인한다.
 *
 * 실행: node gridlock/scripts/generate-puzzles.mjs
 * 출력(stderr): 생성 로그 / 출력(stdout): puzzles.js에 붙일 stagePuzzles JS 조각
 */
import { solve } from '../logic/solver.js'
import { isSolved } from '../logic/win.js'

const ROWS = 6, COLS = 6, EXIT_ROW = 2

// 타겟(sedan-red)을 제외한 15종 팔레트. 짧은차/긴차로 분리.
const CAR_COLORS = [
  'suv-blue', 'sedan-yellow', 'sedan-purple', 'sedan-green', 'sedan-orange',
  'sedan-pink', 'sedan-teal', 'sedan-white', 'sedan-brown', 'sedan-navy', 'sedan-lime',
]
const LONG_TYPES = ['truck-green', 'truck-amber', 'bus-yellow', 'bus-mint']

// ---- 시드 RNG (재현 가능하도록 mulberry32) ----
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const SEED = Number(process.argv[2] ?? 20260722)
const rng = mulberry32(SEED)
function randInt(n) { return Math.floor(rng() * n) }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1);[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// ---- 로직 상태(row/col) 헬퍼 ----
function cellsOf(v) {
  const cells = []
  for (let i = 0; i < v.length; i++) {
    const row = v.orientation === 'V' ? v.row + i : v.row
    const col = v.orientation === 'H' ? v.col + i : v.col
    cells.push(row * COLS + col)
  }
  return cells
}
function overlaps(vehicles, candidate) {
  const occ = new Set()
  for (const v of vehicles) for (const c of cellsOf(v)) occ.add(c)
  for (const c of cellsOf(candidate)) if (occ.has(c)) return true
  return false
}
function emptyState() {
  return { board: { rows: ROWS, cols: COLS, exitRow: EXIT_ROW, exitCol: 0, exitSide: 'right' }, vehicles: [], status: 'IDLE', moveCount: 0 }
}

function tryPlace(vehicles, id, length, type) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const orientation = rng() < 0.5 ? 'H' : 'V'
    let row, col
    if (orientation === 'H') { row = randInt(ROWS); col = randInt(COLS - length + 1) }
    else { row = randInt(ROWS - length + 1); col = randInt(COLS) }
    const candidate = { id, row, col, length, orientation, isTarget: false, modelKey: type }
    if (!overlaps(vehicles, candidate)) { vehicles.push(candidate); return true }
  }
  return false
}

/** 완전히 독립적인 랜덤 조밀 보드 1개 생성. */
function generateBoard(numBlockers, maxLong) {
  const state = emptyState()
  // 타겟 X: row=2(출구축), 길이 2, 시작 col 0..3 (col=4면 이미 풀린 상태이므로 제외)
  const startCol = randInt(4)
  state.vehicles.push({ id: 'X', row: EXIT_ROW, col: startCol, length: 2, orientation: 'H', isTarget: true, modelKey: 'sedan-red' })
  const carPool = shuffle(CAR_COLORS)
  const longPool = shuffle(LONG_TYPES)
  let carIdx = 0, longIdx = 0, longCount = 0
  for (let i = 0; i < numBlockers; i++) {
    const isLong = longCount < maxLong && rng() < 0.3
    const length = isLong ? 3 : 2
    const type = isLong ? longPool[longIdx++ % longPool.length] : carPool[carIdx++ % carPool.length]
    if (tryPlace(state.vehicles, 'V' + i, length, type)) {
      if (isLong) longCount++
    }
  }
  return state
}

/** 배치 서명: 타겟 포함 모든 차량의 (type,row,col,len,dir) 정렬 문자열. */
function signature(vehicles) {
  return vehicles
    .map((v) => `${v.modelKey}@${v.row},${v.col},${v.length}${v.orientation}`)
    .sort()
    .join('|')
}

// ---- 후보 풀 생성 ----
const MIN_MOVES = 4        // 비자명 하한 (스테이지 1,2가 2,3수이므로 3 이상 증가)
const SOLVE_CAP = 250_000
const buckets = new Map()  // minMoves -> [ {vehicles, minMoves, sig} ]
const seenSigs = new Set()
const startTime = Date.now()
const TIME_LIMIT_MS = 180_000
let generated = 0, solvableCount = 0

for (let iter = 0; iter < 6000; iter++) {
  if (Date.now() - startTime > TIME_LIMIT_MS) break
  const numBlockers = 7 + randInt(7) // 7~13 블로커
  const maxLong = numBlockers >= 10 ? 3 : numBlockers >= 7 ? 2 : 1
  const state = generateBoard(numBlockers, maxLong)
  generated++
  const sig = signature(state.vehicles)
  if (seenSigs.has(sig)) continue
  seenSigs.add(sig)
  if (isSolved(state)) continue

  const result = solve(state, SOLVE_CAP)
  if (!result.solvable || result.minMoves == null) continue
  solvableCount++
  if (result.minMoves < MIN_MOVES || result.minMoves > 22) continue
  if (!buckets.has(result.minMoves)) buckets.set(result.minMoves, [])
  buckets.get(result.minMoves).push({ vehicles: state.vehicles, minMoves: result.minMoves, sig })
}

const availableMoves = [...buckets.keys()].sort((a, b) => a - b)
console.error(`generated=${generated} solvable=${solvableCount} availableMinMoves=${JSON.stringify(availableMoves)}`)
for (const m of availableMoves) console.error(`  minMoves=${m}: ${buckets.get(m).length} boards`)

// ---- 8개 스테이지 선택: 낮은→높은 고른 스프레드 ----
if (availableMoves.length < 8) {
  console.error(`ERROR: 서로 다른 minMoves 값이 ${availableMoves.length}개뿐 — 8개 미만. 시드를 바꾸거나 시간을 늘려 재시도 필요.`)
  process.exit(1)
}
const lo = availableMoves[0]
const hi = availableMoves[availableMoves.length - 1]
const desired = []
for (let i = 0; i < 8; i++) desired.push(lo + (hi - lo) * (i / 7))

const usedMoves = new Set()
const chosen = []
for (const d of desired) {
  let best = null, bestDiff = Infinity
  for (const m of availableMoves) {
    if (usedMoves.has(m)) continue
    const diff = Math.abs(m - d)
    if (diff < bestDiff) { bestDiff = diff; best = m }
  }
  if (best == null) break
  usedMoves.add(best)
  const cands = buckets.get(best)
  const pick = cands[randInt(cands.length)]
  chosen.push(pick)
}
chosen.sort((a, b) => a.minMoves - b.minMoves)

// 최종 검증: 서명 유일성 + solve 재확인
const finalSigs = new Set()
for (const c of chosen) {
  if (finalSigs.has(c.sig)) { console.error('ERROR: 중복 배치 감지!'); process.exit(1) }
  finalSigs.add(c.sig)
}

function difficultyFor(m) {
  if (m <= 3) return 'Easy'
  if (m <= 5) return 'Intermediate'
  if (m <= 8) return 'Advanced'
  if (m <= 11) return 'Expert'
  if (m <= 14) return 'Master'
  return 'Legend'
}

// ---- 출력: stagePuzzles(3~10) JS 조각 ----
const lines = []
chosen.forEach((c, idx) => {
  const stageNo = idx + 3
  const state = { board: { rows: ROWS, cols: COLS, exitRow: EXIT_ROW, exitCol: 0, exitSide: 'right' }, vehicles: c.vehicles, status: 'IDLE', moveCount: 0 }
  const verify = solve(state, SOLVE_CAP)
  const replayOk = verify.solvable && verify.minMoves === c.minMoves
  console.error(`stage-${stageNo}: minMoves=${c.minMoves} vehicles=${c.vehicles.length} difficulty=${difficultyFor(c.minMoves)} verify=${verify.minMoves} ok=${replayOk} sol=${verify.solution.length}`)

  lines.push(`  {`)
  lines.push(`    id: 'rh-stage-${stageNo}',`)
  lines.push(`    version: 1,`)
  lines.push(`    board: { w: 6, h: 6, exit: { side: 'E', index: 2 } },`)
  lines.push(`    vehicles: [`)
  // 타겟 먼저, 그 다음 블로커
  const ordered = [...c.vehicles].sort((a, b) => (b.isTarget ? 1 : 0) - (a.isTarget ? 1 : 0))
  for (const v of ordered) {
    const target = v.isTarget ? ', isTarget: true' : ''
    lines.push(`      { id: '${v.id}', x: ${v.col}, y: ${v.row}, len: ${v.length}, dir: '${v.orientation}'${target}, type: '${v.modelKey}' },`)
  }
  lines.push(`    ],`)
  lines.push(`    meta: { difficulty: '${difficultyFor(c.minMoves)}', minMoves: ${c.minMoves} },`)
  lines.push(`  },`)
})

console.log(lines.join('\n'))
console.error('\nminMoves sequence:', chosen.map((c) => c.minMoves).join(', '))
