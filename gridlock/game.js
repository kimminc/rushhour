import { schemaToState } from './logic/adapter.js'
import { stagePuzzles } from './logic/puzzles.js'
import { validatePlacement } from './logic/board.js'
import { canMove, applyMove } from './logic/moves.js'
import { isSolved } from './logic/win.js'
import { solve } from './logic/solver.js'
import * as sound from './sound.js'

const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
const stageIndicatorEl = document.getElementById('stageIndicator')
const moveCountEl = document.getElementById('moveCount')
const parCountEl = document.getElementById('parCount')
const muteBtn = document.getElementById('muteBtn')
const pauseBtn = document.getElementById('pauseBtn')
const startOverlay = document.getElementById('startOverlay')
const startBtn = document.getElementById('startBtn')
const pauseOverlay = document.getElementById('pauseOverlay')
const resumeBtn = document.getElementById('resumeBtn')
const winOverlay = document.getElementById('winOverlay')
const winText = document.getElementById('winText')
const nextStageBtn = document.getElementById('nextStageBtn')
const restartBtnOverlay = document.getElementById('restartBtnOverlay')
const restartBtn = document.getElementById('restartBtn')
const toStartBtn = document.getElementById('toStartBtn')
const dpad = document.getElementById('dpad')
const hint = document.getElementById('hint')
const hintBtn = document.getElementById('hintBtn')
const timerEl = document.getElementById('timer')

const DIFFICULTY_LABELS = {
  Beginner: '초급',
  Easy: '쉬움',
  Intermediate: '중급',
  Advanced: '고급',
  Expert: '전문가',
  Master: '마스터',
  Legend: '레전드',
}

/** @type {import('./logic/board.js').GameState | null} */
let game = null
let selectedVehicleId = null
let started = false
let paused = false
let cellPx = 0
let gridOffsetX = 0
let gridOffsetY = 0
let shakeUntil = 0
let stageIndex = 0

// ---- 타이머: 처음 시작부터 마지막 스테이지 클리어까지 누적 시간 ----
let timerElapsedMs = 0
let timerStartTs = 0
let timerRunning = false

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}
function currentElapsedMs() {
  return timerRunning ? timerElapsedMs + (performance.now() - timerStartTs) : timerElapsedMs
}
function startTimer() {
  timerElapsedMs = 0
  timerStartTs = performance.now()
  timerRunning = true
}
function pauseTimer() {
  if (!timerRunning) return
  timerElapsedMs += performance.now() - timerStartTs
  timerRunning = false
}
function resumeTimer() {
  if (timerRunning) return
  timerStartTs = performance.now()
  timerRunning = true
}

// 네온 주차 보드와 차량 스프라이트는 디자인 에셋을 그대로 사용한다.
// 승용차 12종(색상 전부 다름) + 트럭 2종 + 버스 2종 = 총 16종.
const SPRITE_SOURCES = {
  'sedan-red': './assets/sedan-red-transparent.png',
  'suv-blue': './assets/suv-blue-transparent.png',
  'sedan-yellow': './assets/sedan-yellow-transparent.png',
  'sedan-purple': './assets/sedan-purple-transparent.png',
  'sedan-green': './assets/sedan-green-transparent.png',
  'sedan-orange': './assets/sedan-orange-transparent.png',
  'sedan-pink': './assets/sedan-pink-transparent.png',
  'sedan-teal': './assets/sedan-teal-transparent.png',
  'sedan-white': './assets/sedan-white-transparent.png',
  'sedan-brown': './assets/sedan-brown-transparent.png',
  'sedan-navy': './assets/sedan-navy-transparent.png',
  'sedan-lime': './assets/sedan-lime-transparent.png',
  'truck-green': './assets/truck-green-transparent.png',
  'truck-amber': './assets/truck-amber-transparent.png',
  'bus-yellow': './assets/bus-yellow-transparent.png',
  'bus-mint': './assets/bus-mint-transparent.png',
}
const BOARD_FLOOR_SRC = './assets/board-floor.png'

// board-floor.png는 원본 이미지를 자르지 않고 그대로 쓴다(브랜드 테두리 포함).
// 대신 실제 격자가 이미지 안에서 차지하는 영역을 비율로 기록해두고,
// 차량/출구 렌더링과 클릭 판정을 이 영역 안쪽으로만 오프셋+스케일해서 정렬을 맞춘다.
const GRID_INSET = { left: 207 / 1254, top: 183 / 1254, width: 837 / 1254, height: 823 / 1254 }

