/**
 * 칩튠 사운드 — 오디오 파일 없이 Web Audio API(OscillatorNode)로 효과음을 코드로 생성한다.
 * 브라우저 정책상 AudioContext는 사용자가 처음 클릭/터치한 뒤에만 소리를 낼 수 있으므로,
 * resumeAudio()를 시작 버튼 클릭 시점에 반드시 호출한다.
 */

let audioCtx = null
let muted = false

function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function beep({ freq, duration, type = 'square', gain = 0.15, startDelay = 0 }) {
  if (muted) return
  const ctx = ensureCtx()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  const t0 = ctx.currentTime + startDelay
  gainNode.gain.setValueAtTime(gain, t0)
  gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration)
}

export function resumeAudio() {
  ensureCtx()
}

export function playMove() {
  beep({ freq: 440, duration: 0.08, type: 'square', gain: 0.12 })
}

export function playBlocked() {
  beep({ freq: 160, duration: 0.1, type: 'square', gain: 0.1 })
}

export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => beep({ freq, duration: 0.18, type: 'triangle', gain: 0.15, startDelay: i * 0.12 }))
}

export function toggleMute() {
  muted = !muted
  if (bgmGain) bgmGain.gain.value = muted ? 0 : 1
  return muted
}

export function isMuted() {
  return muted
}

// ---- 배경음(칩튠 루프) ----
// 8비트풍 아르페지오 멜로디 + 베이스, look-ahead 스케줄러로 정확한 타이밍 유지.
// (렌더 루프는 반드시 rAF를 쓰지만, 오디오 스케줄링은 별개 — 표준적인 Web Audio 패턴이다.)
const TEMPO_BPM = 132
const EIGHTH_SEC = 60 / TEMPO_BPM / 2
const SCHEDULE_AHEAD_SEC = 0.1
const LOOKAHEAD_MS = 25

// C - F - Dm - G 진행 위의 2마디(16 eighth-note) 루프.
const MELODY = [
  523.25, 659.25, 783.99, 659.25, 698.46, 880.0, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46, 783.99, 987.77,
  1046.5, 783.99,
]
const BASS = [130.81, 130.81, 174.61, 174.61, 146.83, 146.83, 196.0, 196.0] // 4분음표(멜로디 2스텝당 1개)

let bgmGain = null
let bgmTimerId = null
let bgmStep = 0
let bgmNextNoteTime = 0

function ensureBgmGain() {
  const ctx = ensureCtx()
  if (!bgmGain) {
    bgmGain = ctx.createGain()
    bgmGain.gain.value = muted ? 0 : 1
    bgmGain.connect(ctx.destination)
  }
  return bgmGain
}

function scheduleBgmNote(freq, time, duration, type, peakGain) {
  const ctx = ensureCtx()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(ensureBgmGain())
  g.gain.setValueAtTime(0, time)
  g.gain.linearRampToValueAtTime(peakGain, time + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  osc.start(time)
  osc.stop(time + duration + 0.02)
}

function bgmScheduler() {
  const ctx = ensureCtx()
  while (bgmNextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
    const i = bgmStep % MELODY.length
    scheduleBgmNote(MELODY[i], bgmNextNoteTime, EIGHTH_SEC * 0.9, 'square', 0.05)
    if (i % 2 === 0) {
      scheduleBgmNote(BASS[(i / 2) % BASS.length], bgmNextNoteTime, EIGHTH_SEC * 2 * 0.9, 'triangle', 0.07)
    }
    bgmNextNoteTime += EIGHTH_SEC
    bgmStep++
  }
}

/** 배경음 루프를 (재)시작한다. 이미 재생 중이면 아무 것도 하지 않는다. */
export function startBgm() {
  if (bgmTimerId) return
  const ctx = ensureCtx()
  ensureBgmGain()
  bgmStep = 0
  bgmNextNoteTime = ctx.currentTime + 0.05
  bgmScheduler()
  bgmTimerId = setInterval(bgmScheduler, LOOKAHEAD_MS)
}

/** 배경음 스케줄링을 멈춘다(일시정지/탭 비활성화 시). */
export function stopBgm() {
  if (bgmTimerId) {
    clearInterval(bgmTimerId)
    bgmTimerId = null
  }
}
