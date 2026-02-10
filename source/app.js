// Common HTML elements
const wrapper = document.getElementById("wrapper");
const output = document.getElementById("output");
const random = document.getElementById("random");
const connect = document.getElementById("connect");
const midiState = document.getElementById("midiState");

/** @type {MIDIAccess | null} */
let midi = null;

const MIDI_DOWN = 9;
const MIDI_UP = 8;

const NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const ALL_NOTES = [
  "A0",
  "Bb0",
  "B",
  ...NOTES.map((n) => n + "1"),
  ...NOTES.map((n) => n + "2"),
  ...NOTES.map((n) => n + "3"),
  ...NOTES.map((n) => n + "4"),
  ...NOTES.map((n) => n + "5"),
  ...NOTES.map((n) => n + "6"),
  ...NOTES.map((n) => n + "7"),
  "C8",
];

async function setup() {
  const res = await fetch("./piano.svg");
  const parsed = new DOMParser().parseFromString(
    await res.text(),
    "image/svg+xml",
  );

  const piano = parsed.querySelector("svg");
  wrapper.append(piano);
  writeMessage("Loaded Piano");

  return { piano };
}

// One-time setup to load the SVG into the DOM so it can be accessed via JavaScript
const { piano } = await setup();

// Listen for clicks on the keys
for (const key of piano.querySelectorAll("rect")) {
  key.addEventListener("click", () => {
    toggle(key.id);
    writeMessage("Picked: " + key.id);
  });
}

// Listen for the random button
random.addEventListener("click", () => {
  const note = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
  clear();
  select(note);
});

// Connect to Web MIDI
connect.addEventListener("click", async () => {
  const state = await navigator.permissions.query({
    name: "midi",
    sysex: true,
  });

  if (state.state === "denied") {
    writeMessage("MIDI denied");
    return;
  }

  try {
    midi = await navigator.requestMIDIAccess();
    writeMessage("MIDI Connected");

    midi.onstatechange = (ev) => console.debug("midi@state", ev);

    midi.inputs.forEach((input) => {
      console.debug(input);
      writeMessage(`Device: ${input.name} - ${input.id} `);
      input.onmidimessage = onMidiEvent;
    });

    connect.setAttribute("disabled", true);
    midiState.textContent = "MIDI: Connected";
  } catch (error) {
    writeMessage("MIDI failed - maybe restart your browser");
  }
});

/**
 * Parse basic information out of a MIDI message
 * ~ https://stackoverflow.com/q/40902864
 */
function parseMidiMessage(data) {
  return {
    command: data[0] >> 4,
    channel: data[0] & 0xf,
    note: data[1],
    velocity: data[2] / 127,
  };
}

/** @param {MIDIMessageEvent} event */
function onMidiEvent(event) {
  const message = parseMidiMessage(event.data);
  console.debug(event, message);

  // https://inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
  const note = ALL_NOTES[message.note - 21];

  if (message.command === MIDI_DOWN) select(note);
  if (message.command === MIDI_UP) deselect(note);
}

// Get a <rect> element from a piano key name
function getKey(key) {
  return piano.querySelector(`rect#${key}`);
}

// Clear all key selections
function clear() {
  for (const key of piano.querySelectorAll("rect")) {
    delete key.dataset.selected;
  }
}

// Unselect a specific key
function deselect(key) {
  const elem = getKey(key);
  if (elem) delete elem.dataset.selected;
}

// Highlight a specific key
function select(key) {
  const elem = getKey(key);
  if (elem) elem.dataset.selected = "true";
}

// Toggle a key
function toggle(key) {
  const elem = getKey(key);
  if (!elem) return;

  if (elem.dataset.selected) {
    delete elem.dataset.selected;
  } else {
    clear();
    elem.dataset.selected = "true";
  }
}

// Output a message to the <pre> element
function writeMessage(text) {
  output.textContent += text + "\n";
}