/** @type {Record<string, HTMLImageElement>} */
const sprites = {}
/** @type {HTMLImageElement | null} */
let boardFloorImg = null

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`failed to load ${src}`))
    img.src = src
  })
}

async function loadAssets() {
  const keys = Object.keys(SPRITE_SOURCES)
  const results = await Promise.allSettled([
    loadImage(BOARD_FLOOR_SRC),
    ...keys.map((key) => loadImage(SPRITE_SOURCES[key])),
  ])
  if (results[0].status === 'fulfilled') boardFloorImg = results[0].value
  keys.forEach((key, index) => {
    const result = results[index + 1]
    if (result.status === 'fulfilled') sprites[key] = result.value
  })
}

const ANIM_DURATION = 180 // ms
/** 진행 중인 슬라이드 애니메이션. null이면 애니메이션 없음(IDLE 게이팅에 사용). */
let anim = null

function loadPuzzle(schema) {
  const state = schemaToState(schema)
  const check = validatePlacement(state)
  if (!check.ok) console.error('invalid puzzle placement:', check.error)
  game = state
  selectedVehicleId = null
  anim = null
  hint.textContent = '차량을 탭하거나 클릭해서 선택하세요. 키보드는 방향키/WASD.'
  updateHud()
  hideOverlay(winOverlay)
}

/** 스테이지 인덱스(0-based)로 해당 퍼즐을 불러온다. */
function loadStage(index) {
  stageIndex = Math.max(0, Math.min(stagePuzzles.length - 1, index))
  loadPuzzle(stagePuzzles[stageIndex])
}

function updateHud() {
  moveCountEl.textContent = `이동 ${game.moveCount}회`
  const schema = stagePuzzles[stageIndex]
  const label = DIFFICULTY_LABELS[schema.meta?.difficulty] || schema.meta?.difficulty || ''
  stageIndicatorEl.textContent = `스테이지 ${stageIndex + 1}/${stagePuzzles.length}${label ? ` · ${label}` : ''}`
  parCountEl.textContent = schema.meta?.minMoves != null ? `최소 ${schema.meta.minMoves}수` : ''
}

// ---- 반응형 캔버스: 내부 해상도(devicePixelRatio 반영)와 CSS 크기를 분리 ----
function resizeCanvas() {
  if (!game) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // 격자 칸 크기는 이미지 안에서 실제 보드가 차지하는 폭/높이 중 더 작은 쪽 비율로 계산해
  // 어느 방향으로도 보드 이미지의 시각적 경계를 넘어가지 않게 한다.
  const gridFrac = Math.min(GRID_INSET.width, GRID_INSET.height)
  cellPx = (rect.width * gridFrac) / game.board.cols
  gridOffsetX = rect.width * GRID_INSET.left
  gridOffsetY = rect.height * GRID_INSET.top
}

window.addEventListener('resize', resizeCanvas)

// ---- 입력: 클릭/터치로 차량 선택 ----
canvas.addEventListener('pointerdown', (e) => {
  if (!started || paused || !game || game.status !== 'IDLE') return
  const rect = canvas.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left - gridOffsetX) / cellPx)
  const row = Math.floor((e.clientY - rect.top - gridOffsetY) / cellPx)
  if (col < 0 || col >= game.board.cols || row < 0 || row >= game.board.rows) return
  const hit = game.vehicles.find((v) => {
    if (v.orientation === 'H') return v.row === row && col >= v.col && col < v.col + v.length
    return v.col === col && row >= v.row && row < v.row + v.length
  })
  if (hit) {
    selectedVehicleId = hit.id
    hint.textContent = `${hit.isTarget ? '목표 차량' : '차량'} 선택됨 — 방향키/WASD 또는 아래 버튼으로 이동`
  }
})

// ---- 입력: 키보드 ----
// keydown 반복 이벤트(OS 키 반복)로 한 번의 물리적 입력이 여러 이동으로 새지 않도록
// pressed Set으로 눌림 상태를 관리한다. 러시아워는 연속 이동이 아닌 1칸씩 이산 이동이라
// keydown 시점에 1회만 처리하고, keyup에서 다시 누를 수 있도록 해제한다.
const pressed = new Set()
const KEY_DIR = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
}

