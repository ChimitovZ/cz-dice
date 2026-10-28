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
  gap: 0.35rem;
}

button {
  width: 48px;
  min-height: 48px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgb(0 0 0 / 0.18);
  font-size: 1.55rem;
  line-height: 1;
  transition: transform 0.12s ease, background 0.12s ease;
}

button:hover:not(:disabled) {
  background: rgb(0 0 0 / 0.28);
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
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (prefers-color-scheme: light) {
  button { background: rgb(255 255 255 / 0.38); }
  button:hover:not(:disabled) { background: rgb(255 255 255 / 0.58); }
}
</style>
