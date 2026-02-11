// Ripped from:
// https://brandnewbox.com/inthestacks/

const config = {
  tempo: 140,
  gain: 0.7,
  waveform: "sawtooth",

  note: {
    attack: 0.3,
    sustain: 0.8,
    release: 0.3,
    length: 0.3,
  },

  vibrato: {
    speed: 10,
    amount: 2,
  },

  delayTime: 0.05,
  delayAmount: 0.0,
  feedback: 0.05,
};

const semitones = {
  C: -9,
  D: -7,
  E: -5,
  F: -4,
  G: -2,
  A: 0,
  B: 2,
};

/** @param {string} input */
export function getFrequency(input) {
  const note = input.slice(0, 1);

  // const sharp = input.length === 3 && input.slice(1, 2) === "#";
  const flat = input.length === 3 && input.slice(1, 2) === "b";
  const offset = flat ? -1 : 0;

  const octave = parseInt(input.slice(-1));

  const semitone = semitones[note] + offset + (octave - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

export class Player {
  constructor() {
    this.ctx = new AudioContext();

    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.master.gain.value = config.gain;

    this.delay = this.ctx.createDelay();
    this.feedback = this.ctx.createGain();
    this.delayAmount = this.ctx.createGain();

    this.delayAmount.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.master);

    this.delay.delayTime.value = config.delayTime;
    this.delayAmount.gain.value = config.delayAmount;
    this.feedback.gain.value = config.feedback;
  }

  /** @param {string} note */
  playNote(note) {
    return this.playFrequency(getFrequency(note));
  }

  /** @param {number} frequency */
  playFrequency(frequency) {
    const { currentTime } = this.ctx;
    const { note, vibrato, waveform } = config;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    noteGain.gain.setValueAtTime(0, 0);
    noteGain.gain.linearRampToValueAtTime(
      note.sustain,
      currentTime + note.length * note.attack,
    );
    noteGain.gain.setValueAtTime(
      note.sustain,
      currentTime + note.length - note.length * note.release,
    );
    noteGain.gain.linearRampToValueAtTime(0, currentTime + note.length);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(vibrato.amount, 0);
    lfoGain.connect(osc.frequency);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(vibrato.speed, 0);
    lfo.start(0);
    lfo.stop(currentTime + note.length);
    lfo.connect(lfoGain);

    osc.type = waveform;
    osc.frequency.setValueAtTime(frequency, 0);
    osc.start(0);
    osc.stop(currentTime + note.length);
    osc.connect(noteGain);

    noteGain.connect(this.master);
    noteGain.connect(this.delay);
  }
}