window.addEventListener('keydown', (e) => {
  if (KEY_DIR[e.code]) e.preventDefault() // 페이지 스크롤 방지
  if (pressed.has(e.code)) return
  pressed.add(e.code)
  if (e.code === 'KeyP') {
    togglePause()
    return
  }
  if (!started || paused) return
  const dir = KEY_DIR[e.code]
  if (dir) tryMove(dir)
})
window.addEventListener('keyup', (e) => pressed.delete(e.code))

// ---- 입력: 방향 버튼(모바일/데스크탑 공용) ----
dpad.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-dir]')
  if (!btn || !started || paused) return
  tryMove(btn.dataset.dir)
})

function tryMove(dir) {
  if (!game || game.status !== 'IDLE' || !selectedVehicleId || anim) return
  const v = game.vehicles.find((x) => x.id === selectedVehicleId)
  if (!v) return

  let axisDir = null
  if (v.orientation === 'H' && (dir === 'left' || dir === 'right')) axisDir = dir === 'right' ? 1 : -1
  if (v.orientation === 'V' && (dir === 'up' || dir === 'down')) axisDir = dir === 'down' ? 1 : -1
  if (axisDir === null) return // 차량 방향과 안 맞는 입력은 조용히 무시

  if (!canMove(game, selectedVehicleId, axisDir, 1)) {
    sound.playBlocked()
    shakeUntil = performance.now() + 150
    return
  }

  const fromRow = v.row
  const fromCol = v.col
  const nextState = applyMove(game, selectedVehicleId, axisDir, 1)
  const nv = nextState.vehicles.find((x) => x.id === selectedVehicleId)

  game = { ...game, status: 'ANIMATING' }
  anim = {
    vehicleId: selectedVehicleId,
    fromRow,
    fromCol,
    toRow: nv.row,
    toCol: nv.col,
    elapsed: 0,
    duration: ANIM_DURATION,
    onDone: () => {
      game = nextState
      sound.playMove()
      if (isSolved(game)) {
        game = { ...game, status: 'SOLVED' }
        onWin()
      } else {
        game = { ...game, status: 'IDLE' }
      }
      updateHud()
    },
  }
}

function onWin() {
  const isLastStage = stageIndex >= stagePuzzles.length - 1
  if (isLastStage) {
    pauseTimer()
    winText.textContent = `🏆 ${stagePuzzles.length}단계 전부 클리어! 마지막 스테이지 ${game.moveCount}수 만에 성공 (총 시간 ${formatTime(currentElapsedMs())})`
    nextStageBtn.classList.add('hidden')
  } else {
    winText.textContent = `🎉 스테이지 ${stageIndex + 1} 클리어! ${game.moveCount}수 만에 성공`
    nextStageBtn.classList.remove('hidden')
  }
  showOverlay(winOverlay)
  sound.playWin()
}

// ---- 일시정지 ----
function togglePause() {
  if (!started) return
  paused = !paused
  pauseBtn.textContent = paused ? '▶' : '⏸'
  if (paused) {
    showOverlay(pauseOverlay)
    pauseTimer()
  } else {
    hideOverlay(pauseOverlay)
    resumeTimer()
  }
}
pauseBtn.addEventListener('click', togglePause)
resumeBtn.addEventListener('click', togglePause)

// 탭이 백그라운드로 가면 자동 일시정지 — deltaTime 폭주로 인한 순간이동 방지
document.addEventListener('visibilitychange', () => {
  if (document.hidden && started && !paused) togglePause()
})

// ---- 오버레이 ----
function showOverlay(el) {
  el.classList.remove('hidden')
}
function hideOverlay(el) {
  el.classList.add('hidden')
}

startBtn.addEventListener('click', () => {
  started = true
  sound.resumeAudio() // 사용자 첫 클릭 이후에만 오디오 재생 가능
  hideOverlay(startOverlay)
  startTimer()
})

/** 현재 스테이지를 처음부터 다시 시작한다 (스테이지 진행도는 유지). */
function restart() {
  loadStage(stageIndex)
  paused = false
  pauseBtn.textContent = '⏸'
  hideOverlay(pauseOverlay)
  hideOverlay(winOverlay)
}
restartBtn.addEventListener('click', restart)
restartBtnOverlay.addEventListener('click', restart)

