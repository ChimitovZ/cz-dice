<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Die from './Die.vue'
import FacePicker from './FacePicker.vue'

const dice = inject('dice')
const board = ref(null)
const slots = ref(null)
const canvas = ref(null)
const size = ref(72)
const columns = ref(1)
const slotWidth = computed(() => `calc(${size.value * columns.value}px + ${columns.value - 1} * var(--dice-gap))`)
const pickSize = computed(() => Math.max(26, Math.min(58, Math.floor(size.value * 0.72))))
const flashIndex = ref(-1)
const sceneReady = ref(false)
const showScene = computed(() => sceneReady.value && (!dice.motion || dice.motion.physics))
let flashTimer = 0
let ro
let tableScene
let sceneMotion
let sceneValues

function fit() {
  const el = board.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const w = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const h = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
  const gap = parseFloat(style.gap)
  const chipRatio = parseFloat(style.getPropertyValue('--die-chip-ratio'))
  const labelGap = parseFloat(style.getPropertyValue('--die-label-gap'))

  let best = 0
  let bestColumns = 1
  const count = dice.count
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cellW = (w - gap * (cols - 1)) / cols
    const cellH = (h - gap * (rows - 1)) / rows
    const face = Math.min(cellW, (cellH - labelGap) / (1 + chipRatio))
    if (face > best) {
      best = face
      bestColumns = cols
    }
  }
  size.value = Math.max(1, Math.floor(Math.min(best, 120)))
  columns.value = bestColumns
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

function syncScene() {
  if (!tableScene) return
  const rect = board.value.getBoundingClientRect()
  const centers = Array.from(slots.value.querySelectorAll('.scene'), (slot) => {
    const face = slot.getBoundingClientRect()
    return [face.left - rect.left + face.width / 2, face.top - rect.top + face.height / 2]
  })
  if (!rect.width || !rect.height || centers.length !== dice.values.length) return

  const resized = tableScene.layout(rect.width, rect.height, size.value, centers)
  const motion = dice.motion
  const values = dice.values
  const newValues = values !== sceneValues
  sceneValues = values
  if (motion !== sceneMotion) {
    sceneMotion = motion
    if (motion?.physics) {
      tableScene.play(motion, values, (faces) => {
        if (faces === null) dice.cancelMotion(motion)
        else dice.settleMotion(motion, faces)
      })
    }
    else tableScene.show(values)
  } else if (resized || newValues) {
    tableScene.show(values)
    if (motion?.physics) dice.cancelMotion(motion)
  }
}

function dropScene() {
  tableScene?.dispose()
  tableScene = null
  sceneReady.value = false
  dice.setPhysicsReady(false)
  if (dice.motion?.physics) dice.cancelMotion(dice.motion)
}

onMounted(async () => {
  fit()
  ro = new ResizeObserver(() => {
    fit()
    nextTick(syncScene)
  })
  ro.observe(board.value)

  try {
    const { createTableScene } = await import('../dice/tableScene.js')
    if (!canvas.value) return
    tableScene = createTableScene(canvas.value)
    if (!tableScene) return
    syncScene()
    sceneReady.value = true
    dice.setPhysicsReady(true)
  } catch (error) {
    console.warn('Could not initialize the 3D dice table', error)
    dropScene()
  }
})
watch(() => dice.count, fit)
watch([size, columns, () => dice.values, () => dice.motion], () => nextTick(syncScene), { flush: 'post' })
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(flashTimer)
  tableScene?.dispose()
  tableScene = null
  dice.setPhysicsReady(false)
})

const pickerOpen = computed(() => dice.picker >= 0)
</script>

<template>
  <section
    ref="board"
    class="board"
    @click.self="dice.roll()"
  >
    <canvas
      v-show="showScene"
      ref="canvas"
      class="dice-canvas"
      aria-hidden="true"
      @webglcontextlost="dropScene"
    />
    <div ref="slots" class="slots" :style="{ width: slotWidth }" @click.self="dice.roll()">
      <Die
        v-for="(v, i) in dice.values"
        :key="i"
        :index="i"
        :value="v"
        :rolling="dice.rolling || (dice.motion?.physics && dice.motion.kind === 'reroll' && dice.motion.index === i)"
        :size="size"
        :flash="flashIndex === i"
        :rendered="showScene"
        :motion="dice.motion?.kind === 'roll' || dice.motion?.index === i ? dice.motion : null"
        @tap="onTap"
        @long="onLong"
      />
    </div>
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
  --die-chip-ratio: 0.38;
  --die-label-gap: 6px;
  --dice-gap: 10px;
  display: grid;
  place-content: center;
  gap: var(--dice-gap);
  padding: 14px 14px 12px;
  min-height: 0;
  overflow: hidden;
  cursor: pointer;
}

.slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--dice-gap);
}

.dice-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

@media (orientation: landscape) and (max-height: 480px) {
  .board {
    --die-chip-ratio: 0.32;
    --die-label-gap: 4px;
    padding: 8px 12px;
  }
}
</style>
