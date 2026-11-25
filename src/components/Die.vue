<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DIE_PIPS } from '../dice/faces.js'

const HOLD_MS = 420
const MOVE_PX = 12
// Rotations bring a face forward. The inverse places it on the cube.
const FACES = {
  1: { x: 0, y: 0, side: 2 },
  2: { x: 0, y: -90, side: 6 },
  3: { x: -90, y: 0, side: 2 },
  4: { x: 90, y: 0, side: 2 },
  5: { x: 0, y: 90, side: 1 },
  6: { x: 0, y: 180, side: 5 },
}

const props = defineProps({
  index: { type: Number, default: 0 },
  value: { type: Number, required: true },
  rolling: { type: Boolean, default: false },
  size: { type: Number, default: 72 },
  interactive: { type: Boolean, default: true },
  flash: { type: Boolean, default: false },
  rendered: { type: Boolean, default: false },
  motion: { type: Object, default: null },
})

const emit = defineEmits(['tap', 'long'])

const pressed = ref(false)
const cube = ref(null)
const face = computed(() => FACES[props.value])
const shown = computed(() => {
  if (!props.motion || props.motion.kind === 'turn') return props.value
  return props.motion.from[props.index] ?? 1
})
let animation
let holdTimer = 0
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

function pose(x, y, lift = '0%') {
  return `translateY(${lift}) rotateX(${x}deg) rotateY(${y}deg)`
}

function playMotion(motion) {
  animation?.cancel()
  if (!motion || !cube.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const from = FACES[motion.from[props.index] ?? 1]
  const to = face.value
  const x = to.x + Math.round((from.x - to.x) / 360) * 360
  const y = to.y + Math.round((from.y - to.y) / 360) * 360
  const start = { transform: pose(from.x, from.y) }

  if (motion.kind === 'turn') {
    const end = { transform: pose(x, from === to ? y + 360 : y) }
    animation = cube.value.animate([start, end], {
      duration: motion.duration,
      easing: 'cubic-bezier(0.25, 0.7, 0.35, 1)',
    })
    return
  }

  const direction = props.index % 2 ? -1 : 1
  const delay = motion.kind === 'roll' ? (props.index % 5) * 12 : 0
  animation = cube.value.animate([
    start,
    { transform: pose(from.x + 145 * direction, from.y + 125, '-24%'), offset: 0.35 },
    { transform: pose(x + 310 * direction, y + 295, '2%'), offset: 0.73 },
    { transform: pose(x + 360 * direction, y + 360) },
  ], {
    delay,
    duration: motion.duration - delay,
    easing: 'ease-out',
    fill: 'backwards',
  })
}

onMounted(() => playMotion(props.motion))
watch(() => props.motion, playMotion, { flush: 'post' })

onBeforeUnmount(() => {
  clearHold()
  animation?.cancel()
})
</script>

<template>
  <div
    class="cell"
    :class="{ rolling, pressed, flash, interactive, rendered, 'hide-chip': rendered && motion?.physics && motion.kind !== 'turn' }"
    :style="{ '--die': size + 'px' }"
    :role="interactive ? 'button' : null"
    :tabindex="interactive ? 0 : -1"
    :aria-disabled="interactive && rolling ? true : null"
    :aria-label="interactive ? `Кубик ${index + 1}: ${shown}. Нажмите для переброса, удерживайте для поворота` : `Грань ${value}`"
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
    <div class="scene" aria-hidden="true">
      <div v-if="!rendered" class="view">
        <div ref="cube" class="cube" :style="{ transform: pose(face.x, face.y) }">
          <div
            v-for="(side, n) in FACES"
            :key="n"
            class="die-face"
            :class="{ front: side === face, shaded: Number(n) === face.side }"
            :style="{ '--face-x': -side.x + 'deg', '--face-y': -side.y + 'deg' }"
            :data-n="n"
          >
            <span
              v-for="pip in DIE_PIPS[n]"
              :key="pip"
              class="pip"
              :style="{ gridArea: `${Math.ceil(pip / 3)} / ${(pip - 1) % 3 + 1}` }"
            />
          </div>
        </div>
      </div>
    </div>
    <strong class="chip"><span>{{ shown }}</span></strong>
    <span v-if="interactive" class="hold-bar" aria-hidden="true" />
  </div>
</template>

<style scoped>
.cell {
  position: relative;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: var(--die-label-gap, 6px);
  width: var(--die);
  border-radius: 24%;
  -webkit-tap-highlight-color: transparent;
}

.cell.interactive {
  cursor: pointer;
  touch-action: manipulation;
}

.cell.interactive:hover .front {
  border-color: #ffacaa;
}

.cell.pressed .view {
  scale: 0.94;
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

.cell.hide-chip .glow {
  opacity: 0;
}

.scene {
  position: relative;
  width: var(--die);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  perspective: calc(var(--die) * 5);
  pointer-events: none;
}

.scene::before {
  content: "";
  position: absolute;
  inset: 67% 3% 0;
  background: radial-gradient(ellipse, var(--shadow), transparent 72%);
}

.cell.rendered .scene::before {
  content: none;
}

.cell.hide-chip .chip {
  visibility: hidden;
}

.view {
  position: relative;
  width: 68%;
  aspect-ratio: 1;
  transform: rotateX(-23deg) rotateY(-27deg);
  transform-style: preserve-3d;
  transition: scale 0.16s ease;
}

.cube,
.die-face {
  position: absolute;
  inset: 0;
}

.cube {
  transform-style: preserve-3d;
}

.die-face {
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  place-items: center;
  padding: 12%;
  border: 1px solid rgb(255 177 165 / 0.55);
  border-radius: 3%;
  backface-visibility: hidden;
  transform: rotateY(var(--face-y)) rotateX(var(--face-x)) translateZ(calc(var(--die) * 0.34));
  background:
    radial-gradient(ellipse at 26% 8%, rgb(255 214 193 / 0.35), transparent 70%),
    linear-gradient(150deg, #de5451, #ae1725 65%, #830e1b);
  box-shadow: inset 0 0 0 1px rgb(83 6 14 / 0.28);
}

.die-face.shaded {
  background: linear-gradient(150deg, #9e1f2a, #650c17);
  border-color: rgb(222 100 99 / 0.65);
}

.cell.flash .front {
  border-color: var(--gold-hi);
  box-shadow: inset 0 0 0 1px var(--gold-hi);
}

.pip {
  width: 43%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--ivory);
  box-shadow: inset 0 1px 1px rgb(72 20 20 / 0.35), 0 0 0 1px rgb(74 4 15 / 0.24);
}

.shaded .pip {
  background: var(--ivory-dim);
}

.chip {
  position: relative;
  z-index: 1;
  width: calc(var(--die) * var(--die-chip-ratio, 0.38));
  height: calc(var(--die) * var(--die-chip-ratio, 0.38));
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

@keyframes hold {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .cell.pressed .hold-bar::after {
    animation: none;
  }
  .view {
    transition: none;
  }
  .glow,
  .cell.rolling .glow,
  .cell.flash .glow {
    opacity: 0;
    transition: none;
  }
}

@media (orientation: landscape) and (max-height: 480px) {
  .cell { gap: var(--die-label-gap, 0.28em); }
  .chip {
    width: calc(var(--die) * var(--die-chip-ratio, 0.32));
    height: calc(var(--die) * var(--die-chip-ratio, 0.32));
  }
  .chip span { font-size: calc(var(--die) * 0.17); }
}
</style>
