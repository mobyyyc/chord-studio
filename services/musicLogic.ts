import { Chord, Note, Progression, Interval } from 'tonal';
import { ChordData, FeaturedChord } from '../types';
import { ROOT_NOTES } from '../constants';

/**
 * Helper: Assigns octaves to a list of pitch classes to make a coherent voicing.
 * Starts at octave 4 by default, but adapts to input.
 * Handles mixed input (some notes with octaves, some without).
 */
const assignOctaves = (notes: string[]): string[] => {
  let currentOctave = 4;
  const result: string[] = [];
  let previousMidi = -1;

  notes.forEach((noteName) => {
    // Check if note already has octave (e.g. "C4", "G#5")
    if (/\d/.test(noteName)) {
      result.push(noteName);
      const midi = Note.midi(noteName);
      if (midi) {
        previousMidi = midi;
        // Sync currentOctave to the explicit octave provided
        const octMatch = noteName.match(/\d+$/);
        if (octMatch) {
          currentOctave = parseInt(octMatch[0], 10);
        }
      }
      return;
    }

    // No octave provided, calculate based on context
    let candidate = `${noteName}${currentOctave}`;
    let midi = Note.midi(candidate);

    // If midi lookup failed (invalid note), just pass it through
    if (midi === null) {
      result.push(noteName);
      return;
    }

    // Logic: If this note is significantly lower than the previous note 
    // within the same octave, it probably belongs to the next octave 
    // to maintain upward trajectory or closeness.
    if (previousMidi !== -1 && midi < previousMidi) {
      currentOctave++;
      candidate = `${noteName}${currentOctave}`;
      midi = Note.midi(candidate);
    }

    result.push(candidate);
    if (midi) previousMidi = midi;
  });

  return result;
};

/**
 * Common logic to clean up the chord symbol.
 * Removes the root if it appears at the start (e.g. "Gsus4" -> "sus4").
 * Removes "Major" / "M" labels for standard triads.
 */
const sanitizeSymbol = (symbol: string, root: string): string => {
  let s = symbol || '';
  
  // 1. If the symbol starts with the Root Note (e.g. "Gsus4" when root is "G"), strip it.
  if (root && s.startsWith(root)) {
    // Check boundary: ensure the next char isn't an accidental if the root didn't have one
    const rest = s.slice(root.length);
    const nextChar = rest[0];
    const rootHasAccidental = root.includes('#') || root.includes('b');
    
    // If root covers the accidental or there is no accidental collision
    if (rootHasAccidental || (nextChar !== '#' && nextChar !== 'b')) {
       s = rest;
    }
  }

  // 2. Remove standard Major notations
  // But be careful not to remove 'm' (minor)
  if (['M', 'major', 'Major', 'Maj', 'maj'].includes(s)) {
    return '';
  }
  
  // Handle Slash chords where symbol is "M/E" or "Major/E"
  if (s.includes('/')) {
      const [quality, bass] = s.split('/');
      if (['M', 'major', 'Major', 'Maj', 'maj'].includes(quality)) {
          return `/${bass}`;
      }
  }

  return s;
};

/**
 * Generates chord data for a given root and type symbol.
 */
export const getChordData = (root: string, typeSymbol: string): ChordData | null => {
  // Use Tonal to get the chord
  const chord = Chord.get(`${root}${typeSymbol}`);
  
  if (chord.empty) return null;

  // Assign octaves for visual rendering
  const notesWithOctaves = assignOctaves(chord.notes);

  const cleanSymbol = sanitizeSymbol(chord.symbol, chord.tonic || root);

  return {
    root: chord.tonic || root,
    symbol: cleanSymbol,
    notes: notesWithOctaves,
    intervals: chord.intervals,
    name: chord.name // Add full name
  };
};

/**
 * Generates chord data for a featured chord, potentially using custom notes.
 */
