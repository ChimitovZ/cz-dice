<script setup>
defineProps({
  value: { type: Number, required: true },
  rolling: { type: Boolean, default: false },
  size: { type: Number, default: 72 },
})
</script>

<template>
  <div class="cell" :style="{ '--die': size + 'px' }">
    <div class="die" :class="{ rolling }" :data-n="value" aria-hidden="true">
      <span class="pip p1" /><span class="pip p2" /><span class="pip p3" />
      <span class="pip p4" /><span class="pip p5" /><span class="pip p6" />
      <span class="pip p7" /><span class="pip p8" /><span class="pip p9" />
    </div>
    <strong>{{ value }}</strong>
  </div>
</template>

<style scoped>
.cell {
  display: grid;
  justify-items: center;
  gap: 0.18em;
  width: var(--die);
}

.die {
  width: var(--die);
  aspect-ratio: 1;
  display: grid;
  grid-template: repeat(3, 1fr) / repeat(3, 1fr);
  place-items: center;
  padding: 10%;
  border-radius: 18%;
  background:
    linear-gradient(155deg, rgb(255 255 255 / 0.55), transparent 42%),
    linear-gradient(180deg, var(--ivory), var(--ivory-shade));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.7),
    inset 0 -6px 10px rgb(80 60 30 / 0.16),
    0 8px 0 rgb(0 0 0 / 0.18),
    0 14px 18px var(--shadow);
}

.pip {
  width: 36%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--pip);
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

strong {
  font-size: calc(var(--die) * 0.34);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.rolling {
  animation: toss 0.52s ease-in-out;
}

@keyframes toss {
  0% { transform: rotate(-12deg) scale(0.94); }
  20% { transform: rotate(14deg) scale(1.06); }
  45% { transform: rotate(-9deg) scale(0.97); }
  70% { transform: rotate(8deg) scale(1.04); }
  100% { transform: rotate(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .rolling { animation: none; }
}
</style>
