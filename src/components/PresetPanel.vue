<script setup>
import { inject, nextTick, ref } from 'vue'

const STORAGE_KEY = 'cz-dice-presets'
const quickRolls = [
  { count: 1, label: '1 кубик' },
  { count: 2, label: '2 кубика' },
  { count: 3, label: '3 кубика' },
]
const dice = inject('dice')

function validPreset(preset) {
  return preset && typeof preset.name === 'string' && preset.name.trim().length > 0 &&
    Number.isInteger(preset.count) && preset.count >= dice.min && preset.count <= dice.max
}

function loadPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(saved)) {
      return saved
        .filter((preset) => validPreset(preset) && Number.isSafeInteger(preset.id))
        .map(({ id, name, count }) => ({ id, name, count }))
    }
  } catch {
    // Presets can still be used for this session when storage is unavailable.
  }
  return []
}

const presets = ref(loadPresets())
const dialog = ref(null)
const nameInput = ref(null)
const newButton = ref(null)
const draft = ref(null)
const storageFailed = ref(false)

function persist(next) {
  presets.value = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    storageFailed.value = false
  } catch {
    storageFailed.value = true
  }
}

function formula({ count }) {
  return `${count}d6`
}

function rollPreset(preset) {
  if (dice.rolling) return
  if (dialog.value.open) dialog.value.close()
  dice.roll(preset.count)
}

async function editPreset(preset = null) {
  draft.value = preset ? { ...preset } : {
    id: null, name: '', count: 2,
  }
  await nextTick()
  nameInput.value?.focus()
}

function openManager() {
  dialog.value.showModal()
  if (!presets.value.length) editPreset()
}

async function showList() {
  draft.value = null
  await nextTick()
  newButton.value?.focus()
}

function saveDraft() {
  if (!validPreset(draft.value)) return
  const preset = { ...draft.value, name: draft.value.name.trim() }
  if (preset.id === null) {
    preset.id = Math.max(0, ...presets.value.map(({ id }) => id)) + 1
    persist([...presets.value, preset])
  } else {
    persist(presets.value.map((item) => item.id === preset.id ? preset : item))
  }
  showList()
}

function removeDraft() {
  persist(presets.value.filter(({ id }) => id !== draft.value.id))
  showList()
}
</script>

<template>
  <section class="preset-panel" aria-labelledby="quick-rolls-title">
    <div class="preset-header">
      <h2 id="quick-rolls-title">Быстрые броски</h2>
      <button type="button" class="button" @click="openManager">
        {{ presets.length ? 'Управление пресетами' : 'Добавить пресет' }}
      </button>
    </div>
    <div class="quick-rolls">
      <button v-for="{ count, label } in quickRolls" :key="count" class="quick-roll" type="button"
        :aria-label="`Бросить ${label}`" :disabled="dice.rolling" @click="dice.roll(count)">
        {{ label }}
      </button>
    </div>
    <p v-if="storageFailed" class="hint" role="alert">Изменения доступны до закрытия страницы. Браузер не сохранил пресеты.</p>

    <dialog ref="dialog" class="manager" aria-labelledby="preset-manager-title" @close="draft = null">
      <header class="manager-header">
        <h2 id="preset-manager-title">{{ draft ? (draft.id === null ? 'Новый пресет' : 'Редактирование пресета') : 'Пресеты' }}</h2>
        <button type="button" class="button" @click="dialog.close()">Закрыть</button>
      </header>

      <form v-if="draft" class="editor" @submit.prevent="saveDraft">
        <label>
          Название
          <input ref="nameInput" v-model.trim="draft.name" type="text" maxlength="48" required placeholder="Например, Урон" />
        </label>
        <label>
          Количество кубиков d6
          <input v-model.number="draft.count" type="number" :min="dice.min" :max="dice.max" step="1" required />
        </label>
        <div class="actions">
          <button type="submit" class="button primary" :disabled="!validPreset(draft)">Сохранить</button>
          <button type="button" class="button" @click="showList">Назад</button>
          <button v-if="draft.id !== null" type="button" class="button remove" @click="removeDraft">Удалить</button>
        </div>
      </form>

      <div v-else class="editor">
        <ul v-if="presets.length" class="preset-list">
          <li v-for="preset in presets" :key="preset.id">
            <div class="preset-info">
              <strong>{{ preset.name }}</strong>
              <span class="formula">{{ formula(preset) }}</span>
            </div>
            <div class="actions">
              <button type="button" class="button" :aria-label="`Бросить ${preset.name}`" :disabled="dice.rolling" @click="rollPreset(preset)">Бросить</button>
              <button type="button" class="button" :aria-label="`Изменить ${preset.name}`" @click="editPreset(preset)">Изменить</button>
            </div>
          </li>
        </ul>
        <button ref="newButton" type="button" class="button primary" @click="editPreset()">Новый пресет</button>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.preset-panel {
  min-width: 0;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--felt-edge);
}

.preset-header, .manager-header, .actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.preset-header, .manager-header { justify-content: space-between; }

h2 {
  margin: 0;
  color: var(--gold-hi);
  font-size: 0.85rem;
}

.button, .quick-roll {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--felt-deep);
  font-size: 0.83rem;
  padding: 0.35rem 0.65rem;
}

.button:hover:not(:disabled), .quick-roll:hover:not(:disabled) { border-color: var(--gold-hi); }
.button:disabled, .quick-roll:disabled { opacity: 0.55; cursor: default; }
.preset-header .button { border-color: transparent; background: transparent; color: var(--muted); }
.primary { background: var(--gold-hi); color: var(--accent-ink); }
.remove { margin-inline-start: auto; color: var(--ivory); background: var(--red-lo); }

.quick-rolls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  max-width: 24rem;
  padding-block: 0.25rem;
}

.quick-roll {
  padding-inline: 0.2rem;
  transition: transform 120ms ease, border-color 120ms ease;
}

.quick-roll:active:not(:disabled) { transform: scale(0.96); }

.formula, .hint { color: var(--muted); font-size: 0.78rem; }
.formula { font-variant-numeric: tabular-nums; }
.hint { margin: 0.2rem 0 0.45rem; }

@media (prefers-reduced-motion: reduce) {
  .quick-roll { transition: none; }
  .quick-roll:active:not(:disabled) { transform: none; }
}

.manager {
  width: min(30rem, calc(100% - 1.5rem));
  max-height: calc(100dvh - 1.5rem);
  padding: 0.85rem;
  border: 1px solid var(--gold);
  border-radius: 14px;
  color: var(--ink);
  background: var(--felt-deep);
  overflow: auto;
}

.manager::backdrop { background: rgb(0 0 0 / 0.68); }
.manager-header h2 { font-size: 1rem; }
.editor { display: grid; gap: 0.7rem; margin-top: 0.7rem; }
.editor > .primary { justify-self: start; }
.editor label { display: grid; gap: 0.25rem; font-size: 0.85rem; color: var(--muted); }
.editor input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  background: var(--felt-edge);
  color: var(--ink);
  font: inherit;
  font-size: 1rem;
  user-select: text;
}

.preset-list { display: grid; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
.preset-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--line);
}

.preset-info { display: grid; min-width: 0; overflow-wrap: anywhere; }
</style>
