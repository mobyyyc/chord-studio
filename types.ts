export type RootNote = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export enum ChordCategory {
  TRIAD = 'Triads',
  SEVENTH = 'Sevenths',
  NINTH = 'Ninths',
  SUSPENDED = 'Suspended',
}

export interface ChordDefinition {
  symbol: string;
  name: string;
  category: ChordCategory;
}

export interface DetectedChord {
  symbol: string;
  name: string;
  notes: string[];
}

export interface ChordData {
  root: string;
  symbol: string;
  notes: string[]; // e.g. ["C4", "E4", "G4"]
  intervals: string[];
  name?: string; // e.g. "Major", "Minor 7th"
}

export interface ProgressionDefinition {
  name: string;
  numerals: string[];
}

export interface FeaturedChord {
  id: string;
  displayName: string;
  root: string;
  symbol: string;
  description: string;
  tags: string[];
  customNotes?: string[]; // Optional specific voicing (e.g. "C4", "G4", etc.)
}