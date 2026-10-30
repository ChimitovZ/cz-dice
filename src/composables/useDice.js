import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import rollUrl from '../assets/roll.mp3'

const KEY = 'cz-dice-count'
const MIN = 1
const MAX = 12
const HIST = 20

function d6() {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / 6) * 6
  let x
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return 1 + (x % 6)
}

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
  const shown = ref([5, 2])
  const rolling = ref(false)
  // One journal for the whole game: every action records what changed and where.
  const history = ref([])
  const historyOpen = ref(false)
  const displaySum = ref(7)
  const pulse = ref(0)

  // Single-die gestures: which die has its face picker open.
  const picker = ref(-1)
  // Token bumped only when a die is physically turned to a new face.
  const turn = ref(null)

  const sum = computed(() => values.value.reduce((a, b) => a + b, 0))

  let raf = 0
  let flicker = 0
  let snd

  function playRoll() {
    if (!snd) snd = new Audio(rollUrl)
    snd.currentTime = 0
    snd.play().catch(() => {})
  }

  function buzz(ms) {
    navigator.vibrate?.(ms)
  }

  /**
   * Writes one row into the journal. `from`/`to` are the snapshots around
   * the action, so the feed can say exactly which die moved and how.
   */
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
    cancelAnimationFrame(raf)
    clearInterval(flicker)
    raf = 0
    flicker = 0
  }

  /**
   * Resizes the table. The faces already on the felt are kept,
   * extra dice are rolled in, and the switch lands in the journal.
   */
  function applyCount(n, persist) {
    stopAnim()
    rolling.value = false
    picker.value = -1
    const before = [...values.value]
    const next = Array.from({ length: n }, (_, i) => values.value[i] ?? d6())
    count.value = n
    values.value = next
    shown.value = [...next]
    displaySum.value = total(next)
    if (persist) {
      localStorage.setItem(KEY, String(n))
      commit({ kind: 'count', from: before, to: next })
    }
  }

  function setCount(n) {
    const next = Math.min(MAX, Math.max(MIN, n))
    if (next === count.value) return
    applyCount(next, true)
  }

  function finish(next, sumNow) {
    stopAnim()
    shown.value = [...next]
    displaySum.value = sumNow
    rolling.value = false
    picker.value = -1
  }

  function roll() {
    if (rolling.value) return
    stopAnim()
    picker.value = -1
    const before = [...values.value]
    const next = Array.from({ length: count.value }, d6)
    const sumNow = total(next)
    values.value = next
    displaySum.value = sumNow
    pulse.value += 1
    playRoll()
    buzz(16)
    commit({ kind: 'roll', from: before, to: next })

    if (reduceMotion()) {
      finish(next, sumNow)
      return
    }

    rolling.value = true
    const ms = duration()
    const start = performance.now()
    flicker = setInterval(() => {
      shown.value = shown.value.map(() => d6())
    }, 48)

    const tick = (now) => {
      if ((now - start) / ms < 1) {
        raf = requestAnimationFrame(tick)
        return
      }
      finish(next, sumNow)
    }
    raf = requestAnimationFrame(tick)
  }

  /** Rerolls one die only; the rest of the felt stays untouched. */
  function reroll(i) {
    if (rolling.value || i < 0 || i >= count.value) return
    picker.value = -1
    stopAnim()
    const before = [...values.value]
    const next = [...before]
    next[i] = d6()
    const sumNow = total(next)
    values.value = next
    shown.value = [...next]
    pulse.value += 1
    playRoll()
    buzz(12)
    commit({ kind: 'reroll', index: i, from: before, to: next })

    if (reduceMotion()) {
      displaySum.value = sumNow
      return
    }

    // Flicker only this die, then settle on the new face.
    const ms = Math.round(duration() * 0.8)
    const start = performance.now()
    let last = 0
    const tick = (now) => {
      if ((now - start) / ms < 1) {
        if (now - last > 60) {
          last = now
          const f = shown.value.slice()
          f[i] = d6()
          shown.value = f
        }
        raf = requestAnimationFrame(tick)
        return
      }
      stopAnim()
      shown.value = [...next]
      displaySum.value = sumNow
    }
    raf = requestAnimationFrame(tick)
  }

  /** Turns one die to a hand-picked face (long-press picker). */
  function setFace(i, face) {
    if (rolling.value || i < 0 || i >= count.value) return
    const before = [...values.value]
    const next = [...before]
    next[i] = clampFace(face)
    const sumNow = total(next)
    values.value = next
    shown.value = [...next]
    displaySum.value = sumNow
    picker.value = -1
    turn.value = { index: i, id: Date.now() + Math.random() }
    pulse.value += 1
    buzz(8)
    commit({ kind: 'set', index: i, from: before, to: next })
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
    shown,
    rolling,
    history,
    historyOpen,
    sum,
    displaySum,
    pulse,
    picker,
    turn,
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
