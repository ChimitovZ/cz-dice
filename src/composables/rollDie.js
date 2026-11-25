export function rollDie() {
  const buf = new Uint32Array(1)
  const range = 0x100000000
  const limit = range - (range % 6)
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return 1 + (buf[0] % 6)
}