/** 진행도와 무관하게 1스테이지로 돌아간다. */
toStartBtn.addEventListener('click', () => {
  loadStage(0)
  paused = false
  pauseBtn.textContent = '⏸'
  hideOverlay(pauseOverlay)
  hideOverlay(winOverlay)
  startTimer()
})

nextStageBtn.addEventListener('click', () => {
  if (stageIndex >= stagePuzzles.length - 1) return // 마지막 스테이지에서는 버튼이 숨겨져 있지만 방어적으로 체크
  loadStage(stageIndex + 1)
  paused = false
  pauseBtn.textContent = '⏸'
  hideOverlay(pauseOverlay)
  hideOverlay(winOverlay)
})

// ---- 힌트: 이미 로드된 6x6 스테이지 1개에 대한 즉시 BFS라 상태공간이 작아
// 클라이언트에서 바로 돌려도 안전하다 (수백~수천 상태, 수 ms 내 종료).
const MOVE_RE = /^(.+?)([+-])(\d+)$/
hintBtn.addEventListener('click', () => {
  if (!started || paused || !game || game.status !== 'IDLE') return
  const result = solve(game, 300_000)
  if (!result.solvable || result.solution.length === 0) {
    hint.textContent = '힌트를 계산할 수 없어요.'
    return
  }
  const match = MOVE_RE.exec(result.solution[0])
  if (!match) return
  const [, vehicleId, sign] = match
  const v = game.vehicles.find((x) => x.id === vehicleId)
  if (!v) return
  const dirWord = v.orientation === 'H' ? (sign === '+' ? '오른쪽' : '왼쪽') : sign === '+' ? '아래쪽' : '위쪽'
  selectedVehicleId = vehicleId
  hint.textContent = `힌트: 노란 테두리로 표시된 차량을 ${dirWord}으로 이동해보세요. (최소 ${result.minMoves}수 남음)`
})

muteBtn.addEventListener('click', () => {
  const isMuted = sound.toggleMute()
  muteBtn.textContent = isMuted ? '🔇' : '🔊'
})

// ---- 렌더링 (Canvas 2D) ----

function roundRect(c, x, y, w, h, r) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

// 스프라이트 로드 실패 시에만 쓰이는 폴백 색상 (16종 전부 매핑, 에셋이 없어도 색으로는 구분 가능하게).
const FALLBACK_COLORS = {
  'sedan-red': '#e74c3c',
  'suv-blue': '#3b82f6',
  'sedan-yellow': '#eab308',
  'sedan-purple': '#a855f7',
  'sedan-green': '#22c55e',
  'sedan-orange': '#f97316',
  'sedan-pink': '#ec4899',
  'sedan-teal': '#14b8a6',
  'sedan-white': '#f1f5f9',
  'sedan-brown': '#92400e',
  'sedan-navy': '#1e3a8a',
  'sedan-lime': '#a3e635',
  'truck-green': '#22c55e',
  'truck-amber': '#d97706',
  'bus-yellow': '#fbbf24',
  'bus-mint': '#2dd4bf',
}
function vehicleColor(v) {
  if (v.isTarget) return '#e74c3c'
  return FALLBACK_COLORS[v.modelKey] || '#94a3b8'
}

