import { Player } from "./player.js";
import { Midi } from "./midi.js";
import { DigitalPiano } from "./piano.js";

// Common HTML elements
const wrapper = document.getElementById("wrapper");
const output = document.getElementById("output");
const connect = document.getElementById("connect");
const midiState = document.getElementById("midiState");

/** @type {Midi | null} */
let midi = null;

const MIDI_DOWN = 9;
const MIDI_UP = 8;

const KEYBOARD = {
  offset: 3 + 12 * 3, // C4
  keys: "awsedftgyhujkolp;",
};

let _player = null;

/** @returns {Player} */
function getPlayer() {
  if (!_player) _player = new Player();
  return _player;
}

// Output a message to the <pre> element
function writeText(text) {
  output.textContent += text + "\n";
}

// One-time setup to load the SVG into the DOM so it can be accessed via JavaScript
const piano = await DigitalPiano.create("./piano.svg");
wrapper.append(piano.svg);
writeText("Loaded Piano");

piano.onkeydown = (note) => {
  writeText("Picked: " + note);
  piano.select(note);
  getPlayer().playNote(note);
};

piano.onkeyup = (note) => {
  piano.deselect(note);
};

window.onkeydown = (event) => {
  const index = KEYBOARD.keys.indexOf(event.key.toLowerCase());
  if (index === -1) return;

  const note = piano.notes[KEYBOARD.offset + index];
  if (!note) return;
  piano.select(note);
  getPlayer().playNote(note);
};

window.onkeyup = (event) => {
  const index = KEYBOARD.keys.indexOf(event.key.toLowerCase());
  if (index === -1) return;

  const note = piano.notes[KEYBOARD.offset + index];
  if (!note) return;
  piano.deselect(note);
};

// Connect to Web MIDI
connect.addEventListener("click", async () => {
  const result = await Midi.connect();

  if (result.state === "denied") {
    return writeText("MIDI denied");
  }

  if (result.state === "error") {
    console.error(result.error);
    return writeText("MIDI failed - maybe restart your browser");
  }

  if (result.state !== "success") return;
  midi = result.midi;

  midi.oninput = (input) => {
    writeText(`Found input: ${input.name} - ${input.manufacturer}`);
  };

  midi.onmidi = (message) => {
    // https://inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
    const note = piano.notes[message.note - 21];
    if (!note) return;

    if (message.command === MIDI_DOWN) {
      piano.select(note);
      getPlayer().playNote(note);
    } else if (message.command === MIDI_UP) {
      piano.deselect(note);
    }
  };

  connect.setAttribute("disabled", true);
  connect.textContent = "Connected";
  midiState.textContent = "MIDI: Connected";
});
