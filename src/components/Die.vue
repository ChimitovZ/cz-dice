<script setup>
defineProps({
  value: { type: Number, required: true },
  rolling: { type: Boolean, default: false },
  size: { type: Number, default: 72 },
})
</script>

<template>
  <div class="cell" :class="{ rolling }" :style="{ '--die': size + 'px' }">
    <span class="glow" aria-hidden="true" />
    <div class="die" :class="{ rolling }" :data-n="value" aria-hidden="true">
      <span class="pip p1" /><span class="pip p2" /><span class="pip p3" />
      <span class="pip p4" /><span class="pip p5" /><span class="pip p6" />
      <span class="pip p7" /><span class="pip p8" /><span class="pip p9" />
    </div>
    <strong class="chip"><span>{{ value }}</span></strong>
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

.cell.rolling .glow {
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
  .glow,
  .cell.rolling .glow {
    opacity: 0;
    transition: none;
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
