import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import rollUrl from '../assets/roll.mp3'
import { rollDie } from './rollDie'

const KEY = 'cz-dice-count'
const MIN = 1
const MAX = 12
const HIST = 20
const TOSS_MS = 560

function duration() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return 400 + (buf[0] % 201)
}

function reduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clampFace(n) {
  return Math.min(6, Math.max(1, Math.round(Number(n)) || 1))
}

function total(vals) {
  return vals.reduce((a, b) => a + b, 0)
}

export function useDice() {
  const count = ref(2)
  const values = ref([5, 2])
  const rolling = ref(false)
  // One journal for the whole game: every action records what changed and where.
  const history = ref([])
  const historyOpen = ref(false)
  const displaySum = ref(7)
  const pulse = ref(0)

  // Single-die gestures: which die has its face picker open.
  const picker = ref(-1)
  const motion = ref(null)
  const outcome = ref({ win: false, double: false })

  const sum = computed(() => values.value.reduce((a, b) => a + b, 0))

  let settleTimer = 0
  let physicsReady = false
  let snd

  function playRoll() {
    if (!snd) snd = new Audio(rollUrl)
    snd.currentTime = 0
    snd.play().catch(() => {})
  }

  function buzz(ms) {
    navigator.vibrate?.(ms)
  }

  function commit(entry) {
    history.value = [
      {
        id: Date.now() + Math.random(),
        at: new Date(),
        sumBefore: total(entry.from),
        sumAfter: total(entry.to),
        values: [...entry.to],
        ...entry,
      },
      ...history.value,
    ].slice(0, HIST)
  }

  function stopAnim() {
    clearTimeout(settleTimer)
    motion.value = null
  }

  function cancelMotion(current) {
    if (!current || motion.value !== current) return
    stopAnim()
    rolling.value = false
    displaySum.value = sum.value
  }

  function settleMotion(current, faces = values.value) {
    if (!current || motion.value !== current) return
    stopAnim()
    if (current.kind !== 'turn') finishRoll(current, faces)
  }

  function startMotion(entry, duration, instant = false) {
    motion.value = { ...entry, duration, instant, physics: physicsReady }
    const current = motion.value
    if (!current.physics) settleTimer = setTimeout(() => settleMotion(current), duration)
  }

  function startRoll(entry, duration) {
    const instant = reduceMotion()
    playRoll()
    if (!physicsReady) {
      const next = values.value.map((value, index) =>
        entry.kind === 'roll' || index === entry.index ? rollDie() : value,
      )
      if (instant) {
        finishRoll(entry, next)
        return
      }
      values.value = next
    }
    rolling.value = entry.kind === 'roll'
    startMotion(entry, duration, instant)
  }

  function saveCount(n) {
    try {
      localStorage.setItem(KEY, String(n))
    } catch {
      // Keep the game playable when storage is unavailable.
    }
  }

  /**
   * Resizes the table. The faces already on the felt are kept,
   * extra dice are rolled in, and the switch lands in the journal.
   */
  function applyCount(n, persist) {
    stopAnim()
    rolling.value = false
    picker.value = -1
    outcome.value = { win: false, double: false }
    const before = [...values.value]
    const next = Array.from({ length: n }, (_, i) => values.value[i] ?? rollDie())
    count.value = n
    values.value = next
    displaySum.value = total(next)
    if (persist) {
      saveCount(n)
      commit({ kind: 'count', from: before, to: next })
    }
  }

  function setCount(n) {
    const next = Math.min(MAX, Math.max(MIN, n))
    if (next === count.value) return
    applyCount(next, true)
  }

  function finishRoll({ kind, from, index }, faces) {
    values.value = faces
    displaySum.value = total(faces)
    pulse.value += 1
    rolling.value = false
    if (kind === 'roll') picker.value = -1
    commit({ kind, index, from, to: faces })
    celebrate(faces)
  }

  function celebrate(faces) {
    const same = faces.length > 1 && faces.every((v) => v === faces[0])
    const totalAll = total(faces) === faces.length * 6
    outcome.value = { win: same || totalAll, double: same }
  }

  function roll(nextCount = count.value) {
    if (rolling.value) return
    stopAnim()
    picker.value = -1
    outcome.value = { win: false, double: false }
    const before = [...values.value]
    if (nextCount !== count.value) {
      count.value = nextCount
      values.value = Array.from({ length: nextCount }, (_, index) => before[index] ?? 1)
      saveCount(nextCount)
    }
    buzz(16)
    startRoll({ kind: 'roll', from: before }, TOSS_MS)
  }

  /** Rerolls one die only; the rest of the felt stays untouched. */
  function reroll(i) {
    if (rolling.value || i < 0 || i >= count.value) return
    picker.value = -1
    stopAnim()
    outcome.value = { win: false, double: false }
    const before = [...values.value]
    buzz(12)
    startRoll({ kind: 'reroll', index: i, from: before }, Math.round(duration() * 0.8))
  }

  /** Turns one die to a hand-picked face (long-press picker). */
  function setFace(i, face) {
    if (rolling.value || i < 0 || i >= count.value) return
    stopAnim()
    const before = [...values.value]
    const next = [...before]
    next[i] = clampFace(face)
    const sumNow = total(next)
    values.value = next
    displaySum.value = sumNow
    picker.value = -1
    if (!reduceMotion()) startMotion({ kind: 'turn', index: i, from: before }, 420)
    pulse.value += 1
    buzz(8)
    commit({ kind: 'set', index: i, from: before, to: next })
    celebrate(next)
  }

  function openPicker(i) {
    if (rolling.value || i < 0 || i >= count.value) return
    picker.value = i
  }

  function closePicker() {
    picker.value = -1
  }

  onMounted(() => {
    const saved = Number(localStorage.getItem(KEY))
    if (Number.isInteger(saved) && saved >= MIN && saved <= MAX) applyCount(saved, false)
  })

  onUnmounted(stopAnim)

  return reactive({
    count,
    values,
    rolling,
    history,
    historyOpen,
    sum,
    displaySum,
    pulse,
    picker,
    motion,
    cancelMotion,
    settleMotion,
    setPhysicsReady: (ready) => { physicsReady = ready },
    outcome,
    min: MIN,
    max: MAX,
    inc: () => setCount(count.value + 1),
    dec: () => setCount(count.value - 1),
    roll,
    reroll,
    setFace,
    openPicker,
    closePicker,
    clearHistory: () => {
      history.value = []
    },
  })
}
