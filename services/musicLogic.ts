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
 * Generates a "Standard Closed Voicing" for Library display.
 * Strategy: Anchor Root at Octave 4 (Middle C range) and stack intervals upwards.
 * This keeps chords "in staff" for better readability (e.g. G4 B4 D5).
 */
const getStandardVoicing = (root: string, intervals: string[]): string[] => {
  if (!root) return [];
  
  // Anchor at Octave 4 for best staff readability (Treble Clef)
  const rootNote = `${root}4`;
  
  // Tonal intervals usually include '1P'. If so, mapping them generates the full chord.
  // If '1P' is missing for some reason, we might miss the root, but Tonal standardizes this.
  const notes = intervals.map(iv => Note.transpose(rootNote, iv));

  // Sort by pitch just in case of weird interval math
  return notes.sort((a, b) => {
    const mA = Note.midi(a) || 0;
    const mB = Note.midi(b) || 0;
    return mA - mB;
  });
};

/**
 * Generates a "Smart Open Voicing" for Progressions.
 * Strategy: Root (Octave 3) -> 5th (Octave 3/4) -> 7th (Octave 3/4) -> 3rd (Octave 4).
 * This creates a spread "Shell Voicing" + Melody (3rd on top), avoiding low-interval mud
 * and minor-second clashes in the middle register.
 */
const getSpreadVoicing = (root: string, intervals: string[]): string[] => {
  if (!root) return [];
  
  const startOctave = 3;
  const rootNote = `${root}${startOctave}`;
  
  const voicing: string[] = [rootNote];

  // 2. Add 5th (if exists)
  const fifthIv = intervals.find(i => i.startsWith('5'));
  if (fifthIv) {
    voicing.push(Note.transpose(rootNote, fifthIv));
  }

  // 3. Add 7th or 6th (if exists)
  const seventhIv = intervals.find(i => i.startsWith('7') || i.startsWith('6'));
  if (seventhIv) {
    voicing.push(Note.transpose(rootNote, seventhIv));
  }

  // 4. Add 3rd (or 2/4 for sus) -> PUSH TO NEXT OCTAVE (Spread)
  const thirdIv = intervals.find(i => i.startsWith('3') || i.startsWith('2') || i.startsWith('4'));
  if (thirdIv) {
    const lowThird = Note.transpose(rootNote, thirdIv);
    const midi = Note.midi(lowThird);
    if (midi !== null) {
      voicing.push(Note.fromMidi(midi + 12));
    }
  }

  // 5. Add Extensions (9, 11, 13) -> Push to next octave
  const extIv = intervals.find(i => {
    const num = parseInt(i.replace(/\D/g, ''));
    return num > 7;
  });
  if (extIv) {
    const lowExt = Note.transpose(rootNote, extIv);
    const midi = Note.midi(lowExt);
    if (midi !== null) {
      voicing.push(Note.fromMidi(midi + 12));
    }
  }

  return voicing.sort((a, b) => {
    const mA = Note.midi(a) || 0;
    const mB = Note.midi(b) || 0;
    return mA - mB;
  });
};

/**
 * Generates chord data for a given root and type symbol.
 * USES: Standard Voicing (Closed) for Library Display.
 */
export const getChordData = (root: string, typeSymbol: string): ChordData | null => {
  const chord = Chord.get(`${root}${typeSymbol}`);
  
  if (chord.empty) return null;

  // Library Mode -> Standard Closed Voicing (in staff)
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
 * USES: Standard Voicing (Closed) for single click feedback.
 */
export const getVoicing = (chordName: string): string[] => {
  const chord = Chord.get(chordName);
  if (chord.empty) return [];
  return getStandardVoicing(chord.tonic || '', chord.intervals);
};

/**
 * Generates a full sequence of notes for a chord progression.
 * USES: Spread Voicing for musical progression playback.
 */
export const getProgressionVoicings = (chordNames: string[]): string[][] => {
  return chordNames.map(name => {
    const chord = Chord.get(name);
    if (chord.empty) return [];
    return getSpreadVoicing(chord.tonic || '', chord.intervals);
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
  // Featured chords -> Usually stick to Spread/Complex voicings or Standard?
  // User didn't specify, but showcased chords usually sound better with Spread.
  // However, "Hendrix chord" etc might have custom notes.
  // Let's use Spread for Featured to make them sound "Featured".
  const notes = getSpreadVoicing(featured.root, chord.intervals);
  
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
      // If user typed just letters ("C E G"), use Standard Voicing (Closed) for display.
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