export const getFeaturedChordData = (featured: FeaturedChord): ChordData | null => {
  // If custom notes are provided, use them directly
  if (featured.customNotes && featured.customNotes.length > 0) {
    // Calculate intervals manually relative to root
    const intervals = featured.customNotes.map(note => {
      // Note: This calculates simple intervals (e.g. 1P, 3M) ignoring octave gaps for simplicity in display,
      // or we can use the exact distance. Let's use simplified interval from root pitch class.
      const dist = Interval.distance(featured.root, note.replace(/\d/, ''));
      return dist;
    });

    return {
      root: featured.root,
      symbol: featured.symbol,
      notes: featured.customNotes,
      intervals: intervals,
      name: featured.displayName
    };
  }

  // Fallback to standard generation
  return getChordData(featured.root, featured.symbol);
};

/**
 * Detects chords from a list of notes, returning multiple candidates if available.
 */
export const detectChordsFromNotes = (input: string): ChordData[] => {
  // Clean input: remove extra spaces, split by space or comma
  const rawNotes = input.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  
  if (rawNotes.length === 0) return [];

  // Validate notes to filter out garbage input
  const validNotes = rawNotes.filter(n => !Note.get(n).empty);
  
  if (validNotes.length === 0) return [];

  // Detect
  const detected = Chord.detect(validNotes);
  
  if (detected.length === 0) return [];

  // Preserve octave voicing from input if available for visual rendering
  const finalNotes = assignOctaves(validNotes);

  // Map all detections to ChordData
  return detected.map(match => {
      const chordInfo = Chord.get(match);
      
      // Fallback logic for Root: if Tonal doesn't parse tonic, try extracting from string
      let root = chordInfo.tonic;
      if (!root) {
        const rootMatch = match.match(/^[A-G][#b]?/);
        root = rootMatch ? rootMatch[0] : '';
      }

      // Determine clean symbol for display
      // We start with the full matched string (e.g., "Am/E") and strip the root ("A")
      let cleanSymbol = '';
      if (root && match.startsWith(root)) {
          // Careful stripping: Ensure we don't strip "A" from "Ab"
          const rootHasAccidental = root.length > 1;
          const matchNextChar = match[root.length];
          
          if (rootHasAccidental || (matchNextChar !== '#' && matchNextChar !== 'b')) {
             cleanSymbol = match.slice(root.length);
          } else {
             // Fallback: This shouldn't happen if Tonal works correctly
             cleanSymbol = match; 
          }
      } else {
          // Fallback if match structure is weird
          cleanSymbol = chordInfo.symbol || '';
      }

      // If symbol is just "Major" or "M", clear it.
      // If symbol is "M/E", make it "/E".
      // If symbol is "m/E", keep it.
      // If symbol is "m", keep it.
      
      // Handle the case where cleanSymbol starts with 'M' or 'Major' 
      // but isn't 'Maj7', 'Min' etc.
      // E.g. "C/E" -> Root "C", cleanSymbol "/E". Correct.
      // E.g. "CMaj7" -> Root "C", cleanSymbol "Maj7". Correct.
      // E.g. "C" -> Root "C", cleanSymbol "". Correct.
      
      // Additional safety: if cleanSymbol is exactly 'M' or 'Major', clear it.
      if (['M', 'Major', 'major'].includes(cleanSymbol)) {
          cleanSymbol = '';
      }
      
      // Also handle slash cleanup if needed (e.g. "Major/E" -> "/E")
      if (cleanSymbol.startsWith('M/') || cleanSymbol.startsWith('Major/')) {
         cleanSymbol = cleanSymbol.replace(/^(M|Major)/, '');
      }

      // Determine Name
      const name = chordInfo.name || match; 

      return {
        root: root,
        symbol: cleanSymbol,
        notes: finalNotes,
        intervals: chordInfo.intervals.length > 0 ? chordInfo.intervals : [],
        name: name
      };
  });
};

/**
 * Returns a list of potential chords that the current chord might resolve to.
 */
export const getChordResolutions = (root: string, symbol: string): string[] => {
  // Guard against missing root
  if (!root) return [];

  // Ensure root is just the note name, strip octave if present
  const r = root.replace(/[0-9]/g, ''); 

  // For resolution logic, we want the core quality, ignoring bass/inversion
  // e.g. "m/E" -> "m", "7/F#" -> "7"
  const s = symbol ? symbol.split('/')[0] : '';

  try {
      // 1. Suspended -> Resolve to Root Major or Minor
      if (s.includes('sus')) {
        return [r, `${r}m`];
      }

      // 2. Dominant 7th (7, 9, 11, 13)
      // Check if it starts with a dominant number and is NOT a major7 or minor7
      // e.g. "7", "9", "7b9" match. "maj7", "m7" do not.
      const isDom = /^(7|9|11|13)/.test(s) && !s.includes('maj') && !s.includes('min') && !s.includes('m');
      
      if (isDom) {
        // V7 -> I (Perfect 4th up)
        const target = Note.transpose(r, '4P');
        return target ? [target, `${target}m`] : [];
      }

      // 3. Half Diminished (m7b5) -> iiø resolves to V
      if (s === 'm7b5') {
         // ii - V (up 4th)
         const target = Note.transpose(r, '4P');
         return target ? [`${target}7`] : [];
      }

      // 4. Minor (m, m7, etc)
      // Must check startsWith('m') but ensure it's not 'maj'
      if (s.startsWith('m') && !s.includes('maj')) {
          // i -> bIII (Relative Major)
          const relMaj = Note.transpose(r, '3m');
          // i -> iv (Subdominant)
          const iv = Note.transpose(r, '4P');
          // i -> V (Dominant)
          const V = Note.transpose(r, '5P');
          
          const result = [];
          if (relMaj) result.push(relMaj);
          if (iv) result.push(`${iv}m`);
          if (V) result.push(V);
          return result;
      }

      // 5. Diminished (dim, dim7) -> Resolves up a semitone (Leading Tone)
      if (s.includes('dim')) {
         const target = Note.transpose(r, '2m');
         return target ? [target, `${target}m`] : [];
      }
      
      // 6. Augmented -> V+ resolves to I (4th up)
      if (s.includes('aug')) {
         const target = Note.transpose(r, '4P');
         return target ? [target] : [];
      }

      // 7. Major (Triad, maj7, add9, etc) - Default
      // I -> IV, V, vi
      const IV = Note.transpose(r, '4P');
      const V = Note.transpose(r, '5P');
      const vi = Note.transpose(r, '6M');
      
      const result = [];
      if (IV) result.push(IV);
      if (V) result.push(V);
      if (vi) result.push(`${vi}m`);
      return result;

  } catch (e) {
      console.error('Error calculating resolutions:', e);
      return [];
  }
};

/**
 * Parses a chord string (e.g. "G7") into its root and symbol components (e.g. "G", "7").
 * Validates against the supported ROOT_NOTES list, handling enharmonics if necessary.
 */
export const parseChord = (chordName: string): { root: string, symbol: string } | null => {
  const chord = Chord.get(chordName);
  if (chord.empty) return null;

  let root = chord.tonic || '';
  const symbol = sanitizeSymbol(chord.symbol, root);

  // 1. Direct match check
  // (We use 'as string' casting for comparison, assuming ROOT_NOTES contains strings)
  const exactMatch = ROOT_NOTES.find(r => r === root);
  if (exactMatch) {
    return { root: exactMatch, symbol };
  }

  // 2. Enharmonic match check (e.g. if Tonal returns "Gb" but we only support "F#")
  const enharmonic = Note.enharmonic(root);
  const enharmonicMatch = ROOT_NOTES.find(r => r === enharmonic);
  if (enharmonicMatch) {
    return { root: enharmonicMatch, symbol };
  }

  // 3. Fallback (return original, UI might fail to highlight root but will still load)
  return { root, symbol };
};

/**
 * Generates actual chord names from Roman Numerals in a given key.
 */
export const getProgressionChords = (key: string, numerals: string[]): string[] => {
  return Progression.fromRomanNumerals(key, numerals);
};