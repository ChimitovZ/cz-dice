<script setup>
import { computed, inject, onBeforeUnmount, onMounted, watch } from 'vue'
import { describeChange, plural, timeLabel } from '../composables/describeChange'

const dice = inject('dice')

const rows = computed(() =>
  dice.history.map((h) => ({ id: h.id, at: h.at, values: h.values, ...describeChange(h) })),
)

const countLabel = computed(() => {
  const n = dice.history.length
  return `${n} ${plural(n, 'действие', 'действия', 'действий')}`
})

function onKey(e) {
  if (e.key !== 'Escape' || !dice.historyOpen) return
  e.preventDefault()
  e.stopPropagation()
  dice.historyOpen = false
}

// Keep the page behind the sheet from scrolling while it is open.
watch(
  () => dice.historyOpen,
  (open) => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <section class="hist">
    <div class="bar">
      <button
        type="button"
        class="tog"
        :aria-expanded="dice.historyOpen"
        @click.stop="dice.historyOpen = !dice.historyOpen"
      >
        История
        <span class="badge" aria-hidden="true">{{ dice.history.length }}</span>
        <span class="chev">{{ dice.historyOpen ? '▾' : '▸' }}</span>
      </button>
      <button
        v-if="dice.history.length"
        type="button"
        class="clr"
        @click.stop="dice.clearHistory"
      >
        Очистить
      </button>
    </div>

    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="dice.historyOpen" class="veil" @click.self="dice.historyOpen = false">
          <div class="sheet" role="dialog" aria-label="История действий">
            <header class="sheet-head">
              <h2>История</h2>
              <span class="of">{{ countLabel }}</span>
              <button
                type="button"
                class="x"
                aria-label="Закрыть историю"
                @click="dice.historyOpen = false"
              >
                ×
              </button>
            </header>

            <ul class="rows">
              <li v-if="!rows.length" class="empty">
                Пока пусто. Бросьте стол или зажмите кубик — всё, что изменилось, появится здесь.
              </li>
              <li v-for="row in rows" :key="row.id" :class="['row', row.kind]">
                <div class="line">
                  <span class="time">{{ timeLabel(row.at) }}</span>
                  <span class="title">{{ row.title }}</span>
                  <span v-if="row.where" class="where">{{ row.where }}</span>
                </div>
                <div class="line">
                  <span v-for="(line, i) in row.lines" :key="i" class="move">
                    <span v-if="line.label" class="lbl">{{ line.label }}</span>
                    <b v-if="line.note" class="note">{{ line.note }}</b>
                    <template v-else>
                      <b class="was">{{ line.from }}</b>
                      <span class="arrow" aria-hidden="true">→</span>
                      <b class="now">{{ line.to }}</b>
                    </template>
                  </span>
                  <span v-if="row.extra > 0" class="more">+{{ row.extra }}</span>
                  <span class="faces" aria-hidden="true">{{ row.values.join(' ') }}</span>
                  <span class="sum">сумма <b>{{ row.sumAfter }}</b></span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.hist {
  min-height: 48px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

button {
  min-height: 48px;
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0 0.2rem;
}

.tog {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.badge {
  min-width: 1.35rem;
  padding: 0.05rem 0.3rem;
  border-radius: 999px;
  border: 1px solid rgb(212 175 55 / 0.4);
  background: rgb(0 0 0 / 0.35);
  font-family: var(--font-num);
  font-size: 0.62rem;
  letter-spacing: 0;
  color: var(--gold-hi);
  font-variant-numeric: tabular-nums;
}

.chev {
  opacity: 0.7;
}

.clr {
  font-size: 0.85rem;
}

/* --- sheet ---------------------------------------------------------------- */
.veil {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: grid;
  align-items: end;
  justify-items: center;
  padding: max(0.6rem, var(--safe-t)) max(0.6rem, var(--safe-r)) max(0.6rem, var(--safe-b)) max(0.6rem, var(--safe-l));
  background: rgb(3 5 3 / 0.55);
  backdrop-filter: blur(2px);
}

.sheet {
  width: min(34rem, 100%);
  max-height: min(72vh, 32rem);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.35rem;
  padding: 0.6rem 0.7rem 0.7rem;
  border-radius: 16px;
  border: 2px solid var(--gold);
  background:
    radial-gradient(120% 80% at 50% 0%, rgb(92 59 34 / 0.5), transparent 60%),
    linear-gradient(180deg, #1e160c, #0b0805);
  box-shadow:
    inset 0 0 0 1px rgb(245 215 110 / 0.26),
    0 18px 40px rgb(0 0 0 / 0.65);
}

.sheet-head {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold-hi);
}

.of {
  font-size: 0.68rem;
  color: var(--muted);
  opacity: 0.75;
}

.x {
  margin-left: auto;
  width: 34px;
  height: 34px;
  min-height: 34px;
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

.rows {
  margin: 0;
  padding: 0 0.1rem 0.1rem 0;
  list-style: none;
  display: grid;
  gap: 0.28rem;
  grid-auto-rows: min-content;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.empty {
  font-size: 0.78rem;
  line-height: 1.35;
  color: rgb(215 197 138 / 0.62);
  padding: 0.3rem 0.2rem;
}

.row {
  display: grid;
  gap: 0.16rem;
  padding: 0.34rem 0.55rem;
  border-radius: 9px;
  border: 1px solid var(--gold-lo);
  border-left: 3px solid var(--gold);
  background: linear-gradient(180deg, #241a0c, #150f07);
  animation: slip 0.3s ease;
}

.row.roll { border-left-color: var(--red-hi); }
.row.reroll { border-left-color: var(--gold-hi); }
.row.set { border-left-color: #7fd4a8; }
.row.count { border-left-color: #a9c7e8; }

.line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem 0.42rem;
}

.time {
  font-family: var(--font-num);
  font-size: 0.62rem;
  color: rgb(215 197 138 / 0.5);
  font-variant-numeric: tabular-nums;
}

.title {
  font-size: 0.76rem;
  color: var(--ivory-dim);
}

.where {
  padding: 0.04rem 0.32rem;
  border-radius: 999px;
  border: 1px solid rgb(212 175 55 / 0.35);
  font-size: 0.62rem;
  color: var(--gold-hi);
  white-space: nowrap;
}

.move {
  display: inline-flex;
  align-items: baseline;
  gap: 0.18rem;
  white-space: nowrap;
  font-size: 0.74rem;
}

.lbl {
  font-size: 0.64rem;
  color: rgb(215 197 138 / 0.75);
}

.note {
  font-family: var(--font);
  font-size: 0.7rem;
  font-weight: 500;
  color: #7fd4a8;
}

.move b {
  font-family: var(--font-num);
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
}

.was {
  color: rgb(244 239 230 / 0.5);
  text-decoration: line-through;
  text-decoration-color: rgb(193 18 31 / 0.8);
}

.now {
  color: var(--gold-hi);
}

.arrow {
  color: rgb(245 215 110 / 0.7);
  font-size: 0.72rem;
}

.more {
  font-size: 0.64rem;
  color: rgb(215 197 138 / 0.6);
}

.faces {
  font-family: var(--font-num);
  font-size: 0.64rem;
  letter-spacing: 0.06em;
  color: rgb(215 197 138 / 0.55);
  font-variant-numeric: tabular-nums;
}

.sum {
  margin-left: auto;
  font-size: 0.66rem;
  color: rgb(215 197 138 / 0.7);
  white-space: nowrap;
}

.sum b {
  font-family: var(--font-num);
  font-size: 0.8rem;
  color: var(--gold-hi);
}

@keyframes slip {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.18s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.1);
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(14px);
}

@media (prefers-reduced-motion: reduce) {
  .row,
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sheet,
  .sheet-leave-active .sheet {
    animation: none;
    transition: none;
  }
}

@media (orientation: landscape) and (max-height: 480px) {
  .sheet { max-height: 84vh; }
  .row { padding: 0.24rem 0.5rem; }
  .faces { display: none; }
}
</style>
