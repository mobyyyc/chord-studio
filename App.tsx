import React, { useState, useMemo, useEffect } from 'react';
import { 
  Music, 
  Search, 
  Moon, 
  Sun, 
  Menu, 
  Info,
  Piano as PianoIcon,
  X,
  BookOpen,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Volume2,
  Loader2,
  Bot
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ROOT_NOTES, CHORD_TYPES, PROGRESSIONS, FEATURED_CHORDS } from './constants';
import { getChordData, detectChordsFromNotes, getChordResolutions, parseChord, getProgressionChords, getFeaturedChordData, getVoicing, getProgressionVoicings } from './services/musicLogic';
import { playChord, playProgression } from './services/audio';
import MusicStaff from './components/MusicStaff';
import Piano from './components/Piano';
import { ChordData, RootNote, ChordDefinition } from './types';

function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // App Mode - Defaults to 'showcase' as landing page
  const [mode, setMode] = useState<'library' | 'detector' | 'progressions' | 'showcase'>('showcase');

  // Library State
  const [selectedRoot, setSelectedRoot] = useState<RootNote>('C');
  const [selectedType, setSelectedType] = useState<string>(''); // Major by default (empty symbol)
  
  // Detector State
  const [detectorInput, setDetectorInput] = useState<string>('');
  const [detectorCandidates, setDetectorCandidates] = useState<ChordData[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Progression State
  const [progressionRoot, setProgressionRoot] = useState<RootNote>('C');

  // Showcase State
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Mobile Menu State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Computed Data
  const libraryChordData = useMemo(() => {
    return getChordData(selectedRoot, selectedType);
  }, [selectedRoot, selectedType]);

  const featuredChordData = useMemo(() => {
    return getFeaturedChordData(FEATURED_CHORDS[featuredIndex]);
  }, [featuredIndex]);

  // Determine what to display based on mode
  let activeChordData: ChordData | null = null;
  if (mode === 'library') activeChordData = libraryChordData;
  else if (mode === 'detector') activeChordData = detectorCandidates[selectedCandidateIndex] || null;
  else if (mode === 'showcase') activeChordData = featuredChordData;

  // Calculate Resolutions for the active chord
  const resolutions = useMemo(() => {
    if (!activeChordData) return [];
    return getChordResolutions(activeChordData.root, activeChordData.symbol);
  }, [activeChordData]);

  // Handle Detector Submit
  const handleDetectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDetectorInput(val);
    const candidates = detectChordsFromNotes(val);
    setDetectorCandidates(candidates);
    setSelectedCandidateIndex(0);
    // Clear AI analysis when input changes
    setAiAnalysis(''); 
  };

  // Clear Detector
  const clearDetector = () => {
    setDetectorInput('');
    setDetectorCandidates([]);
    setSelectedCandidateIndex(0);
    setAiAnalysis('');
  };

  // Handle Piano Input
  const handlePianoInput = (note: string) => {
    const newVal = detectorInput ? `${detectorInput} ${note}` : note;
    setDetectorInput(newVal);
    const candidates = detectChordsFromNotes(newVal);
    setDetectorCandidates(candidates);
    setSelectedCandidateIndex(0);
    
    // Play the single note immediately for feedback
    playChord([note]);
    // Clear AI analysis when input changes
    setAiAnalysis('');
  };

  // Gemini Integration
  const analyzeChordWithGemini = async () => {
    if (!detectorInput.trim()) return;

    setIsAiLoading(true);
    setAiAnalysis('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let prompt = '';
      
      if (activeChordData) {
        prompt = `Act as a music theory expert. I have detected this chord: ${activeChordData.root}${activeChordData.symbol} (${activeChordData.name}). 
        The specific notes are: ${activeChordData.notes.join(', ')}.
        Please provide a concise, creative insight (max 60 words). 
        1. Describe its emotional quality.
        2. Suggest a context where this chord shines (e.g., a genre or a specific progression).
        Use **bolding** for key terms or emotional descriptors.`;
      } else {
        prompt = `Act as a music theory expert. I have these notes: ${detectorInput}. 
        No standard chord was strictly detected by my algorithm. 
        Please analyze these intervals. Is this a variation of a known chord (e.g. rootless, cluster)? 
        Provide a concise advice (max 60 words) on how to interpret or resolve this sound.
        Use **bolding** for key terms.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAnalysis(response.text || "I couldn't generate an analysis at this time.");

    } catch (error) {
      console.error("Gemini API Error:", error);
      setAiAnalysis("Unable to connect to the AI service. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResolutionClick = (chordName: string) => {
    const parsed = parseChord(chordName);
    if (parsed) {
      setSelectedRoot(parsed.root as RootNote);
      setSelectedType(parsed.symbol);
      setMode('library');
    }
  };

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % FEATURED_CHORDS.length);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Group Chord Types for Sidebar
  const chordTypesByCategory = useMemo(() => {
    const groups: Record<string, ChordDefinition[]> = {};
    CHORD_TYPES.forEach(type => {
      if (!groups[type.category]) groups[type.category] = [];
      groups[type.category].push(type);
    });
    return groups;
  }, []);

  // --- SPECIAL LAYOUT FOR SHOWCASE MODE ---
  if (mode === 'showcase') {
    return (
      <div className="relative min-h-[100dvh] w-full bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center transition-colors duration-500 overflow-x-hidden">
        
        {/* Animated Background - Fixed so it covers scrollable area */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Blobs */}
          <div className={`absolute top-0 -left-4 w-64 h-64 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob ${isDarkMode ? 'bg-indigo-900/40 mix-blend-screen' : 'bg-purple-300'}`}></div>
          <div className={`absolute top-0 -right-4 w-64 h-64 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-blue-900/40 mix-blend-screen' : 'bg-yellow-300'}`}></div>
          <div className={`absolute -bottom-32 left-20 w-64 h-64 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-purple-900/40 mix-blend-screen' : 'bg-pink-300'}`}></div>
        </div>

        {/* Content Container - Flex layout that grows with content */}
        <div className="relative z-10 w-full max-w-5xl px-6 md:px-12 flex flex-col items-center justify-center py-12 md:py-20 animate-fade-in">
          
          {/* Top Navigation / Branding */}
          <div 
            key={`nav-${featuredIndex}`} 
            className="w-full flex justify-between items-center mb-8 md:mb-12 animate-slide-up-fade opacity-0 shrink-0"
          >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg">
                  <Music size={20} />
                </div>
                <span className="font-bold tracking-tight text-xl">Chord<span className="opacity-50">Studio</span></span>
             </div>
             <button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 transition-colors duration-300 backdrop-blur-sm shadow-sm"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>

          {/* Main Showcase Content */}
          <div key={featuredIndex} className="flex flex-col items-center text-center space-y-8 md:space-y-10 w-full pb-10">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/5 text-xs font-bold uppercase tracking-widest animate-slide-up opacity-0">
                <Sparkles size={12} />
                <span>Featured Discovery</span>
             </div>

             <div className="space-y-3 md:space-y-5 animate-slide-up animation-delay-100 opacity-0 px-2 w-full">
               <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight break-words">
                  {FEATURED_CHORDS[featuredIndex].displayName}
               </h1>
               <p className="text-xl md:text-3xl text-gray-500 dark:text-zinc-400 font-mono">
                  {activeChordData?.root}{activeChordData?.symbol}
               </p>
             </div>

             {/* Visual Staff Card - Added min-h-[260px] to prevent clipping on mobile */}
             <div className="relative w-full max-w-2xl min-h-[260px] aspect-[16/10] md:aspect-video bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center p-4 sm:p-6 md:p-10 animate-slide-up animation-delay-200 hover:scale-[1.01] transition-transform duration-500 opacity-0 group mx-auto">
                 <MusicStaff notes={activeChordData?.notes || []} isDarkMode={isDarkMode} />
                 
                 {/* Play Button Overlay */}
                 <button 
                    onClick={() => activeChordData && playChord(activeChordData.notes)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-3 md:p-4 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transform md:translate-y-2 md:group-hover:translate-y-0"
                    title="Play Chord"
                 >
                    <Volume2 size={24} />
                 </button>
             </div>

             {/* Description */}
             <div className="max-w-2xl animate-slide-up animation-delay-300 opacity-0 px-4">
               <p className="text-base md:text-xl leading-relaxed text-gray-700 dark:text-zinc-300">
                  {FEATURED_CHORDS[featuredIndex].description}
               </p>
               <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {FEATURED_CHORDS[featuredIndex].tags.map(tag => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-500 bg-white/30 dark:bg-black/20">
                      {tag}
                    </span>
                  ))}
               </div>
             </div>
          </div>

          {/* Bottom Controls */}
          <div 
             key={`controls-${featuredIndex}`}
             className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 animate-slide-up opacity-0 pb-4" 
             style={{ animationDelay: '400ms' }}
          >
             <button
               onClick={handleNextFeatured}
               className="w-full sm:w-auto h-14 px-10 rounded-full border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition transform-gpu font-semibold flex items-center justify-center gap-3 group active:scale-95 duration-200 bg-white/50 dark:bg-black/20"
             >
               Next Discovery
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>

             <button
               onClick={() => setMode('library')}
               className="w-full sm:w-auto h-14 px-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition transform-gpu active:scale-95 duration-200 flex items-center justify-center gap-3"
             >
               Enter Studio
               <ArrowRight size={18} />
             </button>
          </div>

        </div>
      </div>
    );
  }

  // --- STANDARD LAYOUT FOR OTHER MODES ---
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-500">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
          transform transition-transform duration-300 ease-in-out overflow-y-auto no-scrollbar shadow-2xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-8">
          <div className="flex items-center justify-between lg:justify-start gap-3 mb-10">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Music size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Chord<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
                </h1>
            </div>
            {/* Close Button Mobile */}
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-900"
            >
                <X size={20} />
            </button>
          </div>

          <nav className="space-y-8 pb-10">
            {/* Mode Switcher */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3 pl-1">Modes</p>
              
              {['showcase', 'library', 'progressions', 'detector'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m as any); setIsSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    mode === m
                      ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-zinc-700 translate-x-1' 
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:translate-x-1'
                  }`}
                >
                  {m === 'showcase' && <Sparkles size={18} />}
                  {m === 'library' && <PianoIcon size={18} />}
                  {m === 'progressions' && <BookOpen size={18} />}
                  {m === 'detector' && <Search size={18} />}
                  <span className="capitalize">{m === 'detector' ? 'Smart Detector' : m === 'showcase' ? 'Showcase' : m === 'library' ? 'Chord Library' : m}</span>
                </button>
              ))}
            </div>

            {/* Library Controls (Only visible in library mode) */}
            {mode === 'library' && (
              <div className="animate-slide-in-right opacity-0">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-4 pl-1">Root Note</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ROOT_NOTES.map(root => (
                      <button
                        key={root}
                        onClick={() => setSelectedRoot(root)}
                        className={`
                          h-10 rounded-lg text-sm font-medium transition-all duration-200 border
                          ${selectedRoot === root
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-105'}
                        `}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-4 pl-1">Chord Type</p>
                  <div className="space-y-6">
                    {(Object.entries(chordTypesByCategory) as [string, ChordDefinition[]][]).map(([category, types]) => (
                      <div key={category}>
                        <h3 className="text-xs font-medium text-gray-400 dark:text-zinc-500 mb-2 pl-1">{category}</h3>
                        <div className="grid grid-cols-1 gap-1">
                          {types.map(type => (
                            <button
                              key={type.symbol}
                              onClick={() => setSelectedType(type.symbol)}
                              className={`
                                flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                ${selectedType === type.symbol
                                  ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 pl-4'
                                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:pl-4'}
                              `}
                            >
                              <span>{type.name}</span>
                              {type.symbol && (
                                <span className="text-xs opacity-50 font-normal ml-2 font-mono">
                                  {type.symbol}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        
        {/* Header - More Padding */}
        <header className="h-16 lg:h-20 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6 lg:px-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 sticky top-0 transition-colors duration-500 shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <Menu size={24} />
              </button>
              {mode !== 'library' && (
                 <span className="font-semibold text-gray-900 dark:text-white text-sm">
                   {mode === 'detector' ? 'Smart Detector' : mode === 'progressions' ? 'Progressions' : ''}
                 </span>
              )}
          </div>
          
          <div className="flex-1 lg:flex-none"></div>

          <button
            onClick={toggleTheme}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Workspace - More Padding */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 flex flex-col items-center justify-start min-h-0">
          
          {/* Keyed Container for Page Transitions */}
          <div key={mode} className="w-full max-w-6xl space-y-10 lg:space-y-16 animate-slide-up-fade opacity-0 pb-12">
            
            {/* Context Header (Library / Detector / Showcase) */}
            {mode !== 'progressions' && (
              <div className="text-center space-y-3">
                {mode === 'library' && (
                  <>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-scale-in opacity-0">
                       <h2 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-gray-900 dark:text-white text-center">
                        {activeChordData?.root || selectedRoot}
                        <span className="text-indigo-600 dark:text-indigo-400">{selectedType}</span>
                       </h2>
                       {activeChordData && (
                          <button 
                            onClick={() => playChord(activeChordData.notes)}
                            className="mt-4 md:mt-0 p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200 active:scale-95 hover:scale-105 shadow-sm"
                            aria-label="Play Chord"
                          >
                             <Volume2 size={28} />
                          </button>
                       )}
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xl md:text-2xl animate-slide-up-fade animation-delay-100 opacity-0">
                      {CHORD_TYPES.find(t => t.symbol === selectedType)?.name}
                    </p>
                  </>
                )}
                
                {mode === 'detector' && (
                  <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                    <h2 className="hidden lg:block text-4xl font-bold tracking-tight mb-8">Chord Detector</h2>
                    <div className="relative group w-full max-w-lg">
                      <input
                        type="text"
                        value={detectorInput}
                        onChange={handleDetectorChange}
                        placeholder="Enter notes (C E G...)"
                        className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl py-4 sm:py-5 pl-8 pr-14 text-xl sm:text-2xl text-center focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-700 shadow-sm focus:shadow-lg"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        {detectorInput ? (
                          <button
                            onClick={clearDetector}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Clear input"
                          >
                            <X size={24} />
                          </button>
                        ) : (
                          <span className="text-gray-400 pointer-events-none">
                            <Search size={24} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Piano Component */}
                    <div className="w-full mt-10 lg:mt-12 animate-slide-up-fade animation-delay-100 opacity-0 overflow-hidden">
                      <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 pb-0 rounded-t-2xl rounded-b-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-zinc-800 mx-auto max-w-full">
                        <Piano onNotePlay={handlePianoInput} />
                        <div className="py-3 text-center">
                           <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-600 font-bold">Interactive Keyboard</p>
                        </div>
                      </div>
                    </div>

                    {/* AI & Status Section */}
                    <div className="w-full mt-8 flex flex-col items-center">
                        
                        {/* No Chord Detected Message */}
                        {!activeChordData && detectorInput && (
                          <p className="mb-4 text-base text-red-500 font-medium bg-red-50 dark:bg-red-900/10 py-2 px-6 rounded-lg animate-pulse">
                            Standard chord not found.
                          </p>
                        )}

                        {/* Chord Detected Display */}
                        {activeChordData && (
                           <div className="mb-6 animate-scale-in flex flex-col items-center opacity-0 px-4 text-center">
                             <div className="flex flex-col sm:flex-row items-center gap-6">
                               <div className="flex items-center gap-4">
                                 <h3 className="text-5xl sm:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white">
                                  {activeChordData.root}
                                  <span className="text-indigo-600 dark:text-indigo-400">{activeChordData.symbol}</span>
                                 </h3>
                                 <button 
                                    onClick={() => activeChordData && playChord(activeChordData.notes)}
                                    className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200 active:scale-95 hover:scale-105"
                                    aria-label="Play Detected Chord"
                                 >
                                    <Volume2 size={28} />
                                 </button>
                               </div>
                               
                               {/* Candidate Dropdown */}
                               {detectorCandidates.length > 1 && (
                                 <div className="relative group w-full sm:w-auto mt-4 sm:mt-0">
                                    <select 
                                      value={selectedCandidateIndex}
                                      onChange={(e) => setSelectedCandidateIndex(Number(e.target.value))}
                                      className="appearance-none w-full sm:w-auto bg-gray-100 dark:bg-zinc-800 border-transparent rounded-lg py-3 pl-4 pr-10 text-base font-medium text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow hover:bg-gray-200 dark:hover:bg-zinc-700"
                                    >
                                      {detectorCandidates.map((candidate, idx) => (
                                        <option key={idx} value={idx}>
                                          {candidate.root}{candidate.symbol} ({candidate.name})
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                 </div>
                               )}
                             </div>
                             <p className="text-gray-500 dark:text-zinc-400 mt-3 text-lg font-medium">
                               {activeChordData.name || 'Detected Chord'}
                               {detectorCandidates.length > 1 && (
                                 <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full ml-3 align-middle">
                                   {selectedCandidateIndex + 1}/{detectorCandidates.length}
                                 </span>
                               )}
                             </p>
                           </div>
                        )}

                        {/* AI Analyze Button */}
                        {detectorInput && (
                            <button
                                onClick={analyzeChordWithGemini}
                                disabled={isAiLoading}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300
                                    ${isAiLoading 
                                        ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-wait' 
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'}
                                `}
                            >
                                {isAiLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        {activeChordData ? 'Analyze with Gemini' : 'Ask AI about these notes'}
                                    </>
                                )}
                            </button>
                        )}

                        {/* AI Analysis Result */}
                        {aiAnalysis && (
                            <div className="mt-8 w-full max-w-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-xl animate-slide-up-fade text-left">
                                <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400 pb-2 border-b border-indigo-100 dark:border-indigo-900/30">
                                    <Bot size={24} />
                                    <h4 className="font-bold text-lg">AI Insight</h4>
                                </div>
                                <div className="text-gray-700 dark:text-zinc-300 leading-relaxed text-lg space-y-4 text-left">
                                    {aiAnalysis.split('\n').filter(line => line.trim() !== '').map((line, lineIdx) => (
                                        <p key={lineIdx}>
                                            {line.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                                                i % 2 === 1 ? (
                                                    <span key={i} className="font-bold text-gray-900 dark:text-white bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">{part}</span>
                                                ) : (
                                                    part
                                                )
                                            )}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Progression Explorer View */}
            {mode === 'progressions' && (
              <div className="w-full">
                <div className="mb-10 lg:mb-14 text-center animate-slide-up-fade opacity-0 px-2">
                   <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Chord Progressions</h2>
                   <p className="text-gray-500 dark:text-zinc-400 text-base mb-8 max-w-lg mx-auto">
                     Standard progressions transposed to your key.
                   </p>
                   
                   {/* Key Selector Strip */}
                   <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                      {ROOT_NOTES.map(root => (
                        <button
                          key={root}
                          onClick={() => setProgressionRoot(root)}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                            ${progressionRoot === root
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                              : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-105'}
                          `}
                        >
                          {root}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                  {PROGRESSIONS.map((prog, idx) => {
                    const chords = getProgressionChords(progressionRoot, prog.numerals);
                    return (
                      <div 
                        key={`${prog.name}-${progressionRoot}`} 
                        className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 animate-slide-up-fade hover:-translate-y-1 opacity-0 flex flex-col"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="mb-6 flex justify-between items-start">
                          <div className="pr-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{prog.name}</h3>
                            <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 rounded-md mt-3 inline-block">Key of {progressionRoot}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              const sequence = getProgressionVoicings(chords);
                              playProgression(sequence);
                            }}
                            className="shrink-0 p-3 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Play Progression"
                            title="Play Sequence"
                          >
                             <Volume2 size={26} />
                          </button>
                        </div>
                        
                        {/* 
                          Responsive Grid Layout:
                          - grid-cols-2: Mobile (2 items per row)
                          - md:grid-cols-4: Tablet/Desktop (4 items per row)
                          This strictly enforces the 'max 4' rule on larger screens, 
                          and wraps gracefully if more items exist.
                        */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-auto">
                           {chords.map((chordName, cIdx) => (
                              <button
                                key={`${chordName}-${cIdx}`}
                                onClick={() => {
                                    const notes = getVoicing(chordName);
                                    playChord(notes);
                                    handleResolutionClick(chordName);
                                }}
                                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/50 transition-all duration-200 active:scale-95 cursor-pointer w-full"
                              >
                                 <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                   {chordName}
                                 </span>
                                 <span className="text-xs font-mono text-gray-400 dark:text-zinc-600 mt-1">
                                   {prog.numerals[cIdx]}
                                 </span>
                              </button>
                           ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage (Sheet Music & Info) - For Library and Detector ONLY */}
            {mode !== 'progressions' && activeChordData && (
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-stretch bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-zinc-800 animate-scale-in animation-delay-200 opacity-0">
                
                {/* Visual Representation */}
                <div className="relative flex flex-col items-center justify-center min-h-[240px] md:min-h-[300px] bg-gray-50 dark:bg-zinc-950/50 rounded-xl md:rounded-2xl border border-gray-100 dark:border-zinc-800/50 transition-colors duration-500 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center p-4">
                     <MusicStaff 
                       notes={activeChordData.notes} 
                       isDarkMode={isDarkMode} 
                     />
                  </div>
                  <button 
                      onClick={() => activeChordData && playChord(activeChordData.notes)}
                      className="absolute bottom-4 right-4 p-3 rounded-full bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                      <Volume2 size={20} />
                  </button>
                </div>

                {/* Theory Details */}
                <div className="space-y-8 md:space-y-10 flex flex-col justify-center">
                  <div className="animate-slide-up-fade animation-delay-300 opacity-0">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-5 flex items-center gap-2">
                      <Info size={14} /> Composition
                    </h4>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {activeChordData.notes.map((note, idx) => (
                        <div key={idx} className="flex flex-col items-center group">
                          <span className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-lg sm:text-xl border border-indigo-100 dark:border-indigo-500/20 group-hover:-translate-y-1 transition-transform duration-300 cursor-default">
                            {note.replace(/\d/, '')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">
                            {activeChordData.intervals[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 animate-slide-up-fade animation-delay-400 opacity-0 w-full">
                    <div className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Intervals</span>
                      <span className="font-mono text-sm break-words max-w-[60%] text-right">{activeChordData.intervals.join(' - ')}</span>
                    </div>
                    {/* Resolution Section Replaces Semi-tones */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-100 dark:border-zinc-800 gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Resolves To</span>
                      <div className="flex flex-wrap sm:justify-end gap-2 w-full sm:max-w-[70%]">
                        {resolutions.length > 0 ? (
                            resolutions.map((res) => (
                                <button 
                                  key={res} 
                                  onClick={() => handleResolutionClick(res)}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-all duration-200 active:scale-95 hover:shadow-sm"
                                >
                                    {res}
                                </button>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {mode === 'detector' && !activeChordData && !detectorInput && (
              <div className="text-center text-gray-400 py-12 lg:py-24 opacity-50 animate-pulse-slow">
                <Music size={56} className="mx-auto mb-5" />
                <p>Start playing notes.</p>
              </div>
            )}
            
          </div>

          <footer className="mt-auto pt-10 text-center text-[10px] uppercase tracking-widest text-gray-300 dark:text-zinc-700 pb-4">
            <p>© {new Date().getFullYear()} Minimalist Chord Studio.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;