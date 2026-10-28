<script setup>
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Die from './Die.vue'

const dice = inject('dice')
const board = ref(null)
const size = ref(72)
let ro

function fit() {
  const el = board.value
  if (!el) return
  const n = dice.count
  const w = el.clientWidth
  const h = el.clientHeight
  const gap = 8
  let best = 40
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cellW = (w - gap * (cols - 1)) / cols
    const cellH = (h - gap * (rows - 1)) / rows
    const face = Math.min(cellW, cellH * 0.72)
    if (face > best) best = face
  }
  size.value = Math.max(44, Math.min(best, 128))
}

onMounted(() => {
  fit()
  ro = new ResizeObserver(fit)
  ro.observe(board.value)
})
watch(() => [dice.count, dice.historyOpen], () => nextTick(fit))
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <section ref="board" class="board" role="button" tabindex="0" @click="dice.roll">
    <Die
      v-for="(v, i) in dice.shown"
      :key="i"
      :value="v"
      :rolling="dice.rolling"
      :size="size"
    />
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 8px;
  min-height: 0;
  cursor: pointer;
}

.board:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -4px;
  border-radius: var(--r);
}
</style>
