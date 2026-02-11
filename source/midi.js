/** @typedef {{ command: number, channel: number, note: number, velocity: number }} MidiCommand */

export class Midi {
  static async connect() {
    const permission = await navigator.permissions.query({
      name: "midi",
      sysex: true,
    });

    if (permission.state === "denied") {
      return { state: "denied" };
    }

    try {
      const access = await navigator.requestMIDIAccess();
      return { state: "success", midi: new Midi(access) };
    } catch (error) {
      return { state: "error", error };
    }
  }

  /** @type {((command: MidiCommand) => void) | null} */
  onmidi = null;

  /** @type {((input: MIDIInput) => void) | null} */
  oninput = null;

  /** @param {MIDIAccess} access */
  constructor(access, debug = () => {}) {
    this.access = access;
    this.debug = debug;

    this.access.onstatechange = (event) => {
      console.debug("midi@state", event);
    };
    this.access.inputs.forEach((input) => {
      this.oninput?.(input);
      input.onmidimessage = (e) => this.handleMidiMessage(e);
    });
  }

  /**
   * Parse basic information out of a MIDI message ~ https://stackoverflow.com/q/40902864
   * @param {Uint8Array} input
   */
  parseMidiData(input) {
    return {
      command: input[0] >> 4,
      channel: input[0] & 0xf,
      note: input[1],
      velocity: input[2] / 127,
    };
  }

  /** @param {MIDIMessageEvent} event */
  handleMidiMessage(event) {
    this.onmidi?.(this.parseMidiData(event.data));
  }
}
