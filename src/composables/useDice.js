import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import rollUrl from '../assets/roll.mp3'

const KEY = 'cz-dice-count'
const MIN = 1
const MAX = 12
const HIST = 8

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

export function useDice() {
  const count = ref(2)
  const values = ref([5, 2])
  const shown = ref([5, 2])
  const rolling = ref(false)
  const history = ref([])
  const historyOpen = ref(false)
  const displaySum = ref(7)
  const pulse = ref(0)

  const sum = computed(() => values.value.reduce((a, b) => a + b, 0))

  let raf = 0
  let flicker = 0
  let snd

  function playRoll() {
    if (!snd) snd = new Audio(rollUrl)
    snd.currentTime = 0
    snd.play().catch(() => {})
  }

  function applyCount(n, persist) {
    stopAnim()
    rolling.value = false
    const next = Array.from({ length: n }, (_, i) => values.value[i] ?? d6())
    count.value = n
    values.value = next
    shown.value = [...next]
    displaySum.value = next.reduce((a, b) => a + b, 0)
    if (persist) localStorage.setItem(KEY, String(n))
  }

  function setCount(n) {
    applyCount(Math.min(MAX, Math.max(MIN, n)), true)
  }

  function stopAnim() {
    cancelAnimationFrame(raf)
    clearInterval(flicker)
    raf = 0
    flicker = 0
  }

  function pushHistory(vals, total) {
    history.value = [{ id: Date.now(), sum: total, values: [...vals] }, ...history.value].slice(0, HIST)
  }

  function finish(next, total) {
    stopAnim()
    shown.value = [...next]
    displaySum.value = total
    rolling.value = false
    pushHistory(next, total)
  }

  function roll() {
    if (rolling.value) return
    const next = Array.from({ length: count.value }, d6)
    const total = next.reduce((a, b) => a + b, 0)
    values.value = next
    displaySum.value = total
    pulse.value += 1
    playRoll()
    if (navigator.vibrate) navigator.vibrate(16)

    if (reduceMotion()) {
      finish(next, total)
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
      finish(next, total)
    }
    raf = requestAnimationFrame(tick)
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
    min: MIN,
    max: MAX,
    inc: () => setCount(count.value + 1),
    dec: () => setCount(count.value - 1),
    roll,
    clearHistory: () => {
      history.value = []
    },
  })
}
