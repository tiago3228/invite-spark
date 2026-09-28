export type OpeningSound = "none" | "paper" | "chime";

function getAudioContext() {
  if (typeof window === "undefined") return undefined;
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return AudioContextClass ? new AudioContextClass() : undefined;
}

/** Plays a short, generated sound after a user gesture. No audio file is downloaded or stored. */
export function playOpeningSound(sound: OpeningSound) {
  if (sound === "none") return;
  const context = getAudioContext();
  if (!context) return;
  void context.resume().then(() => {
    if (sound === "chime") playChime(context);
    else playPaper(context);
    window.setTimeout(() => void context.close(), 1000);
  });
}

function playPaper(context: AudioContext) {
  const duration = 0.22;
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    const envelope = 1 - index / data.length;
    data[index] = (Math.random() * 2 - 1) * envelope * envelope * 0.28;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 1450;
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  source.stop(context.currentTime + duration);
}

function playChime(context: AudioContext) {
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * 0.06;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.65);
  });
}
