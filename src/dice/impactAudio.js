const SOUNDS = {
  felt: { length: 0.055, low: 165, high: 360, cutoff: 900, noise: 0.35, decay: 0.009 },
  rail: { length: 0.085, low: 320, high: 810, cutoff: 2500, noise: 0.55, decay: 0.016 },
  dice: { length: 0.055, low: 760, high: 1890, cutoff: 5700, noise: 0.62, decay: 0.008 },
}

function makeBuffer(context, sound) {
  const rate = context.sampleRate
  const buffer = context.createBuffer(1, Math.ceil(sound.length * rate), rate)
  const samples = buffer.getChannelData(0)
  const low = sound.low * 2 * Math.PI
  const high = sound.high * 2 * Math.PI
  const filter = 1 - Math.exp(-2 * Math.PI * sound.cutoff / rate)
  let filtered = 0
  let seed = 1871

  for (let i = 0; i < samples.length; i++) {
    const t = i / rate
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    filtered += filter * (seed / 2147483648 - 1 - filtered)
    const attack = Math.min(1, t * 2400)
    const tone = 0.54 * Math.sin(low * t) + 0.28 * Math.sin(high * t) * Math.exp(-t / 0.005)
    const burst = sound.noise * filtered * Math.exp(-t / 0.004)
    samples[i] = attack * (tone * Math.exp(-t / sound.decay) + burst)
  }

  return buffer
}

export function createImpactAudio() {
  let context
  let output
  let buffers

  function unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return false

    try {
      if (!context) {
        context = new AudioContext()
        output = context.createDynamicsCompressor()
        output.threshold.value = -15
        output.ratio.value = 5
        output.connect(context.destination)
        buffers = Object.fromEntries(Object.entries(SOUNDS).map(([kind, sound]) => [kind, makeBuffer(context, sound)]))
      }
      if (context.state !== 'running') context.resume().catch(() => {})
      return true
    } catch {
      dispose()
      return false
    }
  }

  function play(kind, speed, pan) {
    if (context?.state !== 'running') return
    const source = context.createBufferSource()
    source.buffer = buffers[kind]
    source.playbackRate.value = 0.95 + Math.min(speed, 12) * 0.012

    const gain = context.createGain()
    gain.gain.value = Math.min(0.48, (speed - 0.65) * 0.048)
    source.connect(gain)
    if (context.createStereoPanner) {
      const stereo = context.createStereoPanner()
      stereo.pan.value = pan * 0.55
      gain.connect(stereo).connect(output)
    } else gain.connect(output)
    source.start()
  }

  function dispose() {
    context?.close().catch(() => {})
    context = undefined
  }

  return { unlock, play, dispose }
}
