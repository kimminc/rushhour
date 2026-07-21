import { schemaToState } from './logic/adapter.js'
import { stagePuzzles } from './logic/puzzles.js'
import { validatePlacement } from './logic/board.js'
import { canMove, applyMove } from './logic/moves.js'
import { isSolved } from './logic/win.js'
import * as sound from './sound.js'

const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
const stageIndicatorEl = document.getElementById('stageIndicator')
const moveCountEl = document.getElementById('moveCount')
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
const dpad = document.getElementById('dpad')
const hint = document.getElementById('hint')

const DIFFICULTY_LABELS = {
  Beginner: '초급',
  Easy: '쉬움',
  Intermediate: '중급',
  Advanced: '고급',
  Expert: '전문가',
}

/** @type {import('./logic/board.js').GameState | null} */
let game = null
let selectedVehicleId = null
let started = false
let paused = false
let cellPx = 0
let shakeUntil = 0
let stageIndex = 0

// ---- 에셋 로딩 (Codex /imagen 생성, 크로마키 추출 완료된 스프라이트) ----
const SPRITE_SOURCES = {
  'sedan-red': './assets/sedan-red.png',
  'suv-blue': './assets/suv-blue.png',
  'sedan-yellow': './assets/sedan-yellow.png',
  'truck-green': './assets/truck-green.png',
}
const BOARD_FLOOR_SRC = './assets/board-floor.png'

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

/** 이미지 로드 실패 시에도 게임은 색상 사각형 폴백으로 계속 동작해야 하므로 에러를 던지지 않는다. */
async function loadAssets() {
  const keys = Object.keys(SPRITE_SOURCES)
  const results = await Promise.allSettled([
    loadImage(BOARD_FLOOR_SRC),
    ...keys.map((k) => loadImage(SPRITE_SOURCES[k])),
  ])
  if (results[0].status === 'fulfilled') boardFloorImg = results[0].value
  else console.warn('board floor 이미지 로드 실패, 단색 배경으로 폴백:', results[0].reason)
  keys.forEach((key, i) => {
    const r = results[i + 1]
    if (r.status === 'fulfilled') sprites[key] = r.value
    else console.warn(`${key} 스프라이트 로드 실패, 색상 사각형으로 폴백:`, r.reason)
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
}

// ---- 반응형 캔버스: 내부 해상도(devicePixelRatio 반영)와 CSS 크기를 분리 ----
function resizeCanvas() {
  if (!game) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  cellPx = rect.width / game.board.cols
}

window.addEventListener('resize', resizeCanvas)

// ---- 입력: 클릭/터치로 차량 선택 ----
canvas.addEventListener('pointerdown', (e) => {
  if (!started || paused || !game || game.status !== 'IDLE') return
  const rect = canvas.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / cellPx)
  const row = Math.floor((e.clientY - rect.top) / cellPx)
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
    winText.textContent = `🏆 5단계 전부 클리어! 마지막 스테이지 ${game.moveCount}수 만에 성공`
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
  if (paused) showOverlay(pauseOverlay)
  else hideOverlay(pauseOverlay)
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

nextStageBtn.addEventListener('click', () => {
  if (stageIndex >= stagePuzzles.length - 1) return // 마지막 스테이지에서는 버튼이 숨겨져 있지만 방어적으로 체크
  loadStage(stageIndex + 1)
  paused = false
  pauseBtn.textContent = '⏸'
  hideOverlay(pauseOverlay)
  hideOverlay(winOverlay)
})

muteBtn.addEventListener('click', () => {
  const isMuted = sound.toggleMute()
  muteBtn.textContent = isMuted ? '🔇' : '🔊'
})

// ---- 렌더링 (Canvas 2D) ----
// 스프라이트가 로드되지 않았거나 modelKey가 없으면 색상 사각형으로 폴백한다.
function vehicleColor(v) {
  if (v.isTarget) return '#e74c3c'
  if (v.modelKey && v.modelKey.includes('blue')) return '#3b82f6'
  if (v.modelKey && v.modelKey.includes('yellow')) return '#eab308'
  if (v.modelKey && v.modelKey.includes('green')) return '#22c55e'
  return '#94a3b8'
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

/** 차량 한 대를 그린다. 스프라이트가 있으면 이미지를, 없으면 색상 사각형을 그린다. */
function drawVehicle(v, x, y, vw, vh) {
  const cx = x + vw / 2
  const cy = y + vh / 2
  const sprite = v.modelKey ? sprites[v.modelKey] : null

  if (sprite) {
    ctx.save()
    ctx.translate(cx, cy)
    // 스프라이트는 가로 방향(코가 오른쪽)으로 제작됨 — 세로 차량은 90도 회전해서 맞춘다.
    if (v.orientation === 'V') ctx.rotate(Math.PI / 2)
    const w = v.orientation === 'V' ? vh : vw
    const h = v.orientation === 'V' ? vw : vh
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h)
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
}

function render() {
  if (!game || !cellPx) return
  const { board, vehicles } = game
  const w = canvas.width / (window.devicePixelRatio || 1)
  const h = canvas.height / (window.devicePixelRatio || 1)
  const boardW = board.cols * cellPx
  const boardH = board.rows * cellPx
  ctx.clearRect(0, 0, w, h)

  if (boardFloorImg) {
    ctx.drawImage(boardFloorImg, 0, 0, boardW, boardH)
  } else {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, boardW, boardH)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    for (let c = 1; c < board.cols; c++) {
      ctx.beginPath()
      ctx.moveTo(c * cellPx, 0)
      ctx.lineTo(c * cellPx, boardH)
      ctx.stroke()
    }
    for (let r = 1; r < board.rows; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * cellPx)
      ctx.lineTo(boardW, r * cellPx)
      ctx.stroke()
    }
  }

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
    let x = col * cellPx + 3
    const y = row * cellPx + 3
    if (v.id === selectedVehicleId) x += shakeOffset

    drawVehicle(v, x, y, vw, vh)
  }

  // 출구 표시 — board-floor.png에도 출구가 그려져 있지만(현재 시드 퍼즐 기준),
  // 다른 exitSide/exitRow 조합에서도 항상 정확하도록 캔버스에서 별도로 덧그린다.
  ctx.fillStyle = '#2de2e6'
  if (board.exitSide === 'right') {
    ctx.fillRect(boardW - 4, board.exitRow * cellPx + cellPx * 0.2, 4, cellPx * 0.6)
  } else if (board.exitSide === 'left') {
    ctx.fillRect(0, board.exitRow * cellPx + cellPx * 0.2, 4, cellPx * 0.6)
  } else if (board.exitSide === 'bottom') {
    ctx.fillRect(board.exitCol * cellPx + cellPx * 0.2, boardH - 4, cellPx * 0.6, 4)
  } else if (board.exitSide === 'top') {
    ctx.fillRect(board.exitCol * cellPx + cellPx * 0.2, 0, cellPx * 0.6, 4)
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

  render()
  requestAnimationFrame(loop)
}

// ---- 초기화 ----
async function init() {
  loadStage(0)
  resizeCanvas()
  await loadAssets() // 실패해도 loadAssets 내부에서 개별 폴백 처리하므로 게임 시작을 막지 않는다
  requestAnimationFrame(loop)
}
init()
