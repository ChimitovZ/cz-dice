<script setup>
import { inject } from 'vue'

const dice = inject('dice')
</script>

<template>
  <div class="ctrls">
    <button type="button" aria-label="Меньше кубиков" :disabled="dice.count <= dice.min" @click.stop="dice.dec">−</button>
    <span>{{ dice.count }}</span>
    <button type="button" aria-label="Больше кубиков" :disabled="dice.count >= dice.max" @click.stop="dice.inc">+</button>
  </div>
</template>

<style scoped>
.ctrls {
  display: flex;
  align-items: stretch;
  gap: 0.28rem;
  padding: 0.22rem 0.28rem;
  border-radius: 12px;
  border: 1px solid var(--gold-lo);
  background: linear-gradient(180deg, #6e5728, #3a2d14);
  box-shadow: inset 0 1px 0 rgb(245 215 110 / 0.35);
}

button {
  width: var(--chip);
  min-height: var(--chip);
  border: 1px solid var(--gold-hi);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #7a1b18 40%, transparent 41%),
    repeating-conic-gradient(from 6deg, var(--gold-lo) 0 8deg, var(--gold-hi) 8deg 12deg);
  color: var(--ivory);
  font-size: 1.45rem;
  line-height: 1;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.25);
  transition: transform 0.12s ease;
}

button:hover:not(:disabled) {
  transform: scale(1.04);
}

button:active:not(:disabled) {
  transform: scale(0.94);
}

button:disabled {
  opacity: 0.35;
}

span {
  min-width: 1.6rem;
  display: grid;
  place-items: center;
  text-align: center;
  font-family: var(--font-num);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gold-hi);
  font-variant-numeric: tabular-nums;
}
</style>
