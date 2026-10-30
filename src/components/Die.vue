<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const HOLD_MS = 420
const MOVE_PX = 12

const props = defineProps({
  index: { type: Number, default: 0 },
  value: { type: Number, required: true },
  rolling: { type: Boolean, default: false },
  size: { type: Number, default: 72 },
  interactive: { type: Boolean, default: true },
  flash: { type: Boolean, default: false },
  flip: { type: Number, default: 0 },
})

const emit = defineEmits(['tap', 'long'])

const pressed = ref(false)
const turning = ref(false)
let holdTimer = 0
let turnTimer = 0
let longDone = false
let swiped = false
let sx = 0
let sy = 0

function clearHold() {
  clearTimeout(holdTimer)
  holdTimer = 0
}

function stopPress() {
  clearHold()
  pressed.value = false
}

function onDown(e) {
  if (!props.interactive || props.rolling) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  longDone = false
  swiped = false
  sx = e.clientX
  sy = e.clientY
  pressed.value = true
  clearHold()
  holdTimer = setTimeout(() => {
    holdTimer = 0
    pressed.value = false
    longDone = true
    emit('long', props.index)
    navigator.vibrate?.(22)
  }, HOLD_MS)
}

function onMove(e) {
  if (!pressed.value) return
  if (Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_PX) {
    swiped = true
    stopPress()
  }
}

function onClick(e) {
  if (!props.interactive) return
  e.stopPropagation()
  if (longDone) {
    longDone = false
    return
  }
  if (props.rolling || swiped) return
  emit('tap', props.index)
}

function onContext(e) {
  if (!props.interactive) return
  e.preventDefault()
  e.stopPropagation()
  if (props.rolling) return
  emit('long', props.index)
}

function onKey(e) {
  // Space is left to the app (it rolls the whole table); Enter is per-die.
  if (e.code !== 'Enter' && e.key !== 'Enter') return
  e.preventDefault()
  e.stopPropagation()
  if (!props.interactive || props.rolling) return
  if (e.shiftKey) emit('long', props.index)
  else emit('tap', props.index)
}

watch(
  () => props.flip,
  (n, prev) => {
    if (!n || n === prev || props.rolling) return
    turning.value = true
    clearTimeout(turnTimer)
    turnTimer = setTimeout(() => (turning.value = false), 620)
  },
)

onBeforeUnmount(() => {
  clearHold()
  clearTimeout(turnTimer)
})
</script>

<template>
  <div
    class="cell"
    :class="{ rolling, pressed, turning, flash, interactive }"
    :style="{ '--die': size + 'px' }"
    :role="interactive ? 'button' : null"
    :tabindex="interactive ? 0 : -1"
    :aria-label="interactive ? `Кубик ${index + 1}: ${value}. Нажмите — переброс, удерживайте — поворот` : `Грань ${value}`"
    @pointerdown="onDown"
    @pointerup="stopPress"
    @pointercancel="stopPress"
    @pointerleave="stopPress"
    @pointermove="onMove"
    @click="onClick"
    @contextmenu="onContext"
    @keydown="onKey"
  >
    <span class="glow" aria-hidden="true" />
    <div class="die" :class="{ rolling, turning }" :data-n="value" aria-hidden="true">
      <span class="pip p1" /><span class="pip p2" /><span class="pip p3" />
      <span class="pip p4" /><span class="pip p5" /><span class="pip p6" />
      <span class="pip p7" /><span class="pip p8" /><span class="pip p9" />
    </div>
    <strong class="chip"><span>{{ value }}</span></strong>
    <span v-if="interactive" class="hold-bar" aria-hidden="true" />
  </div>
</template>

<style scoped>
.cell {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 6px;
  width: var(--die);
  border-radius: 24%;
  -webkit-tap-highlight-color: transparent;
}

.cell.interactive {
  cursor: pointer;
  touch-action: manipulation;
}

.cell.interactive:hover .die {
  filter: brightness(1.08);
}

.cell.pressed .die {
  transform: scale(0.94);
  filter: brightness(0.92);
}

.cell:focus-visible {
  outline: 2px solid var(--gold-hi);
  outline-offset: 4px;
}

.glow {
  position: absolute;
  width: 78%;
  height: 22%;
  left: 11%;
  bottom: 28%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgb(245 215 110 / 0.7), transparent 72%);
  opacity: 0;
  transform: scale(0.7);
  pointer-events: none;
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.cell.rolling .glow,
.cell.flash .glow {
  opacity: 1;
  transform: scale(1);
}

