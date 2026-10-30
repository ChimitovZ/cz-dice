<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Die from './Die.vue'
import FacePicker from './FacePicker.vue'

const dice = inject('dice')
const board = ref(null)
const size = ref(72)
const pickSize = ref(46)
const flashIndex = ref(-1)
let flashTimer = 0
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
  pickSize.value = Math.max(26, Math.min(58, Math.floor(size.value * 0.72)))
}

function onTap(i) {
  clearTimeout(flashTimer)
  flashIndex.value = i
  flashTimer = setTimeout(() => (flashIndex.value = -1), 620)
  dice.reroll(i)
}

function onLong(i) {
  clearTimeout(flashTimer)
  flashIndex.value = i
  flashTimer = setTimeout(() => (flashIndex.value = -1), 620)
  dice.openPicker(i)
}

function onPick(face) {
  dice.setFace(dice.picker, face)
}

onMounted(() => {
  fit()
  ro = new ResizeObserver(fit)
  ro.observe(board.value.parentElement)
})
watch(() => [dice.count, dice.historyOpen], () => nextTick(fit))
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(flashTimer)
})

const pickerOpen = computed(() => dice.picker >= 0)
</script>

<template>
  <section ref="board" class="board" @click.self="dice.roll">
    <Die
      v-for="(v, i) in dice.shown"
      :key="i"
      :index="i"
      :value="v"
      :rolling="dice.rolling"
      :size="size"
      :flash="flashIndex === i"
      :flip="dice.turn && dice.turn.index === i ? dice.turn.id : 0"
      @tap="onTap"
      @long="onLong"
    />
    <FacePicker
      :index="pickerOpen ? dice.picker : -1"
      :current="dice.values[dice.picker] ?? 1"
      :total="dice.count"
      :size="pickSize"
      @select="onPick"
      @close="dice.closePicker"
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
</style>
