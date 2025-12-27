import * as Tone from 'tone';

let instrument: Tone.Sampler | null = null;
let reverb: Tone.Reverb | null = null;

// Initialize the instrument lazily to comply with browser autoplay policies
async function getInstrument() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }

  if (!instrument) {
    // Create a reverb for a more "studio" sound
    // Reduced decay time for a tighter sound
    reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination();
    await reverb.generate();

    // Initialize Sampler with a subset of Salamander Piano samples
    instrument = new Tone.Sampler({
      urls: {
        "C3": "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        "A3": "A3.mp3",
        "C4": "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        "A4": "A4.mp3",
        "C5": "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        "A5": "A5.mp3",
        "C6": "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        "A6": "A6.mp3",
      },
      // Shorter release envelope to stop sound ringing too long after release
      release: 0.8,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).connect(reverb);
    
    await Tone.loaded();
  }
  return instrument;
}

/**
 * Plays a single chord (list of notes).
 * @param notes Array of notes with octaves, e.g. ["C4", "E4", "G4"]
 */
export const playChord = async (notes: string[]) => {
  try {
    const inst = await getInstrument();
    inst.releaseAll(); // Stop previous sounds
    
    // Reduced duration from 2.5s to 1.5s for a snappy but natural listen
    inst.triggerAttackRelease(notes, 1.5);
  } catch (err) {
    console.error("Audio playback error:", err);
  }
};

/**
 * Plays a sequence of chords.
 * @param sequence Array of note arrays, e.g. [["C4", "E4", "G4"], ["G3", "B3", "D4"]]
 */
export const playProgression = async (sequence: string[][]) => {
  try {
    const inst = await getInstrument();
    inst.releaseAll();
    
    const now = Tone.now();
    const step = 1.0; // Time between chords (seconds)
    const duration = 1.1; // Duration of sound (slightly longer than step for legato, but not muddy)
    
    sequence.forEach((chordNotes, i) => {
      // Schedule each chord
      inst.triggerAttackRelease(chordNotes, duration, now + (i * step));
    });
  } catch (err) {
    console.error("Progression playback error:", err);
  }
};