// All sounds are synthesized locally. The context is created by a user gesture.
export function createAudio() {
  let context = null;
  let master = null;
  let noiseBuffer = null;
  const voices = new Set();

  function unlock() {
    try {
      if (!context) {
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) return Promise.resolve(false);
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = 0.45;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 12;
        limiter.ratio.value = 8;
        master.connect(limiter);
        limiter.connect(context.destination);
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      return Promise.resolve(context.resume()).then(() => context.state === 'running').catch(() => false);
    } catch {
      return Promise.resolve(false);
    }
  }

  function tone(at, duration, startHz, endHz, volume, type = 'sine') {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startHz, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), at + duration);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); voices.delete(oscillator); };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }

  function noise(at, duration, volume, frequency, type = 'lowpass') {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    voices.add(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); voices.delete(source); };
    source.start(at, Math.random() * 0.5);
    source.stop(at + duration + 0.01);
  }

  function play(name) {
    if (!context || context.state !== 'running' || voices.size > 80) return false;
    const t = context.currentTime + 0.002;
    switch (name) {
      case 'shot':
      case 'rifle':
      case 'shot-rifle':
        noise(t, 0.14, 0.78, 2900);
        noise(t, 0.035, 0.36, 6600, 'highpass');
        tone(t, 0.14, 160, 42, 0.5, 'triangle');
        tone(t + 0.035, 0.065, 850, 240, 0.07, 'square');
        break;
      case 'smg':
      case 'shot-smg':
        noise(t, 0.085, 0.54, 3600);
        tone(t, 0.09, 195, 65, 0.34, 'triangle');
        break;
      case 'pistol':
      case 'shot-pistol':
        noise(t, 0.12, 0.65, 4200);
        tone(t, 0.13, 210, 48, 0.42, 'triangle');
        break;
      case 'reload':
        noise(t, 0.065, 0.22, 2200, 'highpass');
        tone(t, 0.05, 460, 240, 0.09, 'square');
        noise(t + 0.35, 0.09, 0.24, 1400);
        noise(t + 0.72, 0.07, 0.3, 3300);
        tone(t + 0.73, 0.055, 700, 290, 0.1, 'triangle');
        break;
      case 'dry':
        tone(t, 0.03, 1800, 900, 0.12, 'square');
        noise(t, 0.02, 0.1, 6000, 'highpass');
        break;
      case 'step':
        noise(t, 0.06, 0.1, 500);
        tone(t, 0.07, 95, 55, 0.08, 'sine');
        break;
      case 'hit':
        noise(t, 0.035, 0.13, 5000, 'highpass');
        tone(t, 0.065, 1450, 900, 0.14, 'triangle');
        break;
      case 'plant':
        for (let i = 0; i < 3; i++) tone(t + i * 0.12, 0.085, 650 + i * 240, 650 + i * 240, 0.13, 'sine');
        noise(t + 0.38, 0.08, 0.18, 1600);
        break;
      case 'win':
        [440, 554.37, 659.25, 880].forEach((hz, i) => {
          tone(t + i * 0.13, 0.42, hz, hz, 0.13, 'triangle');
          tone(t + i * 0.13, 0.4, hz / 2, hz / 2, 0.065);
        });
        break;
      case 'hurt':
        noise(t, 0.15, 0.32, 650);
        tone(t, 0.2, 110, 38, 0.4, 'sine');
        break;
      case 'grenade':
        noise(t, 0.75, 0.85, 1100);
        noise(t + 0.025, 0.2, 0.35, 2600);
        tone(t, 0.7, 120, 25, 0.7, 'sine');
        break;
      default: return false;
    }
    return true;
  }
  return { unlock, play };
}
