import { ChordCategory, ChordDefinition, RootNote, ProgressionDefinition, FeaturedChord } from './types';

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

export const PROGRESSIONS: ProgressionDefinition[] = [
  { name: 'Pop Standard / Axis of Awesome', numerals: ['I', 'V', 'vi', 'IV'] },
  { name: 'Jazz Standard (ii-V-I)', numerals: ['ii7', 'V7', 'Imaj7'] },
  { name: '50s Doo-Wop', numerals: ['I', 'vi', 'IV', 'V'] },
  { name: 'Sensitive Female Chord Progression', numerals: ['vi', 'IV', 'I', 'V'] },
  { name: 'Minor Plagal Cadence', numerals: ['I', 'IV', 'iv', 'I'] },
  { name: 'Andalusian (Minor)', numerals: ['i', 'bVII', 'bVI', 'V7'] },
  { name: 'Pachelbel\'s Canon', numerals: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'] },
  { name: 'Simple Rock/Blues', numerals: ['I', 'IV', 'V', 'IV'] },
  { name: 'Royal Road (J-Pop)', numerals: ['IVmaj7', 'V7', 'iii7', 'vi7'] },
];

export const FEATURED_CHORDS: FeaturedChord[] = [
  {
    id: 'hendrix',
    displayName: 'The Hendrix Chord',
    root: 'E',
    symbol: '7#9',
    tags: ['Rock', 'Psychedelic', 'Blues'],
    description: "Ideally suited for aggressive, funk-influenced rhythm playing. Jimi Hendrix famously used this dominant 7th sharp 9 chord in 'Purple Haze' and 'Foxy Lady'. It contains both a major third and a minor third (the #9), creating a distinct tension.",
    customNotes: ['E3', 'G#3', 'D4', 'G4'] // Specific voicing
  },
  {
    id: 'james-bond',
    displayName: 'The Spy Chord',
    root: 'E',
    symbol: 'mM9',
    tags: ['Cinematic', 'Jazz', 'Suspense'],
    description: "The Minor Major 9th. It's the final chord heard in the iconic James Bond theme. It has a mysterious, 'detective-noir' quality due to the clash between the minor third and the major seventh.",
    customNotes: ['E3', 'G3', 'B3', 'D#4', 'F#4']
  },
  {
    id: 'so-what',
    displayName: 'So What Voicing',
    root: 'D',
    symbol: 'm11',
    tags: ['Jazz', 'Modal', 'Cool Jazz'],
    description: "Made famous by Bill Evans on Miles Davis's 'So What'. It consists of a stack of perfect fourths with a major third on top. It offers an open, modern sound often used in modal jazz.",
    customNotes: ['D3', 'G3', 'C4', 'F4', 'A4']
  },
  {
    id: 'jazz-augmented',
    displayName: 'Altered Augmented',
    root: 'G',
    symbol: '7#5',
    tags: ['Jazz', 'Resolution', 'Tension'],
    description: "Contains G, B, Eb (#5), and F. This altered dominant chord pulls strongly towards the tonic. The sharp five (Eb) creates a sense of urgency that demands resolution to a stable chord like C Major or C Minor.",
    customNotes: ['G3', 'B3', 'Eb4', 'F4']
  },
  {
    id: 'mu-major',
    displayName: 'The Mu Chord',
    root: 'G',
    symbol: 'add2',
    tags: ['Steely Dan', 'Jazz Rock', 'Smooth'],
    description: "A major triad with an added major second, often voiced with the second directly below the third. Popularized by Steely Dan, it adds a rich, shimmering texture to standard major chords without the 'dominant' pull of a 7th.",
    customNotes: ['G3', 'A3', 'B3', 'D4']
  },
  {
    id: 'dream-chord',
    displayName: 'Lydian Dream',
    root: 'C',
    symbol: 'maj9#11',
    tags: ['Film Score', 'Dreamy', 'Sci-Fi'],
    description: "The sharp 11th gives this chord a floaty, ethereal quality characteristic of the Lydian mode. It's often used in film scores to depict space, wonder, or dream sequences.",
    customNotes: ['C3', 'E3', 'G3', 'B3', 'D4', 'F#4']
  }
];