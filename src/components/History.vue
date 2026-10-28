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
  font-weight: 650;
}

.clr {
  font-size: 0.9rem;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.15rem;
  max-height: 7.2rem;
  overflow: auto;
}

li {
  display: flex;
  gap: 0.7rem;
  align-items: baseline;
  font-size: 0.92rem;
  color: var(--muted);
}

b {
  color: var(--accent);
  font-size: 1.05rem;
  min-width: 1.6rem;
  font-variant-numeric: tabular-nums;
}

@media (orientation: landscape) and (max-height: 480px) {
  ul { max-height: 4.2rem; }
}
</style>
