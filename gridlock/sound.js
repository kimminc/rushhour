/**
 * 칩튠 사운드 — 오디오 파일 없이 Web Audio API(OscillatorNode)로 효과음을 코드로 생성한다.
 * 브라우저 정책상 AudioContext는 사용자가 처음 클릭/터치한 뒤에만 소리를 낼 수 있으므로,
 * resumeAudio()를 시작 버튼 클릭 시점에 반드시 호출한다.
 */

let audioCtx = null
let muted = false

// 개발놀이터 오락실 SDK(DevplayVolume)가 우상단 공통 사운드 버튼/페이더로 전달하는 외부
// 볼륨 상태. 우리 자체 음소거 버튼(muted)과 별개 채널이라 둘 다 반영해 곱해 적용한다.
let externalMuted = false
let externalBgmLevel = 1
let externalSfxLevel = 1

function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function beep({ freq, duration, type = 'square', gain = 0.15, startDelay = 0 }) {
  const peakGain = gain * externalSfxLevel
  if (muted || externalMuted || peakGain <= 0) return // exponentialRamp는 0에서/으로 못 가서 무음이면 아예 스킵
  const ctx = ensureCtx()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  const t0 = ctx.currentTime + startDelay
  gainNode.gain.setValueAtTime(peakGain, t0)
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
  applyBgmGainValue()
  return muted
}

export function isMuted() {
  return muted
}

/**
 * 개발놀이터 오락실 SDK(DevplayVolume)의 상태를 반영한다. s = { muted, bgm, sfx } (각 0..1).
 * 우리 자체 음소거 버튼과는 별개 채널이라 두 상태를 곱해서 최종 음량을 정한다.
 */
export function applyExternalVolume(s) {
  externalMuted = !!s.muted
  externalBgmLevel = typeof s.bgm === 'number' ? s.bgm : 1
  externalSfxLevel = typeof s.sfx === 'number' ? s.sfx : 1
  applyBgmGainValue()
}

// ---- 배경음(칩튠 루프) ----
// 8비트풍 아르페지오 멜로디 + 베이스, look-ahead 스케줄러로 정확한 타이밍 유지.
// (렌더 루프는 반드시 rAF를 쓰지만, 오디오 스케줄링은 별개 — 표준적인 Web Audio 패턴이다.)
const SCHEDULE_AHEAD_SEC = 0.1
const LOOKAHEAD_MS = 25

