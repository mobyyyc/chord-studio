import { Chord, Note, Progression, Interval } from 'tonal';
import { ChordData, FeaturedChord } from '../types';
import { ROOT_NOTES } from '../constants';

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
 * Generates standard closed voicing for library display.
 * Uses Octave 4 as base for clear Treble Clef visibility.
 */
const getStandardVoicing = (root: string, intervals: string[]): string[] => {
  if (!root) return [];
  
  // Use Octave 4 as the standard "Middle C" range base for Sheet Music visualization
  const startOctave = 4;
  const rootNote = `${root}${startOctave}`;
  
  return intervals.map(interval => {
    return Note.transpose(rootNote, interval);
  });
};

/**
 * Generates "Natural" voicing for progressions (Left Hand Bass + Right Hand Chord).
 * Logic:
 * - Roots C, C#, D, D#, Eb -> Bass Octave 3, Chord Octave 4.
 * - Roots E, F, F#, G, G#, A, Bb, B -> Bass Octave 2, Chord Octave 3.
 *   (Added E to Low Roots to satisfy "Em should be an octave lower")
 */
const getNaturalVoicing = (root: string, intervals: string[]): string[] => {
    if (!root) return [];

    // Normalize root pitch class to determine register
    const pc = Note.pitchClass(root); // e.g., "C", "G#"

    // Define "Low Register" roots. Added 'E' to this list so Em starts on E2.
    const lowRoots = ['E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    
    const isLowRoot = lowRoots.includes(pc);
    
    const bassOctave = isLowRoot ? 2 : 3;
    const chordOctave = isLowRoot ? 3 : 4;

    const bassNote = `${pc}${bassOctave}`;
    const chordRoot = `${pc}${chordOctave}`;

    // SPECIAL LOGIC: Major 7th Chords (Root-5-7-3 Voicing)
    // "you can have root, fifth, seventh, and lastly third (an octave higher)"
    const isMaj7 = intervals.includes('7M') && intervals.includes('3M');
    
    if (isMaj7) {
        // Construct specific stack: Bass(Root) -> RH: Root, 5th, 7th, 3rd(+Octave)
        // 10M is the compound Major 3rd (3rd + Octave)
        // We include the Root in RH as well for a full 4-note voicing
        const voicing = [
            bassNote, // Bass Note
            Note.transpose(chordRoot, '1P'),  // Root (RH)
            Note.transpose(chordRoot, '5P'),  // 5th
            Note.transpose(chordRoot, '7M'),  // 7th
            Note.transpose(chordRoot, '10M')  // 3rd (High)
        ];
        return voicing;
    }

    // DEFAULT LOGIC: Block Chord
    // 1. Add Bass Note
    const voicing = [bassNote];

    // 2. Add Chord Notes (Right Hand)
    intervals.forEach(interval => {
        voicing.push(Note.transpose(chordRoot, interval));
    });

    return voicing;
};

/**
 * Generates chord data for a given root and type symbol.
 */
export const getChordData = (root: string, typeSymbol: string): ChordData | null => {
  const chord = Chord.get(`${root}${typeSymbol}`);
  
  if (chord.empty) return null;

  // Use Standard Voicing (Block Chord) for Library Display
  const notes = getStandardVoicing(chord.tonic || root, chord.intervals);

  const cleanSymbol = sanitizeSymbol(chord.symbol, chord.tonic || root);

  return {
    root: chord.tonic || root,
    symbol: cleanSymbol,
    notes: notes,
    intervals: chord.intervals,
    name: chord.name
  };
};

/**
 * Generates specific note voicings for a chord name string.
 * Used for single-click playback in progression view.
 */
export const getVoicing = (chordName: string): string[] => {
  const chord = Chord.get(chordName);
  if (chord.empty) return [];
  // Use Natural Voicing for better listening experience
  return getNaturalVoicing(chord.tonic || '', chord.intervals);
};

/**
 * Generates a full sequence of notes for a chord progression.
 * Applies Natural Voicing to the entire sequence.
 */
export const getProgressionVoicings = (chordNames: string[]): string[][] => {
  return chordNames.map(name => {
    const chord = Chord.get(name);
    if (chord.empty) return [];
    return getNaturalVoicing(chord.tonic || '', chord.intervals);
  });
};

/**
 * Generates chord data for a featured chord, potentially using custom notes.
 */
export const getFeaturedChordData = (featured: FeaturedChord): ChordData | null => {
  if (featured.customNotes && featured.customNotes.length > 0) {
    const intervals = featured.customNotes.map(note => {
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

  const chord = Chord.get(`${featured.root}${featured.symbol}`);
  // Use Standard for visual clarity in showcase
  const notes = getStandardVoicing(featured.root, chord.intervals);
  
  return {
    root: featured.root,
    symbol: featured.symbol,
    notes: notes,
    intervals: chord.intervals,
    name: featured.displayName
  };
};

/**
 * Detects chords from a list of notes.
 */
export const detectChordsFromNotes = (input: string): ChordData[] => {
  const rawNotes = input.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  
  if (rawNotes.length === 0) return [];

  const validNotes = rawNotes
    .filter(n => !Note.get(n).empty)
    .sort((a, b) => {
       const mA = Note.midi(a);
       const mB = Note.midi(b);
       if (mA !== null && mB !== null) return mA - mB;
       return 0;
    });
  
  if (validNotes.length === 0) return [];

  const detected = Chord.detect(validNotes);
  
  if (detected.length === 0) return [];

  const hasOctaves = validNotes.some(n => /\d/.test(n));

  return detected.map(match => {
      const chordInfo = Chord.get(match);
      
      // If user typed notes with octaves, keep them (sorted).
      // Otherwise use standard voicing
      const displayNotes = hasOctaves ? validNotes : getStandardVoicing(chordInfo.tonic || '', chordInfo.intervals);

      let root = chordInfo.tonic;
      if (!root) {
        const rootMatch = match.match(/^[A-G][#b]?/);
        root = rootMatch ? rootMatch[0] : '';
      }

      let cleanSymbol = '';
      if (root && match.startsWith(root)) {
          const rootHasAccidental = root.length > 1;
          const matchNextChar = match[root.length];
          if (rootHasAccidental || (matchNextChar !== '#' && matchNextChar !== 'b')) {
             cleanSymbol = match.slice(root.length);
          } else {
             cleanSymbol = match; 
          }
      } else {
          cleanSymbol = chordInfo.symbol || '';
      }

      if (['M', 'Major', 'major'].includes(cleanSymbol)) {
          cleanSymbol = '';
      }
      if (cleanSymbol.startsWith('M/') || cleanSymbol.startsWith('Major/')) {
         cleanSymbol = cleanSymbol.replace(/^(M|Major)/, '');
      }

      return {
        root: root,
        symbol: cleanSymbol,
        notes: displayNotes,
        intervals: chordInfo.intervals.length > 0 ? chordInfo.intervals : [],
        name: chordInfo.name || match
      };
  });
};

/**
 * Returns a list of potential chords that the current chord might resolve to.
 */
export const getChordResolutions = (root: string, symbol: string): string[] => {
  if (!root) return [];
  const r = root.replace(/[0-9]/g, ''); 
  const s = symbol ? symbol.split('/')[0] : '';

  try {
      if (s.includes('sus')) {
        return [r, `${r}m`];
      }
      const isDom = /^(7|9|11|13)/.test(s) && !s.includes('maj') && !s.includes('min') && !s.includes('m');
      if (isDom) {
        const target = Note.transpose(r, '4P');
        return target ? [target, `${target}m`] : [];
      }
      if (s === 'm7b5') {
         const target = Note.transpose(r, '4P');
         return target ? [`${target}7`] : [];
      }
      if (s.startsWith('m') && !s.includes('maj')) {
          const relMaj = Note.transpose(r, '3m');
          const iv = Note.transpose(r, '4P');
          const V = Note.transpose(r, '5P');
          const result = [];
          if (relMaj) result.push(relMaj);
          if (iv) result.push(`${iv}m`);
          if (V) result.push(V);
          return result;
      }
      if (s.includes('dim')) {
         const target = Note.transpose(r, '2m');
         return target ? [target, `${target}m`] : [];
      }
      if (s.includes('aug')) {
         const target = Note.transpose(r, '4P');
         return target ? [target] : [];
      }
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
 * Parses a chord string (e.g. "G7") into its root and symbol components.
 */
export const parseChord = (chordName: string): { root: string, symbol: string } | null => {
  const chord = Chord.get(chordName);
  if (chord.empty) return null;

  let root = chord.tonic || '';
  const symbol = sanitizeSymbol(chord.symbol, root);

  const exactMatch = ROOT_NOTES.find(r => r === root);
  if (exactMatch) {
    return { root: exactMatch, symbol };
  }
  const enharmonic = Note.enharmonic(root);
  const enharmonicMatch = ROOT_NOTES.find(r => r === enharmonic);
  if (enharmonicMatch) {
    return { root: enharmonicMatch, symbol };
  }
  return { root, symbol };
};

/**
 * Generates actual chord names from Roman Numerals in a given key.
 */
export const getProgressionChords = (key: string, numerals: string[]): string[] => {
  const chords = Progression.fromRomanNumerals(key, numerals);
  
  return chords.map((chordName, i) => {
    const roman = numerals[i];
    const coreRoman = roman.replace(/^[b#]+/, '');
    const firstChar = coreRoman.charAt(0);
    const isLowerCase = (firstChar === firstChar.toLowerCase()) && (firstChar !== firstChar.toUpperCase());
    
    if (isLowerCase) {
         const c = Chord.get(chordName);
         if (!c.empty) {
            const isMajor = c.intervals.includes('3M');
            if (isMajor) {
               let newSymbol = 'm';
               if (c.symbol === '7') newSymbol = 'm7';
               if (c.symbol === 'maj7') newSymbol = 'm7'; 
               return c.tonic + newSymbol;
            }
         }
    }
    return chordName;
  });
};