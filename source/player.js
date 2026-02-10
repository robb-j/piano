// Ripped from:
// https://brandnewbox.com/inthestacks/

const config = {
  tempo: 140,
  gain: 0.5,
  waveform: "square",

  note: {
    attack: 0.3,
    sustain: 0.8,
    release: 0.3,
    length: 0.2,
  },

  vibrato: {
    speed: 10,
    amount: 1,
  },

  delayTime: 0.65,
  delayAmount: 0.0,
  feedback: 0.05,
};

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

  start() {
    console.debug("Player@start");
  }

  stop() {
    console.debug("Player: stop");
  }

  /** @param {number} frequency */
  playNote(frequency) {
    console.debug("Player@play %d", frequency);

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
    // noteGain.connect(this.delay);
  }
}
