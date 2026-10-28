<script setup>
import { computed, onMounted, onUnmounted, provide } from 'vue'
import { useDice } from './composables/useDice'
import DiceBoard from './components/DiceBoard.vue'
import Controls from './components/Controls.vue'
import History from './components/History.vue'

const dice = useDice()
provide('dice', dice)

const tableWin = computed(() => {
  if (dice.rolling) return false
  const s = dice.shown
  const same = s.length > 1 && s.every((v) => v === s[0])
  const total = s.reduce((a, b) => a + b, 0)
  return same || total === dice.count * 6
})

const tableDouble = computed(() => {
  if (dice.rolling) return false
  const s = dice.shown
  return s.length > 1 && s.every((v) => v === s[0])
})

function cubesMark(n) {
  const m = n % 10
  const t = n % 100
  let w = 'КУБИКОВ'
  if (t < 11 || t > 14) {
    if (m === 1) w = 'КУБИК'
    else if (m >= 2 && m <= 4) w = 'КУБИКА'
  }
  return `${n} ${w} - ВАШ ХОД`
}

function onKey(e) {
  if (e.code !== 'Space' && e.code !== 'Enter') return
  if (e.repeat) return
  e.preventDefault()
  dice.roll()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <header class="top">
      <h1>Кубики</h1>
    </header>
    <div
      class="table"
      :class="{ win: tableWin, double: tableDouble }"
    >
      <div class="rail" aria-hidden="true">
        <div class="edge top">
          <i v-for="n in 8" :key="'t' + n" class="bulb" :style="{ '--i': n }" />
        </div>
        <div class="edge right">
          <i v-for="n in 4" :key="'r' + n" class="bulb" :style="{ '--i': n + 8 }" />
        </div>
        <div class="edge bot">
          <i v-for="n in 8" :key="'b' + n" class="bulb" :style="{ '--i': n + 12 }" />
        </div>
        <div class="edge left">
          <i v-for="n in 4" :key="'l' + n" class="bulb" :style="{ '--i': n + 20 }" />
        </div>
      </div>
      <p class="felt-mark" aria-hidden="true">{{ cubesMark(dice.count) }}</p>
      <div v-if="tableDouble" class="sparks" aria-hidden="true">
        <i v-for="n in 10" :key="n" class="spark" :style="{ '--i': n }" />
      </div>
      <DiceBoard />
    </div>
    <p class="sum" :class="{ pulse: dice.pulse }" :key="dice.pulse">
      <span class="sum-lab">Сумма</span>
      <span class="sum-n">{{ dice.displaySum }}</span>
    </p>
    <History />
    <div class="dock">
      <Controls />
      <button class="throw" type="button" :disabled="dice.rolling" @click="dice.roll">
        <span class="gleam" aria-hidden="true" />
        Бросить
      </button>
    </div>
  </div>
</template>

<style scoped>
.app {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto auto auto;
  gap: 0.45rem;
  padding: calc(0.55rem + var(--safe-t)) calc(0.7rem + var(--safe-r)) calc(0.55rem + var(--safe-b)) calc(0.7rem + var(--safe-l));
  background: radial-gradient(120% 70% at 50% 0%, #1a120c, var(--bg) 62%);
}

.top {
  display: flex;
  align-items: center;
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold-hi);
  text-shadow: 0 1px 0 var(--gold-lo), 0 0 10px rgb(212 175 55 / 0.28);
}

.table {
  position: relative;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  isolation: isolate;
  border-radius: 18px;
  padding: 16px 14px 18px;
  background: linear-gradient(180deg, var(--wood-hi), var(--wood-lo));
  border: 2px solid var(--gold);
  box-shadow:
    inset 0 0 0 1px var(--gold-hi),
    inset 0 0 0 10px var(--wood),
    inset 0 0 0 12px rgb(184 134 11 / 0.7),
    inset 0 12px 22px rgb(0 0 0 / 0.5),
    0 10px 22px var(--shadow);
}

.table::before {
  content: "";
  position: absolute;
  inset: 12px;
  z-index: 0;
  border-radius: 10px;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 40%, transparent 42%, rgb(0 0 0 / 0.42) 100%),
    radial-gradient(80% 70% at 50% 20%, var(--felt-lit), transparent 55%),
    var(--felt-noise),
    linear-gradient(180deg, var(--felt), var(--felt-deep));
  box-shadow: inset 0 0 28px rgb(0 0 0 / 0.5);
}

.table.double::after {
  content: "";
  position: absolute;
  inset: 12px;
  z-index: 2;
  border-radius: 10px;
  background: rgb(245 215 110 / 0.22);
  animation: flash 0.55s ease forwards;
  pointer-events: none;
}

