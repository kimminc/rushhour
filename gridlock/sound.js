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
// look-ahead 스케줄러로 정확한 타이밍 유지. 16분음표 스텝 그리드(2마디 = 32스텝) 위에
// 리드/베이스/타악기 "이벤트"([시작스텝, 주파수, 지속스텝] 또는 [시작스텝, 종류])를 얹는
// 방식이라 당김음·쉼표·지속음까지 표현할 수 있다. 장르 차이는 음 몇 개가 아니라 리듬(특히
// 타악기 패턴)이 만든다 — 그래서 스테이지마다 킥/스네어/하이햇 배치 자체를 다르게 짰다.
// (렌더 루프는 반드시 rAF를 쓰지만, 오디오 스케줄링은 별개 — 표준적인 Web Audio 패턴이다.)
const SCHEDULE_AHEAD_SEC = 0.1
const LOOKAHEAD_MS = 25
const STEPS_PER_LOOP = 32 // 4/4 두 마디, 16분음표 단위

function everyNSteps(type, n, offset = 0) {
  const out = []
  for (let s = offset; s < STEPS_PER_LOOP; s += n) out.push([s, type])
  return out
}

/** 같은 음을 일정 간격으로 반복하는 펄스형 베이스 라인을 만든다(테크노의 "펌핑" 베이스 등). */
function pulseNotes(freq, len, stride, offset = 0) {
  const out = []
  for (let s = offset; s < STEPS_PER_LOOP; s += stride) out.push([s, freq, len])
  return out
}