function drawVehicle(v, x, y, vw, vh) {
  const cx = x + vw / 2
  const cy = y + vh / 2
  const sprite = v.modelKey ? sprites[v.modelKey] : null
  if (sprite) {
    ctx.save()
    ctx.translate(cx, cy)
    if (v.orientation === 'V') ctx.rotate(Math.PI / 2)
    const width = v.orientation === 'V' ? vh : vw
    const height = v.orientation === 'V' ? vw : vh
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height)
    ctx.restore()
  } else {
    ctx.fillStyle = vehicleColor(v)
    roundRect(ctx, x, y, vw, vh, 8)
    ctx.fill()
  }

  if (v.id === selectedVehicleId) {
    ctx.lineWidth = 3
    ctx.strokeStyle = '#fbbf24'
    roundRect(ctx, x, y, vw, vh, 8)
    ctx.stroke()
  }

  // 목표 차량은 선택하지 않아도 식별 가능해야 한다. 작은 목표 마커는 차의 방향과 무관하게 중앙에 고정한다.
  if (v.isTarget) {
    ctx.save()
    ctx.fillStyle = '#fff7cc'
    ctx.strokeStyle = '#b91c1c'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, Math.max(7, Math.min(vw, vh) * 0.12), 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#b91c1c'
    ctx.font = `700 ${Math.max(9, Math.min(vw, vh) * 0.2)}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('X', cx, cy + 0.5)
    ctx.restore()
  }
}

/** 보드 이미지 위에 반응형 출구 안내를 얹는다. 이미지 안의 출구 위치와 스키마가 달라도 목표를 명확히 한다. */
function drawExitGuide(board, boardW, boardH) {
  const size = cellPx
  const inset = size * 0.18
  let x = 0
  let y = 0
  let angle = 0
  if (board.exitSide === 'right') {
    x = boardW - inset
    y = board.exitRow * size + size / 2
    angle = 0
  } else if (board.exitSide === 'left') {
    x = inset
    y = board.exitRow * size + size / 2
    angle = Math.PI
  } else if (board.exitSide === 'bottom') {
    x = board.exitCol * size + size / 2
    y = boardH - inset
    angle = Math.PI / 2
  } else {
    x = board.exitCol * size + size / 2
    y = inset
    angle = -Math.PI / 2
  }

  ctx.save()
  ctx.translate(gridOffsetX + x, gridOffsetY + y)
  ctx.rotate(angle)
  ctx.shadowColor = '#2de2e6'
  ctx.shadowBlur = 14
  ctx.fillStyle = 'rgba(45, 226, 230, 0.9)'
  ctx.beginPath()
  ctx.moveTo(size * 0.25, 0)
  ctx.lineTo(-size * 0.08, -size * 0.22)
  ctx.lineTo(-size * 0.08, -size * 0.1)
  ctx.lineTo(-size * 0.32, -size * 0.1)
  ctx.lineTo(-size * 0.32, size * 0.1)
  ctx.lineTo(-size * 0.08, size * 0.1)
  ctx.lineTo(-size * 0.08, size * 0.22)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function render() {
  if (!game || !cellPx) return
  const { board, vehicles } = game
  const w = canvas.width / (window.devicePixelRatio || 1)
  const h = canvas.height / (window.devicePixelRatio || 1)
  const boardW = board.cols * cellPx
  const boardH = board.rows * cellPx
  ctx.clearRect(0, 0, w, h)

  // 보드 이미지는 자르지 않고 캔버스 전체에 그대로 채운다(테두리 브랜드 표시 포함).
  // 격자/차량은 gridOffsetX/Y + cellPx로 이미지 안의 실제 보드 영역에만 맞춰 그린다.
  if (boardFloorImg) ctx.drawImage(boardFloorImg, 0, 0, w, h)
  else {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, w, h)
  }

  // 이미지가 없을 때의 격자뿐 아니라, 어떤 보드 이미지 위에서도 출구는 일관되게 안내한다.
  drawExitGuide(board, boardW, boardH)

  const now = performance.now()
  const shakeOffset = now < shakeUntil ? Math.sin(now / 20) * 4 : 0

  for (const v of vehicles) {
    let row = v.row
    let col = v.col
    if (anim && anim.vehicleId === v.id) {
      const t = Math.min(1, anim.elapsed / anim.duration)
      const eased = 1 - Math.pow(1 - t, 2)
      row = anim.fromRow + (anim.toRow - anim.fromRow) * eased
      col = anim.fromCol + (anim.toCol - anim.fromCol) * eased
    }
    const vw = (v.orientation === 'H' ? v.length : 1) * cellPx - 6
    const vh = (v.orientation === 'V' ? v.length : 1) * cellPx - 6
    let x = gridOffsetX + col * cellPx + 3
    const y = gridOffsetY + row * cellPx + 3
    if (v.id === selectedVehicleId) x += shakeOffset

    drawVehicle(v, x, y, vw, vh)
  }

}

// ---- 게임 루프: requestAnimationFrame + deltaTime (setInterval 사용 안 함) ----
let lastTs = 0
function loop(ts) {
  const dt = lastTs ? ts - lastTs : 0
  lastTs = ts

  if (anim && !paused) {
    anim.elapsed += dt
    if (anim.elapsed >= anim.duration) {
      const done = anim.onDone
      anim = null
      done()
    }
  }

  if (started) timerEl.textContent = formatTime(currentElapsedMs())

  render()
  requestAnimationFrame(loop)
}

// ---- 초기화 ----
async function init() {
  loadStage(0)
  resizeCanvas()
  await loadAssets()
  requestAnimationFrame(loop)
}
init()
