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
const SCHEDULE_AHEAD_SEC = 0.1
const LOOKAHEAD_MS = 25

// 스테이지마다 분위기가 바뀌도록 서로 다른 조성의 2마디(16 eighth-note) 루프 4종을 두고
// 순환시킨다. 뒤로 갈수록(난이도가 오를수록) 템포도 조금씩 빨라진다.
const BGM_PATTERNS = [
  {
    // C - F - Dm - G
    melody: [
      523.25, 659.25, 783.99, 659.25, 698.46, 880.0, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46, 783.99, 987.77,
      1046.5, 783.99,
    ],
    bass: [130.81, 130.81, 174.61, 174.61, 146.83, 146.83, 196.0, 196.0],
    tempo: 128,
  },
  {
    // Am - F - C - G
    melody: [
      880.0, 1046.5, 1318.51, 1046.5, 698.46, 880.0, 1046.5, 880.0, 783.99, 987.77, 1174.66, 987.77, 698.46, 880.0,
      1046.5, 783.99,
    ],
    bass: [220.0, 220.0, 174.61, 174.61, 130.81, 130.81, 196.0, 196.0],
    tempo: 134,
  },
  {
    // G - C - Em - D
    melody: [
      392.0, 493.88, 587.33, 493.88, 523.25, 659.25, 587.33, 493.88, 440.0, 523.25, 659.25, 523.25, 392.0, 493.88,
      587.33, 440.0,
    ],
    bass: [196.0, 196.0, 130.81, 130.81, 164.81, 164.81, 146.83, 146.83],
    tempo: 140,
  },
  {
    // Em - C - D - Em (긴장감 있는 단조)
    melody: [
      329.63, 392.0, 493.88, 392.0, 523.25, 659.25, 587.33, 493.88, 587.33, 493.88, 392.0, 329.63, 392.0, 493.88,
      587.33, 329.63,
    ],
    bass: [164.81, 164.81, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81],
    tempo: 148,
  },
]

let currentPattern = BGM_PATTERNS[0]
let eighthSec = 60 / currentPattern.tempo / 2

/** 스테이지에 맞는 배경음 패턴으로 전환한다. 이미 재생 중이면 다음 마디부터 자연스럽게 바뀐다. */
export function setBgmVariant(index) {
  const pattern = BGM_PATTERNS[((index % BGM_PATTERNS.length) + BGM_PATTERNS.length) % BGM_PATTERNS.length]
  if (pattern === currentPattern) return
  currentPattern = pattern
  eighthSec = 60 / currentPattern.tempo / 2
  bgmStep = 0 // 새 패턴은 마디 처음부터 재생
}

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
    const { melody, bass } = currentPattern
    const i = bgmStep % melody.length
    scheduleBgmNote(melody[i], bgmNextNoteTime, eighthSec * 0.9, 'square', 0.05)
    if (i % 2 === 0) {
      scheduleBgmNote(bass[(i / 2) % bass.length], bgmNextNoteTime, eighthSec * 2 * 0.9, 'triangle', 0.07)
    }
    bgmNextNoteTime += eighthSec
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
