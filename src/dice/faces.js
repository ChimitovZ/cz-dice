export const DIE_PIPS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

export const DIE_FACE_AXES = [
  [0, 0, 1], [1, 0, 0], [0, 1, 0],
  [0, -1, 0], [-1, 0, 0], [0, 0, -1],
]

export function upperFace({ x, y, z, w }) {
  // Express the world's upward axis in the die's local coordinates.
  const upX = 2 * (x * y + z * w)
  const upY = 1 - 2 * (x * x + z * z)
  const upZ = 2 * (y * z - x * w)
  let value = 1
  let alignment = -Infinity
  DIE_FACE_AXES.forEach(([nx, ny, nz], index) => {
    const height = nx * upX + ny * upY + nz * upZ
    if (height > alignment) {
      alignment = height
      value = index + 1
    }
  })
  return { value, alignment }
}