// 10개 스테이지 각각에 완전히 다른 곡을 준다(조성/멜로디 윤곽/템포/리드 음색까지 다 다르게) —
// 그냥 음 몇 개만 바꾸면 결국 다 비슷하게 들리므로, 조옮김이 아니라 서로 다른 코드 진행과
// 리드 오실레이터 파형(square/triangle/sawtooth)까지 바꿔 스테이지마다 뚜렷이 구별되게 한다.
// 템포도 120→176bpm로 단계마다 올라가 난이도가 오를수록 곡이 급박해지는 느낌을 준다.
const BGM_PATTERNS = [
  {
    // 1단계 — C 장조, 밝고 느긋한 튜토리얼 분위기
    melody: [
      523.25, 659.25, 783.99, 659.25, 698.46, 880.0, 783.99, 659.25, 587.33, 698.46, 880.0, 698.46, 783.99, 987.77,
      1046.5, 783.99,
    ],
    bass: [130.81, 130.81, 174.61, 174.61, 146.83, 146.83, 196.0, 196.0],
    tempo: 120,
    wave: 'square',
  },
  {
    // 2단계 — G 장조, 발랄하게
    melody: [
      392.0, 493.88, 587.33, 493.88, 523.25, 659.25, 587.33, 493.88, 440.0, 523.25, 659.25, 523.25, 587.33, 739.99,
      783.99, 587.33,
    ],
    bass: [196.0, 196.0, 130.81, 130.81, 146.83, 146.83, 196.0, 196.0],
    tempo: 126,
    wave: 'square',
  },
  {
    // 3단계 — A 단조, 살짝 진지해지는 전환
    melody: [
      440.0, 523.25, 659.25, 523.25, 587.33, 698.46, 587.33, 440.0, 392.0, 493.88, 587.33, 493.88, 523.25, 659.25,
      783.99, 523.25,
    ],
    bass: [220.0, 220.0, 146.83, 146.83, 196.0, 196.0, 130.81, 130.81],
    tempo: 132,
    wave: 'square',
  },
  {
    // 4단계 — E 단조, 부드럽지만 긴장감(triangle 리드)
    melody: [
      329.63, 392.0, 493.88, 392.0, 440.0, 523.25, 493.88, 392.0, 349.23, 440.0, 523.25, 440.0, 392.0, 493.88,
      587.33, 329.63,
    ],
    bass: [164.81, 164.81, 130.81, 130.81, 220.0, 220.0, 246.94, 246.94],
    tempo: 138,
    wave: 'triangle',
  },
  {
    // 5단계 — D 장조, 힘차고 밝게
    melody: [
      293.66, 369.99, 440.0, 369.99, 440.0, 554.37, 493.88, 369.99, 392.0, 493.88, 587.33, 493.88, 440.0, 554.37,
      659.25, 440.0,
    ],
    bass: [146.83, 146.83, 196.0, 196.0, 164.81, 164.81, 220.0, 220.0],
    tempo: 144,
    wave: 'square',
  },
  {
    // 6단계 — F#단조, 날카로운 긴장감(sawtooth 리드)
    melody: [
      369.99, 440.0, 554.37, 440.0, 493.88, 587.33, 554.37, 440.0, 415.3, 493.88, 587.33, 493.88, 440.0, 554.37,
      659.25, 369.99,
    ],
    bass: [185.0, 185.0, 146.83, 146.83, 220.0, 220.0, 164.81, 164.81],
    tempo: 150,
    wave: 'sawtooth',
  },
  {
    // 7단계 — C 단조, 묵직하고 드라마틱(triangle 리드)
    melody: [
      261.63, 311.13, 392.0, 311.13, 349.23, 415.3, 392.0, 311.13, 293.66, 349.23, 466.16, 349.23, 392.0, 466.16,
      523.25, 261.63,
    ],
    bass: [130.81, 130.81, 174.61, 174.61, 196.0, 196.0, 130.81, 130.81],
    tempo: 156,
    wave: 'triangle',
  },
  {
    // 8단계 — B 단조, 몰아치는 느낌(sawtooth 리드)
    melody: [
      246.94, 293.66, 369.99, 293.66, 329.63, 392.0, 369.99, 293.66, 246.94, 329.63, 392.0, 329.63, 369.99, 440.0,
      554.37, 246.94,
    ],
    bass: [246.94, 246.94, 196.0, 196.0, 146.83, 146.83, 220.0, 220.0],
    tempo: 162,
    wave: 'sawtooth',
  },
  {
    // 9단계 — G 단조, 격렬하게
    melody: [
      392.0, 466.16, 587.33, 466.16, 523.25, 622.25, 587.33, 466.16, 440.0, 523.25, 622.25, 523.25, 466.16, 587.33,
      698.46, 392.0,
    ],
    bass: [196.0, 196.0, 130.81, 130.81, 146.83, 146.83, 196.0, 196.0],
    tempo: 168,
    wave: 'square',
  },
  {
    // 10단계 — D 단조, 최종 스테이지다운 웅장하고 급박한 마무리(sawtooth 리드, 최고 템포)
    melody: [
      293.66, 349.23, 440.0, 349.23, 392.0, 466.16, 440.0, 349.23, 329.63, 392.0, 523.25, 392.0, 440.0, 523.25,
      587.33, 293.66,
    ],
    bass: [146.83, 146.83, 233.08, 233.08, 130.81, 130.81, 146.83, 146.83],
    tempo: 176,
    wave: 'sawtooth',
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

/** 우리 자체 음소거 + 오락실 SDK 외부 볼륨을 곱해 BGM 마스터 게인에 즉시 반영한다. */
function applyBgmGainValue() {
  if (!bgmGain) return
  bgmGain.gain.value = muted || externalMuted ? 0 : externalBgmLevel
}

function ensureBgmGain() {
  const ctx = ensureCtx()
  if (!bgmGain) {
    bgmGain = ctx.createGain()
    bgmGain.connect(ctx.destination)
    applyBgmGainValue()
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
    const { melody, bass, wave } = currentPattern
    const i = bgmStep % melody.length
    scheduleBgmNote(melody[i], bgmNextNoteTime, eighthSec * 0.9, wave, 0.05)
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
