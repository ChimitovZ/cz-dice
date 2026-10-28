<script setup>
import { onMounted, onUnmounted, provide } from 'vue'
import { useDice } from './composables/useDice'
import DiceBoard from './components/DiceBoard.vue'
import Controls from './components/Controls.vue'
import History from './components/History.vue'

const dice = useDice()
provide('dice', dice)

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
    <DiceBoard />
    <p class="sum" :class="{ pulse: dice.pulse }" :key="dice.pulse">
      Сумма: {{ dice.displaySum }}
    </p>
    <History />
    <div class="dock">
      <Controls />
      <button class="throw" type="button" :disabled="dice.rolling" @click="dice.roll">
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
  background:
    radial-gradient(120% 80% at 50% 0%, var(--felt-lit), transparent 55%),
    repeating-radial-gradient(circle at 20% 30%, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, var(--felt), var(--felt-deep));
}

.top {
  display: flex;
  align-items: center;
}

.dock {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem;
  align-items: stretch;
}

h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.sum {
  margin: 0;
  text-align: center;
  font-size: clamp(2rem, 8vw, 3.4rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.sum.pulse {
  animation: pop 0.45s cubic-bezier(0.2, 1.4, 0.3, 1);
}

.throw {
  min-height: 56px;
  border: 0;
  border-radius: 18px;
  background: var(--btn);
  color: var(--btn-ink);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 8px 0 var(--felt-edge), 0 14px 24px var(--shadow);
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

.throw:hover:not(:disabled) {
  filter: brightness(1.06);
}

.throw:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 4px 0 var(--felt-edge), 0 8px 14px var(--shadow);
}

.throw:disabled {
  opacity: 0.72;
}

@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@media (orientation: landscape) and (max-height: 480px) {
  .app { gap: 0.28rem; }
  .sum { font-size: 1.7rem; }
  .throw { min-height: 48px; font-size: 1.05rem; border-radius: 14px; }
}
</style>
