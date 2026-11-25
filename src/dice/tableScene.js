import {
  CanvasTexture, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, OrthographicCamera, PlaneGeometry, Quaternion,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { DIE_FACE_AXES, DIE_PIPS, upperFace } from './faces.js'
import { createTablePhysics } from './tablePhysics.js'

const ELEVATION = Math.PI * 0.295
const SIN = Math.sin(ELEVATION)
const COS = Math.cos(ELEVATION)
const REST_HEIGHT = 0.5
const RIGHT_ANGLE = Math.PI / 2
const UP = new Vector3(0, 1, 0)
const FRONT = new Vector3(0, 0, 1)
const FACE_NORMALS = DIE_FACE_AXES.map((axis) => new Vector3(...axis))
const FACE_ROTATIONS = FACE_NORMALS.map((normal) => new Quaternion().setFromUnitVectors(FRONT, normal))
const DISPLAY_YAW = new Quaternion().setFromAxisAngle(UP, -Math.PI / 6)
const REST_ROTATIONS = FACE_ROTATIONS.map((face) =>
  DISPLAY_YAW.clone().multiply(FACE_ROTATIONS[2]).multiply(face.clone().invert()),
)

function radialTexture(size, center, stops) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(...center, 0, size / 2, size / 2, size / 2)
  for (const [offset, color] of stops) gradient.addColorStop(offset, color)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function createDiceAssets() {
  const red = new MeshPhysicalMaterial({
    color: '#c42124', roughness: 0.34, clearcoat: 0.42, clearcoatRoughness: 0.31,
  })
  const pipTexture = radialTexture(64, [29, 38], [
    [0, '#fff8d9'], [0.73, '#f8eccb'], [0.92, '#d7c6a5'], [0.99, '#bba284'], [1, 'transparent'],
  ])
  const ivory = new MeshStandardMaterial({ map: pipTexture, alphaTest: 0.5, roughness: 0.76 })
  const shadowTexture = radialTexture(64, [32, 32], [
    [0, 'rgba(0,0,0,0.68)'], [0.46, 'rgba(0,0,0,0.38)'], [1, 'transparent'],
  ])
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
  const bodyGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.13)
  const tiles = FACE_ROTATIONS.flatMap((rotation, index) => DIE_PIPS[index + 1].map((pip) =>
    new PlaneGeometry(0.17, 0.17)
      .translate(((pip - 1) % 3 - 1) * 0.248, (1 - Math.floor((pip - 1) / 3)) * 0.248, 0.501)
      .applyQuaternion(rotation),
  ))
  const pipGeometry = mergeGeometries(tiles)
  for (const tile of tiles) tile.dispose()
  const shadowGeometry = new PlaneGeometry(1.65, 1.65).rotateX(-RIGHT_ANGLE)

  return {
    create() {
      const mesh = new Group()
      mesh.add(new Mesh(bodyGeometry, red), new Mesh(pipGeometry, ivory))
      const shadow = new Mesh(shadowGeometry, shadowMaterial)
      return { mesh, shadow, value: 0, restRotation: new Quaternion() }
    },
    dispose() {
      for (const asset of [red, ivory, shadowMaterial, bodyGeometry, pipGeometry, shadowGeometry,
        pipTexture, shadowTexture]) asset.dispose()
    },
  }
}