.table :deep(.board) {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}

.rail {
  position: absolute;
  inset: 4px;
  z-index: 2;
  pointer-events: none;
}

.edge {
  position: absolute;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.edge.top { top: 0; left: 12px; right: 12px; }
.edge.bot { bottom: 0; left: 12px; right: 12px; }
.edge.right { top: 12px; right: 0; bottom: 12px; flex-direction: column; }
.edge.left { top: 12px; left: 0; bottom: 12px; flex-direction: column; }

.bulb {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold-hi);
  opacity: 0.22;
  animation: blink 1.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * 75ms);
}

.win .bulb {
  animation-duration: 0.55s;
  opacity: 0.55;
}

.felt-mark {
  position: absolute;
  top: 14px;
  left: 0;
  right: 0;
  z-index: 2;
  margin: 0;
  text-align: center;
  pointer-events: none;
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  color: rgb(245 215 110 / 0.42);
}

.sparks {
  position: absolute;
  inset: 18%;
  z-index: 2;
  pointer-events: none;
}

.spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: var(--gold-hi);
  opacity: 0;
  animation: spark 0.7s ease-out forwards;
  animation-delay: calc(var(--i) * 28ms);
  transform: rotate(calc(var(--i) * 36deg)) translateY(-8px);
}

.sum {
  position: relative;
  margin: 0 auto;
  width: min(100%, 16rem);
  display: grid;
  justify-items: center;
  gap: 0.12rem;
  padding: 0.38rem 0.9rem 0.48rem;
  overflow: hidden;
  border-radius: 8px;
  border: 2px solid var(--gold);
  background: linear-gradient(180deg, #2a210e, #0c0a06);
  box-shadow: inset 0 0 0 1px #6a5420;
}

.sum-lab {
  font-family: var(--font-display);
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
}

.sum-n {
  font-family: var(--font-num);
  font-size: clamp(2rem, 8vw, 3.2rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--gold-hi);
  font-variant-numeric: tabular-nums;
}

.sum.pulse .sum-n {
  animation: tally 0.42s ease;
}

.sum.pulse::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgb(245 215 110 / 0.28);
  animation: flash 0.42s ease forwards;
  pointer-events: none;
}

.dock {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem;
  align-items: stretch;
}

.throw {
  position: relative;
  overflow: hidden;
  min-height: 56px;
  border: 2px solid var(--gold);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--red-hi), var(--red) 48%, var(--red-lo));
  color: var(--ivory);
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.28), 0 6px 0 var(--red-lo);
  transition: transform 0.12s ease;
}

.throw:hover:not(:disabled) {
  transform: translateY(-1px);
}

.throw:active:not(:disabled) {
  transform: translateY(4px);
}

.throw:disabled {
  opacity: 0.72;
}

.throw:disabled .gleam {
  animation: none;
}

.gleam {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 38%, rgb(255 255 255 / 0.28) 50%, transparent 62%);
  transform: translateX(-120%);
  animation: gleam 2.8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes blink {
  0%, 100% { opacity: 0.18; transform: scale(0.85); }
  50% { opacity: 0.9; transform: scale(1.15); }
}

@keyframes spark {
  0% { opacity: 1; transform: rotate(calc(var(--i) * 36deg)) translateY(0) scale(1); }
  100% { opacity: 0; transform: rotate(calc(var(--i) * 36deg)) translateY(-42px) scale(0.4); }
}

@keyframes tally {
  0% { opacity: 0.4; transform: translateY(0.18em); }
  45% { opacity: 1; transform: translateY(-0.05em); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes gleam {
  0%, 58% { transform: translateX(-120%); }
  78%, 100% { transform: translateX(120%); }
}

@media (prefers-reduced-motion: reduce) {
  .table.double::after,
  .sum.pulse::after {
    animation: none;
    background: transparent;
  }
  .bulb { animation: none; opacity: 0.35; }
  .sparks,
  .gleam { display: none; }
}

@media (max-width: 420px) {
  .felt-mark { display: none; }
  .edge.left,
  .edge.right { display: none; }
  .edge.top .bulb:nth-child(even),
  .edge.bot .bulb:nth-child(even) { display: none; }
}

@media (orientation: landscape) and (max-height: 480px) {
  .app { gap: 0.28rem; }
  .sum { width: min(100%, 12rem); padding: 0.22rem 0.7rem 0.28rem; }
  .sum-n { font-size: 1.7rem; }
  .throw { min-height: 48px; font-size: 1rem; border-radius: 14px; }
  .felt-mark { display: none; }
  .table { padding: 7px 8px; }
  .table::before,
  .table.double::after { inset: 7px; }
  .rail { inset: 2px; }
}
</style>
