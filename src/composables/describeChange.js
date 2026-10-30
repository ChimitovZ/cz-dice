const FACES = [1, 2, 3, 4, 5, 6]
const MAX_LINES = 6

export const DICE_FACES = FACES

/** Russian plural: 1 кубик / 2 кубика / 5 кубиков. */
export function plural(n, one, few, many) {
  const m = n % 10
  const t = n % 100
  if (t >= 11 && t <= 14) return many
  if (m === 1) return one
  if (m >= 2 && m <= 4) return few
  return many
}

/** Which dice actually changed between two snapshots, in human words. */
export function changedWhere(from, to) {
  if (from.length !== to.length) return 'весь стол'
  const hit = []
  for (let i = 0; i < to.length; i++) if (from[i] !== to[i]) hit.push(i + 1)
  if (!hit.length) return 'без изменений'
  return hit.length === 1 ? `кубик №${hit[0]}` : `кубики №${hit.join(', №')}`
}

export function timeLabel(date) {
  try {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}

/**
 * Turns a change record into everything the feed needs to render:
 * a headline, the "where" tag, and one line per die that moved
 * ("№2: 3 → 5"). Size changes use a `note` instead of faces, because
 * those dice appeared or vanished rather than showing a new face.
 */
export function describeChange(entry) {
  if (!entry) return null
  const idx = entry.index + 1
  const all = []

  if (entry.kind === 'reroll' || entry.kind === 'set') {
    all.push({ from: entry.from[entry.index], to: entry.to[entry.index] })
  } else if (entry.kind === 'roll') {
    for (let i = 0; i < entry.to.length; i++) {
      if (entry.from[i] !== entry.to[i]) all.push({ label: `№${i + 1}`, from: entry.from[i], to: entry.to[i] })
    }
  } else {
    const added = entry.to.length > entry.from.length
    if (added) {
      for (let i = entry.from.length; i < entry.to.length; i++) {
        all.push({ label: `№${i + 1}`, note: 'добавлен', to: entry.to[i] })
      }
    } else {
      for (let i = entry.to.length; i < entry.from.length; i++) {
        all.push({ label: `№${i + 1}`, note: 'убран', from: entry.from[i] })
      }
    }
  }

  const lines = all.slice(0, MAX_LINES)
  const extra = all.length - lines.length

  let title
  let where = ''
  if (entry.kind === 'roll') {
    title = 'Бросок стола'
    where = changedWhere(entry.from, entry.to)
  } else if (entry.kind === 'reroll') {
    title = `Переброс кубика №${idx}`
  } else if (entry.kind === 'set') {
    title = `Поворот кубика №${idx}`
  } else {
    const added = entry.to.length > entry.from.length
    const d = Math.abs(entry.to.length - entry.from.length)
    const verb = added ? 'Добавлен' : 'Убран'
    title = `${verb}${d === 1 ? '' : 'о'} ${d} ${plural(d, 'кубик', 'кубика', 'кубиков')}`
  }

  return {
    kind: entry.kind,
    title,
    where,
    sumBefore: entry.sumBefore,
    sumAfter: entry.sumAfter,
    total: entry.to.length,
    lines,
    extra,
  }
}
