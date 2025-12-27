import { ChordCategory, ChordDefinition, RootNote } from './types';

export const ROOT_NOTES: RootNote[] = [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const CHORD_TYPES: ChordDefinition[] = [
  // Triads
  { symbol: '', name: 'Major', category: ChordCategory.TRIAD },
  { symbol: 'm', name: 'Minor', category: ChordCategory.TRIAD },
  { symbol: 'aug', name: 'Augmented', category: ChordCategory.TRIAD },
  { symbol: 'dim', name: 'Diminished', category: ChordCategory.TRIAD },
  
  // Sevenths
  { symbol: 'maj7', name: 'Major 7th', category: ChordCategory.SEVENTH },
  { symbol: 'm7', name: 'Minor 7th', category: ChordCategory.SEVENTH },
  { symbol: '7', name: 'Dominant 7th', category: ChordCategory.SEVENTH },
  { symbol: 'm7b5', name: 'Half Diminished', category: ChordCategory.SEVENTH },
  { symbol: 'dim7', name: 'Diminished 7th', category: ChordCategory.SEVENTH },

  // Ninths
  { symbol: '9', name: 'Dominant 9th', category: ChordCategory.NINTH },
  { symbol: 'maj9', name: 'Major 9th', category: ChordCategory.NINTH },
  { symbol: 'add9', name: 'Add 9', category: ChordCategory.NINTH },

  // Suspended
  { symbol: 'sus4', name: 'Suspended 4th', category: ChordCategory.SUSPENDED },
  { symbol: 'sus2', name: 'Suspended 2nd', category: ChordCategory.SUSPENDED },
];