.die {
  position: relative;
  width: var(--die);
  aspect-ratio: 1;
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  place-items: center;
  padding: 11%;
  border-radius: 22%;
  background:
    radial-gradient(circle at 28% 22%, rgb(255 255 255 / 0.55), transparent 34%),
    linear-gradient(155deg, rgb(226 58 66 / 0.92), rgb(193 18 31 / 0.86) 46%, rgb(110 8 18 / 0.94));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.45),
    inset 0 -8px 12px rgb(70 0 8 / 0.35),
    0 4px 0 rgb(0 0 0 / 0.22),
    0 10px 12px var(--shadow);
  transition: transform 0.16s ease, filter 0.16s ease;
}

.cell.flash .die {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.55),
    inset 0 -8px 12px rgb(70 0 8 / 0.3),
    0 0 0 3px var(--gold-hi),
    0 0 18px rgb(245 215 110 / 0.55),
    0 10px 12px var(--shadow);
}

.pip {
  width: 34%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, var(--ivory) 70%);
  box-shadow: inset 0 1px 1px rgb(0 0 0 / 0.35);
  opacity: 0;
}

.die[data-n="1"] .p5,
.die[data-n="2"] .p1,
.die[data-n="2"] .p9,
.die[data-n="3"] .p1,
.die[data-n="3"] .p5,
.die[data-n="3"] .p9,
.die[data-n="4"] .p1,
.die[data-n="4"] .p3,
.die[data-n="4"] .p7,
.die[data-n="4"] .p9,
.die[data-n="5"] .p1,
.die[data-n="5"] .p3,
.die[data-n="5"] .p5,
.die[data-n="5"] .p7,
.die[data-n="5"] .p9,
.die[data-n="6"] .p1,
.die[data-n="6"] .p3,
.die[data-n="6"] .p4,
.die[data-n="6"] .p6,
.die[data-n="6"] .p7,
.die[data-n="6"] .p9 {
  opacity: 1;
}

.chip {
  position: relative;
  z-index: 1;
  width: calc(var(--die) * 0.38);
  height: calc(var(--die) * 0.38);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: repeating-conic-gradient(from 6deg, var(--gold-lo) 0 8deg, var(--gold-hi) 8deg 12deg);
  box-shadow: 0 1px 0 var(--gold-hi), 0 2px 5px rgb(0 0 0 / 0.35);
}

.chip span {
  width: 70%;
  height: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #6e1512;
  font-family: var(--font-num);
  font-size: calc(var(--die) * 0.2);
  font-weight: 700;
  line-height: 1;
  color: var(--ivory);
  font-variant-numeric: tabular-nums;
}

/* Progress bar under the die while it is being held. */
.hold-bar {
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -4px;
  height: 3px;
  border-radius: 2px;
  overflow: hidden;
  background: rgb(245 215 110 / 0.16);
  opacity: 0;
  pointer-events: none;
}

.hold-bar::after {
  content: "";
  display: block;
  height: 100%;
  width: 100%;
  background: var(--gold-hi);
  transform: scaleX(0);
  transform-origin: left;
}

.cell.pressed .hold-bar {
  opacity: 1;
}

.cell.pressed .hold-bar::after {
  animation: hold 420ms linear forwards;
}

.rolling {
  animation: toss 0.52s ease-in-out;
}

.die.turning {
  animation: flip 0.6s cubic-bezier(0.3, 0.9, 0.3, 1);
}

@keyframes toss {
  0% { transform: rotate(-12deg) scale(0.94); }
  20% { transform: rotate(14deg) scale(1.06); }
  45% { transform: rotate(-9deg) scale(0.97); }
  70% { transform: rotate(8deg) scale(1.04); }
  100% { transform: rotate(0) scale(1); }
}

@keyframes flip {
  0% { transform: perspective(320px) rotateY(0) scale(1); }
  40% { transform: perspective(320px) rotateY(90deg) scale(0.88); }
  70% { transform: perspective(320px) rotateY(270deg) scale(0.94); }
  100% { transform: perspective(320px) rotateY(360deg) scale(1); }
}

@keyframes hold {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .rolling,
  .die.turning,
  .cell.pressed .hold-bar::after {
    animation: none;
  }
  .die {
    transition: none;
  }
  .glow,
  .cell.rolling .glow,
  .cell.flash .glow {
    opacity: 0;
    transition: none;
  }
  .cell.flash .die {
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.55),
      0 0 0 3px var(--gold-hi),
      0 10px 12px var(--shadow);
  }
}

@media (orientation: landscape) and (max-height: 480px) {
  .cell { gap: 0.28em; }
  .chip {
    width: calc(var(--die) * 0.32);
    height: calc(var(--die) * 0.32);
  }
  .chip span { font-size: calc(var(--die) * 0.17); }
}
</style>
