export const OCTAVE = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export class DigitalPiano {
  /** @param {string} url */
  static async create(url) {
    const res = await fetch(url);

    const parsed = new DOMParser().parseFromString(
      await res.text(),
      "image/svg+xml",
    );

    return new DigitalPiano(parsed.querySelector("svg"));
  }

  /** @type {((note: string) => void) | null} */
  onkeyup = null;

  /** @type {((note: string) => void) | null} */
  onkeydown = null;

  notes = [
    "A0",
    "Bb0",
    "B",
    ...OCTAVE.map((n) => n + "1"),
    ...OCTAVE.map((n) => n + "2"),
    ...OCTAVE.map((n) => n + "3"),
    ...OCTAVE.map((n) => n + "4"),
    ...OCTAVE.map((n) => n + "5"),
    ...OCTAVE.map((n) => n + "6"),
    ...OCTAVE.map((n) => n + "7"),
    "C8",
  ];

  /** @param {SVGElement} svg */
  constructor(svg) {
    this.svg = svg;

    for (const key of this.keys()) {
      key.onpointerdown = (e) => {
        key.setPointerCapture(e.pointerId);
        this.onkeydown?.(key.id);
      };
      key.onpointerup = (e) => {
        key.releasePointerCapture(e.pointerId);
        this.onkeyup?.(key.id);
      };
    }
  }

  /** @returns {Iterable<SVGRectElement>} */
  keys() {
    return this.svg.querySelectorAll("rect");
  }

  // Get a <rect> element from a piano key name
  getKey(key) {
    return this.svg.querySelector(`rect#${key}`);
  }

  toggleKey(key, value) {
    const elem = this.getKey(key);
    if (!elem) throw new TypeError(`Missing key: ${key}`);

    const newValue = value ?? !elem.hasAttribute("aria-pressed");

    if (newValue) {
      elem.setAttribute("aria-pressed", "true");
    } else {
      elem.removeAttribute("aria-pressed");
    }
  }

  // Unselect a specific key
  deselect(key) {
    this.toggleKey(key, false);
  }

  // Highlight a specific key
  select(key) {
    this.toggleKey(key, true);
  }

  // Clear all key selections
  clear() {
    for (const elem of this.keys()) {
      elem.removeAttribute("aria-pressed");
    }
  }
}