// 10개 스테이지에 장르 자체가 다른 곡 10개를 준다: 8비트 팝 → 보사노바 → 펑크 → 앰비언트 →
// 록/펑크 → 테크노 → 오케스트랄 → 드럼앤베이스 → 메탈 → 팡파르. lead/bass는
// [시작스텝, 주파수(Hz), 지속스텝] 이벤트 목록, perc는 [시작스텝, 'kick'|'snare'|'hihat'] 목록.
// 이벤트가 없는 스텝은 자연스럽게 쉼표가 된다.
const BGM_PATTERNS = [
  {
    // 1단계 — 8비트 팝: 밝고 통통 튀는 스타카토, 가벼운 하이햇만
    genre: '8bit pop',
    tempo: 108,
    wave: 'square',
    lead: [
      [0, 523.25, 3],
      [4, 659.25, 3],
      [8, 783.99, 3],
      [12, 659.25, 3],
      [16, 698.46, 3],
      [20, 880.0, 3],
      [24, 783.99, 3],
      [28, 659.25, 3],
    ],
    bass: [
      [0, 130.81, 4],
      [8, 174.61, 4],
      [16, 146.83, 4],
      [24, 196.0, 4],
    ],
    perc: everyNSteps('hihat', 4, 2),
  },
  {
    // 2단계 — 보사노바: 당김음 멜로디, 클레이브 느낌 스네어 + 셰이커 같은 하이햇
    genre: 'bossa nova',
    tempo: 116,
    wave: 'square',
    lead: [
      [2, 392.0, 2],
      [6, 493.88, 3],
      [11, 587.33, 2],
      [14, 493.88, 2],
      [18, 440.0, 2],
      [22, 523.25, 3],
      [27, 587.33, 2],
      [30, 739.99, 2],
    ],
    bass: [
      [0, 196.0, 3],
      [6, 196.0, 2],
      [10, 130.81, 3],
      [16, 130.81, 3],
      [22, 146.83, 2],
      [26, 196.0, 3],
    ],
    perc: [[0, 'kick'], [16, 'kick'], [10, 'snare'], [26, 'snare'], ...everyNSteps('hihat', 4)],
  },
  {
    // 3단계 — 펑크: 쉼표 많은 베이스 워크 + 16분음표 하이햇 그루브
    genre: 'funk',
    tempo: 100,
    wave: 'square',
    lead: [
      [3, 440.0, 2],
      [7, 523.25, 2],
      [14, 659.25, 2],
      [19, 587.33, 2],
      [23, 440.0, 2],
      [28, 523.25, 3],
    ],
    bass: [
      [0, 220.0, 2],
      [3, 220.0, 1],
      [7, 261.63, 2],
      [10, 220.0, 1],
      [14, 164.81, 2],
      [16, 220.0, 2],
      [19, 220.0, 1],
      [23, 261.63, 2],
      [26, 220.0, 1],
      [30, 196.0, 2],
    ],
    perc: [[0, 'kick'], [7, 'kick'], [16, 'kick'], [23, 'kick'], [8, 'snare'], [24, 'snare'], ...everyNSteps('hihat', 1)],
  },
  {
    // 4단계 — 앰비언트/미스터리: 성기고 긴 지속음, 심장박동 같은 킥만
    genre: 'ambient',
    tempo: 84,
    wave: 'triangle',
    lead: [
      [0, 659.25, 8],
      [12, 493.88, 6],
      [20, 587.33, 6],
      [27, 440.0, 5],
    ],
    bass: [
      [0, 164.81, 16],
      [16, 196.0, 16],
    ],
    perc: [[0, 'kick'], [16, 'kick']],
  },
  {
    // 5단계 — 록/펑크: 8분음표로 밀어붙이는 리프 + 온비트 킥/백비트 스네어
    genre: 'rock',
    tempo: 150,
    wave: 'sawtooth',
    lead: [
      [0, 587.33, 2], [2, 587.33, 2], [4, 440.0, 2], [6, 440.0, 2],
      [8, 587.33, 2], [10, 587.33, 2], [12, 493.88, 2], [14, 440.0, 2],
      [16, 587.33, 2], [18, 587.33, 2], [20, 440.0, 2], [22, 440.0, 2],
      [24, 659.25, 2], [26, 587.33, 2], [28, 493.88, 2], [30, 440.0, 2],
    ],
    bass: [
      [0, 146.83, 2], [2, 220.0, 2], [4, 146.83, 2], [6, 220.0, 2],
      [8, 146.83, 2], [10, 220.0, 2], [12, 146.83, 2], [14, 220.0, 2],
      [16, 146.83, 2], [18, 220.0, 2], [20, 146.83, 2], [22, 220.0, 2],
      [24, 146.83, 2], [26, 220.0, 2], [28, 146.83, 2], [30, 220.0, 2],
    ],
    perc: [[0, 'kick'], [8, 'kick'], [16, 'kick'], [24, 'kick'], [4, 'snare'], [12, 'snare'], [20, 'snare'], [28, 'snare'], ...everyNSteps('hihat', 2)],
  },
  {
    // 6단계 — 테크노/EDM: 포디플로어 킥 + 2/4박 클랩, 낮게 펌핑하는 베이스
    genre: 'techno',
    tempo: 128,
    wave: 'sawtooth',
    lead: [
      [0, 739.99, 2], [6, 739.99, 1], [8, 880.0, 2], [14, 739.99, 1],
      [16, 739.99, 2], [22, 739.99, 1], [24, 659.25, 2], [30, 739.99, 1],
    ],
    bass: pulseNotes(92.5, 2, 2),
    perc: [
      ...everyNSteps('kick', 4),
      [4, 'snare'], [12, 'snare'], [20, 'snare'], [28, 'snare'],
      ...everyNSteps('hihat', 4, 2),
    ],
  },
  {
    // 7단계 — 오케스트랄/드라마틱: 길게 끄는 화성 + 불규칙한 팀파니 악센트
    genre: 'orchestral',
    tempo: 92,
    wave: 'triangle',
    lead: [
      [0, 523.25, 6],
      [8, 622.25, 6],
      [16, 466.16, 8],
      [26, 523.25, 6],
    ],
    bass: [
      [0, 130.81, 16],
      [16, 130.81, 16],
    ],
    perc: [[0, 'kick'], [12, 'kick'], [16, 'kick'], [28, 'kick'], [30, 'snare']],
  },
  {
    // 8단계 — 드럼앤베이스: 브레이크비트 킥/스네어 당김음 + 쉴 새 없는 하이햇
    genre: 'drum and bass',
    tempo: 174,
    wave: 'sawtooth',
    lead: [
      [0, 987.77, 2], [8, 880.0, 2], [14, 987.77, 1], [16, 739.99, 2],
      [22, 880.0, 1], [24, 987.77, 2], [30, 739.99, 1],
    ],
    bass: [
      [0, 123.47, 2], [4, 123.47, 2], [8, 123.47, 2], [10, 123.47, 1],
      [12, 123.47, 2], [16, 123.47, 2], [20, 123.47, 2], [24, 123.47, 2],
      [26, 123.47, 1], [28, 123.47, 2],
    ],
    perc: [[0, 'kick'], [10, 'kick'], [16, 'kick'], [22, 'kick'], [4, 'snare'], [12, 'snare'], [20, 'snare'], [28, 'snare'], ...everyNSteps('hihat', 1)],
  },
  {
    // 9단계 — 메탈: 질주하는 갤럽 리프 + 더블킥
    genre: 'metal',
    tempo: 160,
    wave: 'sawtooth',
    lead: [
      [0, 392.0, 1], [2, 392.0, 1], [4, 466.16, 2], [8, 392.0, 1],
      [10, 392.0, 1], [12, 349.23, 2], [16, 392.0, 1], [18, 392.0, 1],
      [20, 466.16, 2], [24, 392.0, 1], [26, 392.0, 1], [28, 587.33, 3],
    ],
    bass: [
      [0, 98.0, 1], [2, 98.0, 1], [4, 98.0, 2], [8, 98.0, 1],
      [10, 98.0, 1], [12, 98.0, 2], [16, 98.0, 1], [18, 98.0, 1],
      [20, 98.0, 2], [24, 98.0, 1], [26, 98.0, 1], [28, 98.0, 3],
    ],
    perc: [[0, 'kick'], [2, 'kick'], [8, 'kick'], [10, 'kick'], [16, 'kick'], [18, 'kick'], [24, 'kick'], [26, 'kick'], [8, 'snare'], [24, 'snare']],
  },
  {
    // 10단계 — 팡파르/피날레: 상승하는 팡파르 멜로디 + 행진하는 킥/스네어
    genre: 'fanfare',
    tempo: 140,
    wave: 'sawtooth',
    lead: [
      [0, 293.66, 2], [2, 349.23, 2], [4, 440.0, 2], [6, 523.25, 2],
      [8, 587.33, 4], [12, 523.25, 2], [14, 440.0, 2], [16, 349.23, 2],
      [18, 440.0, 2], [20, 523.25, 2], [22, 587.33, 2], [24, 698.46, 8],
    ],
    bass: [
      [0, 146.83, 4], [4, 220.0, 4], [8, 233.08, 4], [12, 146.83, 4],
      [16, 146.83, 4], [20, 220.0, 4], [24, 261.63, 8],
    ],
    perc: [[0, 'kick'], [8, 'kick'], [16, 'kick'], [24, 'kick'], [4, 'snare'], [12, 'snare'], [20, 'snare'], [28, 'snare'], ...everyNSteps('hihat', 4, 2)],
  },
]

