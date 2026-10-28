<script setup>
import { inject } from 'vue'

const dice = inject('dice')
</script>

<template>
  <section class="hist" @click.stop>
    <div class="bar">
      <button type="button" class="tog" @click="dice.historyOpen = !dice.historyOpen">
        История
        <span>{{ dice.historyOpen ? '▾' : '▸' }}</span>
      </button>
      <button v-if="dice.history.length" type="button" class="clr" @click="dice.clearHistory">
        Очистить
      </button>
    </div>
    <ul v-if="dice.historyOpen">
      <li v-if="!dice.history.length">Пока пусто</li>
      <li v-for="row in dice.history" :key="row.id">
        <b>{{ row.sum }}</b>
        <span>{{ row.values.join(' ') }}</span>
      </li>
    </ul>
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
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.clr {
  font-size: 0.85rem;
}

ul {
  margin: 0;
  padding: 0.2rem 0 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  max-height: 7.2rem;
  overflow: auto;
}

li {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--gold-lo);
  background: #1a1208;
  font-size: 0.82rem;
  color: var(--muted);
}

b {
  color: var(--gold-hi);
  font-family: var(--font-num);
  font-size: 0.92rem;
  min-width: 1.2rem;
  font-variant-numeric: tabular-nums;
}

@media (orientation: landscape) and (max-height: 480px) {
  ul { max-height: 4.2rem; }
}
</style>