export function createTableScene(canvas) {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true })
  if (!context) return null

  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
  camera.position.set(0, SIN * 80, COS * 80)
  camera.lookAt(0, 0, 0)
  const key = new DirectionalLight('#fff4e7', 3.05)
  key.position.set(-4, 8, 5)
  const rim = new DirectionalLight('#ffd2bd', 1.1)
  rim.position.set(5, 4, -5)
  scene.add(new HemisphereLight('#fff8eb', '#7b3e2d', 1.6), key, rim)

  const assets = createDiceAssets()
  const dice = []
  let slots = []
  let layoutKey = ''
  let bounds
  let frame = 0

  function draw() {
    for (const { mesh, shadow } of dice) {
      shadow.position.set(mesh.position.x + 0.07, 0.004, mesh.position.z + 0.055)
      shadow.scale.setScalar(1 + 0.16 * Math.max(0, mesh.position.y - REST_HEIGHT))
    }
    renderer.render(scene, camera)
  }

  function layout(width, height, size, centers) {
    const dpr = Math.min(window.devicePixelRatio, 1.75)
    const key = [width, height, size, dpr, ...centers.flat()].join(',')
    if (key === layoutKey) return false
    layoutKey = key

    const unit = size * 0.67
    const halfWidth = width / (2 * unit)
    const halfHeight = height / (2 * unit)
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)

    // Project the DOM slot centers back onto the plane through the dice centers.
    slots = centers.map(([x, y]) => new Vector3(
      (x - width / 2) / unit,
      REST_HEIGHT,
      ((y - height / 2) / unit + REST_HEIGHT * COS) / SIN,
    ))
    bounds = {
      halfWidth: halfWidth - 0.1,
      back: (-halfHeight + 0.78) / SIN,
      front: (halfHeight - 0.1) / SIN,
    }
    return true
  }

  function show(values) {
    cancelAnimationFrame(frame)
    while (dice.length > values.length) {
      const { mesh, shadow } = dice.pop()
      scene.remove(mesh, shadow)
    }
    values.forEach((value, index) => {
      if (!dice[index]) {
        dice[index] = assets.create()
        scene.add(dice[index].mesh, dice[index].shadow)
      }
      const die = dice[index]
      if (die.value !== value) {
        die.value = value
        die.restRotation.copy(REST_ROTATIONS[value - 1])
      }
      die.mesh.position.copy(slots[index])
      die.mesh.quaternion.copy(die.restRotation)
    })
    draw()
  }

  function animate(update, done) {
    const started = performance.now()
    let previous = started
    function tick(now) {
      const elapsed = Math.max(0, (now - started) / 1000)
      const delta = Math.min(Math.max(0, (now - previous) / 1000), 0.1)
      const finished = update(elapsed, delta)
      draw()
      if (finished) done()
      else {
        previous = now
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
  }

  function collectDice(indices, done) {
    const starts = indices.map((index) => ({
      index,
      position: dice[index].mesh.position.clone(),
    }))
    animate((elapsed) => {
      for (const { index, position } of starts) {
        const stagger = (index % 4) * 0.035
        const progress = Math.min(1, Math.max(0, (elapsed - stagger) / 0.49))
        const eased = progress * progress * (3 - 2 * progress)
        dice[index].mesh.position.lerpVectors(position, slots[index], eased)
      }
      return elapsed >= 0.6
    }, done)
  }

  function turnDie(index, value, duration, done) {
    const die = dice[index]
    const start = die.mesh.quaternion.clone()
    const target = REST_ROTATIONS[value - 1]
    animate((elapsed) => {
      const progress = Math.min(1, elapsed * 1000 / duration)
      const eased = progress * progress * (3 - 2 * progress)
      die.mesh.position.y = REST_HEIGHT + 0.31 * Math.sin(Math.PI * progress)
      die.mesh.quaternion.slerpQuaternions(start, target, eased)
      return progress === 1
    }, () => {
      die.value = value
      die.restRotation.copy(target)
      done()
    })
  }

  function finishRoll(physics, moving, values, instant, done) {
    if (!physics.settled()) {
      done(null)
      return
    }

    const faces = [...values]
    const landings = moving.map((index) => {
      const body = physics.bodies[index]
      const { value, alignment } = upperFace(body.quaternion)
      const mesh = dice[index].mesh
      mesh.position.copy(body.position)
      mesh.quaternion.copy(body.quaternion).normalize()
      faces[index] = value

      // Level dice that came to rest leaning against a neighbor without changing their top face.
      const rotation = mesh.quaternion.clone()
      const tiltedUp = FACE_NORMALS[value - 1].clone().applyQuaternion(rotation)
      const level = new Quaternion().setFromUnitVectors(tiltedUp, UP).multiply(rotation)
      return { index, rotation, level, alignment }
    })

    function finish() {
      for (const { index, level } of landings) {
        dice[index].value = faces[index]
        dice[index].restRotation.copy(level)
      }
      if (instant) show(faces)
      done(faces)
    }

    function collect() {
      for (const { index, level } of landings) dice[index].mesh.quaternion.copy(level)
      collectDice(moving, finish)
    }

    if (instant) finish()
    else if (landings.some(({ alignment }) => alignment < 0.9995)) {
      animate((elapsed) => {
        const progress = Math.min(1, elapsed / 0.15)
        for (const { index, rotation, level } of landings) {
          dice[index].mesh.quaternion.slerpQuaternions(rotation, level, progress)
        }
        return progress === 1
      }, collect)
    } else collect()
  }

  function play(motion, values, done, onImpact) {
    if (motion.kind === 'turn') {
      const from = [...values]
      from[motion.index] = motion.from[motion.index]
      show(from)
      turnDie(motion.index, values[motion.index], motion.duration, done)
      return
    }

    const moving = motion.kind === 'roll' ? values.map((_, index) => index) : [motion.index]
    show(values)
    const physics = createTablePhysics(dice.map(({ mesh }) => mesh), moving, bounds, {
      onImpact: motion.instant ? undefined : onImpact,
    })
    if (motion.instant) {
      physics.finish()
      finishRoll(physics, moving, values, true, done)
      return
    }

    let simulated = 0
    animate((_, delta) => {
      if (delta > 0) physics.step(delta)
      simulated += delta
      for (const index of moving) {
        const { interpolatedPosition, interpolatedQuaternion } = physics.bodies[index]
        const { mesh } = dice[index]
        mesh.position.copy(interpolatedPosition)
        mesh.quaternion.copy(interpolatedQuaternion)
      }
      return physics.settled() || simulated >= 6
    }, () => finishRoll(physics, moving, values, false, done))
  }

  function dispose() {
    cancelAnimationFrame(frame)
    assets.dispose()
    renderer.dispose()
  }

  return { layout, show, play, dispose }
}