let currentPattern = BGM_PATTERNS[0]
let sixteenthSec = 60 / currentPattern.tempo / 4

/** 스테이지에 맞는 배경음 패턴(장르)으로 전환한다. 이미 재생 중이면 다음 마디부터 자연스럽게 바뀐다. */
export function setBgmVariant(index) {
  const pattern = BGM_PATTERNS[((index % BGM_PATTERNS.length) + BGM_PATTERNS.length) % BGM_PATTERNS.length]
  if (pattern === currentPattern) return
  currentPattern = pattern
  sixteenthSec = 60 / currentPattern.tempo / 4
  bgmStep = 0 // 새 패턴은 마디 처음부터 재생
}

let bgmGain = null
let bgmTimerId = null
let bgmStep = 0
let bgmNextNoteTime = 0
let noiseBuffer = null

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

/** 타악기용 화이트노이즈 버퍼(오디오 파일 없이 코드로 생성, 최초 1회만 만들고 재사용). */
function getNoiseBuffer() {
  const ctx = ensureCtx()
  if (!noiseBuffer) {
    const length = Math.floor(ctx.sampleRate * 0.3)
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function scheduleKick(time) {
  const ctx = ensureCtx()
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12)
  osc.connect(g)
  g.connect(ensureBgmGain())
  g.gain.setValueAtTime(0.5, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
  osc.start(time)
  osc.stop(time + 0.16)
}

function scheduleSnare(time) {
  const ctx = ensureCtx()
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer()
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1800
  bandpass.Q.value = 0.8
  const g = ctx.createGain()
  src.connect(bandpass)
  bandpass.connect(g)
  g.connect(ensureBgmGain())
  g.gain.setValueAtTime(0.35, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  src.start(time)
  src.stop(time + 0.13)
}

function scheduleHihat(time) {
  const ctx = ensureCtx()
  const src = ctx.createBufferSource()
  src.buffer = getNoiseBuffer()
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 7000
  const g = ctx.createGain()
  src.connect(highpass)
  highpass.connect(g)
  g.connect(ensureBgmGain())
  g.gain.setValueAtTime(0.16, time)
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.045)
  src.start(time)
  src.stop(time + 0.05)
}

function bgmScheduler() {
  const ctx = ensureCtx()
  while (bgmNextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
    const step = bgmStep % STEPS_PER_LOOP
    const { lead, bass, perc, wave } = currentPattern
    for (const [s, freq, len] of lead) {
      if (s === step) scheduleBgmNote(freq, bgmNextNoteTime, len * sixteenthSec * 0.92, wave, 0.055)
    }
    for (const [s, freq, len] of bass) {
      if (s === step) scheduleBgmNote(freq, bgmNextNoteTime, len * sixteenthSec * 0.92, 'triangle', 0.075)
    }
    for (const [s, type] of perc) {
      if (s !== step) continue
      if (type === 'kick') scheduleKick(bgmNextNoteTime)
      else if (type === 'snare') scheduleSnare(bgmNextNoteTime)
      else if (type === 'hihat') scheduleHihat(bgmNextNoteTime)
    }
    bgmNextNoteTime += sixteenthSec
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
