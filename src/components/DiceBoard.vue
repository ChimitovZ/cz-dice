<script setup>
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Die from './Die.vue'

const dice = inject('dice')
const board = ref(null)
const size = ref(72)
let ro

function fit() {
  const el = board.value
  const box = el?.parentElement
  if (!el || !box) return
  const n = dice.count
  const tr = box.getBoundingClientRect()
  const tp = getComputedStyle(box)
  const bp = getComputedStyle(el)
  const w =
    tr.width -
    parseFloat(tp.paddingLeft) -
    parseFloat(tp.paddingRight) -
    parseFloat(bp.paddingLeft) -
    parseFloat(bp.paddingRight)
  const h =
    tr.height -
    parseFloat(tp.paddingTop) -
    parseFloat(tp.paddingBottom) -
    parseFloat(bp.paddingTop) -
    parseFloat(bp.paddingBottom)
  if (w < 40 || h < 40) return
  const pack = n >= 7 ? 12 : n
  const gap = 10
  let best = 24
  for (let cols = 1; cols <= pack; cols++) {
    const rows = Math.ceil(pack / cols)
    const cellW = (w - gap * (cols - 1)) / cols
    const cellH = (h - gap * (rows - 1)) / rows
    const face = Math.min(cellW, (cellH - 6) / 1.5)
    if (face > best) best = face
  }
  size.value = Math.floor(Math.min(best, 120))
}

onMounted(() => {
  fit()
  ro = new ResizeObserver(fit)
  ro.observe(board.value.parentElement)
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
  gap: 10px;
  padding: 14px 14px 12px;
  min-height: 0;
  overflow: hidden;
  cursor: pointer;
}

@media (orientation: landscape) and (max-height: 480px) {
  .board { padding: 8px 12px; }
}

.board:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -4px;
  border-radius: var(--r);
}
</style>
