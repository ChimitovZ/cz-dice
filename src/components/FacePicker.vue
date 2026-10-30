<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Die from './Die.vue'
import { DICE_FACES } from '../composables/describeChange'

const props = defineProps({
  index: { type: Number, default: -1 },
  current: { type: Number, default: 1 },
  size: { type: Number, default: 44 },
  total: { type: Number, default: 1 },
})

const emit = defineEmits(['select', 'close'])

const open = computed(() => props.index >= 0)

// The release of the long-press lands on the fresh overlay: ignore it
// for a moment so the panel does not close the instant it appears.
let openedAt = 0
watch(open, (v) => {
  if (v) openedAt = performance.now()
})

function onVeil() {
  if (performance.now() - openedAt < 400) return
  emit('close')
}

function pick(face) {
  emit('select', face)
}

function onKey(e) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    emit('close')
    return
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    e.stopPropagation()
    const step = e.key === 'ArrowRight' ? 1 : -1
    emit('select', ((props.current - 1 + step + 6) % 6) + 1)
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="veil">
      <div v-if="open" class="veil" @click.self="onVeil">
        <div
          class="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="`Поворот кубика №${index + 1}`"
          @click.stop
          @contextmenu.prevent
        >
          <header class="head">
            <span class="n">Кубик №{{ index + 1 }}</span>
            <span class="of">из {{ total }}</span>
            <button type="button" class="x" aria-label="Закрыть" @click="emit('close')">×</button>
          </header>
          <p class="cap">Повернуть на грань</p>
          <div class="grid">
            <button
              v-for="face in DICE_FACES"
              :key="face"
              type="button"
              class="face"
              :class="{ on: face === current }"
              :aria-label="`Грань ${face}`"
              :aria-pressed="face === current"
              @click="pick(face)"
            >
              <Die :value="face" :size="size" :interactive="false" />
            </button>
          </div>
          <p class="hint">Грань, на которой кубик сейчас, обведена золотом</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: max(0.8rem, var(--safe-t)) max(0.8rem, var(--safe-r)) max(0.8rem, var(--safe-b)) max(0.8rem, var(--safe-l));
  background: rgb(3 5 3 / 0.62);
  backdrop-filter: blur(3px);
}

.panel {
  width: min(22rem, 100%);
  display: grid;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem 0.75rem;
  border-radius: 16px;
  border: 2px solid var(--gold);
  background:
    radial-gradient(120% 80% at 50% 0%, rgb(92 59 34 / 0.55), transparent 60%),
    linear-gradient(180deg, #1e160c, #0b0805);
  box-shadow:
    inset 0 0 0 1px rgb(245 215 110 / 0.28),
    0 18px 40px rgb(0 0 0 / 0.65);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.n {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold-hi);
}

.of {
  font-size: 0.7rem;
  color: var(--muted);
  opacity: 0.75;
}

.x {
  margin-left: auto;
  width: 34px;
  height: 34px;
  border: 1px solid var(--gold-lo);
  border-radius: 50%;
  background: rgb(0 0 0 / 0.35);
  color: var(--muted);
  font-size: 1.2rem;
  line-height: 1;
}

.x:hover {
  color: var(--gold-hi);
  border-color: var(--gold-hi);
}

.cap {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
}

.face {
  position: relative;
  display: grid;
  place-items: center;
  padding: 0.5rem 0.2rem;
  border-radius: 12px;
  border: 1px solid rgb(212 175 55 / 0.28);
  background: linear-gradient(180deg, #062018, #04140f);
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.face:hover {
  transform: translateY(-2px);
  border-color: var(--gold-hi);
  box-shadow: 0 6px 14px rgb(0 0 0 / 0.5);
}

.face:active {
  transform: scale(0.96);
}

.face.on {
  border-color: var(--gold-hi);
  box-shadow:
    0 0 0 2px rgb(245 215 110 / 0.5),
    0 0 16px rgb(245 215 110 / 0.25);
  background: linear-gradient(180deg, #14432f, #082018);
}

.hint {
  margin: 0;
  font-size: 0.66rem;
  line-height: 1.3;
  color: rgb(215 197 138 / 0.6);
  text-align: center;
}

.veil-enter-active,
.veil-leave-active {
  transition: opacity 0.18s ease;
}

.veil-enter-from,
.veil-leave-to {
  opacity: 0;
}

.veil-enter-active .panel,
.veil-leave-active .panel {
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.veil-enter-from .panel,
.veil-leave-to .panel {
  transform: scale(0.9) translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .veil-enter-active,
  .veil-leave-active,
  .veil-enter-active .panel,
  .veil-leave-active .panel,
  .face,
  .x {
    transition: none;
  }
}
</style>
