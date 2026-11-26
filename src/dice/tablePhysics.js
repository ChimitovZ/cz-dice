import { Body, Box, Plane, Vec3, World } from 'cannon-es'
import { upperFace } from './faces.js'

const STEP = 1 / 120
const FLAT = Math.PI / 2
const TUMBLE_CLEARANCE = 0.87 // Half the die's diagonal, rounded up.
const LIFT_STEPS = 11
const X = new Vec3(1, 0, 0)
const Y = new Vec3(0, 1, 0)
const CLEAR_UPPER_FACE = 0.74
const REST_TIME = 0.16
const MIN_IMPACT_SPEED = 0.9
const IMPACT_COOLDOWN_STEPS = 6

function watchImpacts(world, activeBodies, dice, floor, halfWidth, onImpact) {
  const diceBodies = new Set(dice)
  const hits = new Map()
  const lastHit = new Map()

  for (const body of activeBodies) {
    body.addEventListener('collide', ({ body: other, contact }) => {
      const speed = contact.getImpactVelocityAlongNormal()
      if (speed < MIN_IMPACT_SPEED) return
      const key = `${Math.min(body.id, other.id)}:${Math.max(body.id, other.id)}`
      const step = world.stepnumber
      if (step - (lastHit.get(key) ?? -Infinity) < IMPACT_COOLDOWN_STEPS) return
      if (speed <= (hits.get(key)?.speed ?? 0)) return

      const kind = other === floor ? 'felt' : diceBodies.has(other) ? 'dice' : 'rail'
      const x = contact.bi.position.x + contact.ri.x
      const pan = Math.max(-1, Math.min(1, x / halfWidth))
      hits.set(key, { kind, speed, pan, step })
    })
  }

  return () => {
    // A single hit can have several contact points and be reported by both dice.
    for (const [key, { kind, speed, pan, step }] of hits) {
      lastHit.set(key, step)
      onImpact(kind, speed, pan)
    }
    hits.clear()
  }
}

export function createTablePhysics(poses, moving, bounds, { random = Math.random, onImpact } = {}) {
  const world = new World({ gravity: new Vec3(0, -27, 0), allowSleep: true })
  world.defaultContactMaterial.friction = 0.4
  world.defaultContactMaterial.restitution = 0.48
  world.solver.iterations = 12

  function addPlane(x, y, z, axis, angle) {
    const surface = new Body({ shape: new Plane(), position: new Vec3(x, y, z) })
    surface.quaternion.setFromAxisAngle(axis, angle)
    world.addBody(surface)
    return surface
  }

  const floor = addPlane(0, 0, 0, X, -FLAT)
  addPlane(-bounds.halfWidth, 0, 0, Y, FLAT)
  addPlane(bounds.halfWidth, 0, 0, Y, -FLAT)
  addPlane(0, 0, bounds.back, Y, 0)
  addPlane(0, 0, bounds.front, Y, Math.PI)

  const direction = random() * 2 * Math.PI
  const box = new Box(new Vec3(0.5, 0.5, 0.5))
  const launchHalfWidth = Math.max(0, bounds.halfWidth - TUMBLE_CLEARANCE)
  const launchDepthInset = Math.min(TUMBLE_CLEARANCE, (bounds.front - bounds.back) / 2)
  const launchVelocities = []
  const bodies = poses.map(({ position, quaternion }, index) => {
    const active = moving.includes(index)
    const body = new Body({
      shape: box,
      mass: active ? 1 : 0,
      position: active ? new Vec3(
        Math.max(-launchHalfWidth, Math.min(launchHalfWidth, position.x)),
        0.9,
        Math.max(bounds.back + launchDepthInset, Math.min(bounds.front - launchDepthInset, position.z)),
      ) : new Vec3(position.x, position.y, position.z),
      linearDamping: 0.34,
      angularDamping: 0.46,
      sleepSpeedLimit: 0.35,
      sleepTimeLimit: 0.2,
    })
    body.quaternion.copy(quaternion)
    body.previousQuaternion.copy(quaternion)
    body.interpolatedQuaternion.copy(quaternion)
    if (active) {
      const angle = direction + (random() - 0.5) * 1.15
      const speed = 5.2 + random() * 3.5
      launchVelocities.push({
        body,
        x: Math.cos(angle) * speed - position.x * 1.05,
        z: Math.sin(angle) * speed - position.z * 1.05,
      })
      body.velocity.y = 4.7 + random() * 1.6
      const spin = 20 + random() * 10
      const azimuth = random() * 2 * Math.PI
      const vertical = (random() - 0.5) * 0.9
      const horizontal = Math.sqrt(1 - vertical * vertical)
      body.angularVelocity.set(
        spin * horizontal * Math.cos(azimuth), spin * vertical, spin * horizontal * Math.sin(azimuth),
      )
    }
    world.addBody(body)
    return body
  })

  // Give the dice time to turn over before they travel into their neighbors.
  function releaseLaunch() {
    if (world.stepnumber !== LIFT_STEPS) return
    for (const { body, x, z } of launchVelocities) {
      body.velocity.x += x
      body.velocity.z += z
    }
    world.removeEventListener('postStep', releaseLaunch)
  }
  world.addEventListener('postStep', releaseLaunch)

  const activeBodies = moving.map((index) => bodies[index])
  const flushImpacts = onImpact && watchImpacts(world, activeBodies, bodies, floor, bounds.halfWidth, onImpact)
  const nudged = new Set()
  let quietTime = 0
  let elapsed = 0

  function step(delta) {
    world.step(STEP, delta, 12)
    flushImpacts?.()
    if (elapsed < 2 && elapsed + delta >= 2) {
      world.defaultContactMaterial.restitution = 0.08
      for (const body of activeBodies) {
        body.linearDamping = 0.87
        body.angularDamping = 0.91
      }
    }
    elapsed += delta

    const speedLimit = elapsed < 3 ? 0.07 : 0.15
    const spinLimit = elapsed < 3 ? 0.1 : 0.16
    const quiet = activeBodies.every(({ velocity, angularVelocity }) =>
      velocity.lengthSquared() < speedLimit && angularVelocity.lengthSquared() < spinLimit,
    )
    quietTime = quiet ? quietTime + delta : 0
    if (!settled()) return

    for (const body of activeBodies) {
      if (nudged.has(body) || upperFace(body.quaternion).alignment >= CLEAR_UPPER_FACE) continue
      // A die wedged on an edge gets a small physical nudge before it is scored.
      nudged.add(body)
      body.wakeUp()
      body.velocity.set((random() - 0.5) * 2, 1.7, (random() - 0.5) * 2)
      body.angularVelocity.set((random() - 0.5) * 10, 0, (random() - 0.5) * 10)
      quietTime = 0
    }
  }

  function settled() {
    return quietTime >= REST_TIME
  }

  function finish() {
    // Finish the same simulation without rendering frames when motion is reduced.
    for (let tick = 0; tick < 720 && !settled(); tick++) step(STEP)
    return settled()
  }

  return { bodies, step, settled, finish }
}
