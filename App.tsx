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
  ChevronRight
} from 'lucide-react';
import { ROOT_NOTES, CHORD_TYPES, PROGRESSIONS, FEATURED_CHORDS } from './constants';
import { getChordData, detectChordFromNotes, getChordResolutions, parseChord, getProgressionChords, getFeaturedChordData } from './services/musicLogic';
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
  const [detectorResult, setDetectorResult] = useState<ChordData | null>(null);

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
  else if (mode === 'detector') activeChordData = detectorResult;
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
    const res = detectChordFromNotes(val);
    setDetectorResult(res);
  };

  // Clear Detector
  const clearDetector = () => {
    setDetectorInput('');
    setDetectorResult(null);
  };

  // Handle Piano Input
  const handlePianoInput = (note: string) => {
    const newVal = detectorInput ? `${detectorInput} ${note}` : note;
    setDetectorInput(newVal);
    const res = detectChordFromNotes(newVal);
    setDetectorResult(res);
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
      <div className="relative h-screen w-full overflow-hidden bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center">
        
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Blobs */}
          <div className={`absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob ${isDarkMode ? 'bg-indigo-900/40 mix-blend-screen' : 'bg-purple-300'}`}></div>
          <div className={`absolute top-0 -right-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 ${isDarkMode ? 'bg-blue-900/40 mix-blend-screen' : 'bg-yellow-300'}`}></div>
          <div className={`absolute -bottom-32 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 ${isDarkMode ? 'bg-purple-900/40 mix-blend-screen' : 'bg-pink-300'}`}></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center justify-center min-h-[600px] animate-fade-in">
          
          {/* Top Navigation / Branding */}
          <div className="absolute top-0 w-full flex justify-between items-center py-6">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black shadow-lg">
                  <Music size={18} />
                </div>
                <span className="font-bold tracking-tight text-lg">Chord<span className="opacity-50">Studio</span></span>
             </div>
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>

          {/* Main Showcase Content */}
          <div className="flex flex-col items-center text-center space-y-8 mt-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/5 text-xs font-semibold uppercase tracking-wider animate-slide-up">
                <Sparkles size={12} />
                <span>Featured Discovery</span>
             </div>

             <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
               <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                  {FEATURED_CHORDS[featuredIndex].displayName}
               </h1>
               <p className="text-xl md:text-2xl text-gray-500 dark:text-zinc-400 font-mono">
                  {activeChordData?.root}{activeChordData?.symbol}
               </p>
             </div>

             {/* Visual Staff Card */}
             <div className="w-full max-w-lg aspect-video bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center p-8 animate-slide-up hover:scale-[1.02] transition-transform duration-500" style={{ animationDelay: '200ms' }}>
                 <MusicStaff notes={activeChordData?.notes || []} isDarkMode={isDarkMode} />
             </div>

             {/* Description */}
             <div className="max-w-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
               <p className="text-lg leading-relaxed text-gray-700 dark:text-zinc-300">
                  {FEATURED_CHORDS[featuredIndex].description}
               </p>
               <div className="flex justify-center gap-2 mt-4">
                  {FEATURED_CHORDS[featuredIndex].tags.map(tag => (
                    <span key={tag} className="text-xs font-medium px-2 py-1 rounded border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-500">
                      {tag}
                    </span>
                  ))}
               </div>
             </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-16 flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
             <button
               onClick={handleNextFeatured}
               className="h-12 px-8 rounded-full border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-all font-medium flex items-center gap-2 group"
             >
               Next Discovery
               <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>

             <button
               onClick={() => setMode('library')}
               className="h-12 px-8 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
             >
               Enter Studio
               <ArrowRight size={16} />
             </button>
          </div>

        </div>
      </div>
    );
  }

  // --- STANDARD LAYOUT FOR OTHER MODES ---
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-72 bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
          transform transition-transform duration-300 ease-in-out overflow-y-auto no-scrollbar
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Music size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Chord<span className="text-indigo-600 dark:text-indigo-400">Studio</span>
            </h1>
          </div>

          <nav className="space-y-8">
            {/* Mode Switcher */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Modes</p>
              
              <button
                onClick={() => { setMode('showcase'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'showcase' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-zinc-700' 
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Sparkles size={18} />
                Chord Showcase
              </button>
              
              <button
                onClick={() => { setMode('library'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'library' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-zinc-700' 
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <PianoIcon size={18} />
                Chord Library
              </button>
              <button
                onClick={() => { setMode('progressions'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'progressions' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-zinc-700' 
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <BookOpen size={18} />
                Progressions
              </button>
              <button
                onClick={() => { setMode('detector'); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  mode === 'detector' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-gray-200 dark:ring-zinc-700' 
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Search size={18} />
                Smart Detector
              </button>
            </div>

            {/* Library Controls (Only visible in library mode) */}
            {mode === 'library' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-4">Root Note</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ROOT_NOTES.map(root => (
                      <button
                        key={root}
                        onClick={() => setSelectedRoot(root)}
                        className={`
                          h-10 rounded-lg text-sm font-medium transition-all border
                          ${selectedRoot === root
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700'}
                        `}
                      >
                        {root}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-4">Chord Type</p>
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
                                flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${selectedType === type.symbol
                                  ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800'
                                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'}
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
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-10 sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 lg:flex-none"></div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex flex-col items-center justify-start min-h-0">
          
          <div className="w-full max-w-5xl space-y-12">
            
            {/* Context Header (Library / Detector / Showcase) */}
            {mode !== 'progressions' && (
              <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {mode === 'library' && (
                  <>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white">
                      {activeChordData?.root || selectedRoot}
                      <span className="text-indigo-600 dark:text-indigo-400">{selectedType}</span>
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 text-lg">
                      {CHORD_TYPES.find(t => t.symbol === selectedType)?.name}
                    </p>
                  </>
                )}
                
                {mode === 'detector' && (
                  <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-6">Chord Detector</h2>
                    <div className="relative group w-full max-w-md">
                      <input
                        type="text"
                        value={detectorInput}
                        onChange={handleDetectorChange}
                        placeholder="Enter notes (e.g., C E G or C4 E4 G4)"
                        className="w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-6 pr-12 text-xl text-center focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-700"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {detectorInput ? (
                          <button
                            onClick={clearDetector}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Clear input"
                          >
                            <X size={20} />
                          </button>
                        ) : (
                          <span className="text-gray-400 pointer-events-none">
                            <Search size={20} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Piano Component */}
                    <div className="w-full mt-10 animate-in slide-in-from-bottom-6 fade-in duration-700 delay-100">
                      <div className="bg-white dark:bg-zinc-900 p-3 pb-0 rounded-t-xl rounded-b-xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-zinc-800">
                        <Piano onNotePlay={handlePianoInput} />
                        <div className="py-2 text-center">
                           <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-600 font-medium">Interactive Keyboard</p>
                        </div>
                      </div>
                    </div>

                    {!detectorResult && detectorInput && (
                      <p className="mt-4 text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/10 py-2 px-4 rounded-lg animate-pulse">
                        Chord not found. Try different notes.
                      </p>
                    )}
                    {detectorResult && (
                       <div className="mt-8 animate-in zoom-in-50 duration-300">
                         <h3 className="text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">
                          {detectorResult.root}
                          <span className="text-indigo-600 dark:text-indigo-400">{detectorResult.symbol}</span>
                         </h3>
                         <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Detected Chord</p>
                       </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Progression Explorer View */}
            {mode === 'progressions' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                <div className="mb-10 text-center">
                   <h2 className="text-3xl font-bold tracking-tight mb-2">Chord Progressions</h2>
                   <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">
                     Explore standard progressions transposed to your key of choice.
                   </p>
                   
                   {/* Key Selector Strip */}
                   <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                      {ROOT_NOTES.map(root => (
                        <button
                          key={root}
                          onClick={() => setProgressionRoot(root)}
                          className={`
                            px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                            ${progressionRoot === root
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                              : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-700'}
                          `}
                        >
                          {root}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PROGRESSIONS.map((prog, idx) => {
                    const chords = getProgressionChords(progressionRoot, prog.numerals);
                    return (
                      <div key={idx} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6 flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{prog.name}</h3>
                          <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 rounded-md">Key of {progressionRoot}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-center">
                           {chords.map((chordName, cIdx) => (
                             <div key={`${chordName}-${cIdx}`} className="flex items-center gap-3">
                                <button
                                  onClick={() => handleResolutionClick(chordName)}
                                  className="group flex flex-col items-center cursor-pointer"
                                >
                                   <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                     {chordName}
                                   </span>
                                   <span className="text-xs font-mono text-gray-400 dark:text-zinc-600 mt-1">
                                     {prog.numerals[cIdx]}
                                   </span>
                                </button>
                                {cIdx < chords.length - 1 && (
                                  <div className="w-4 h-px bg-gray-200 dark:bg-zinc-800" />
                                )}
                             </div>
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
              <div className="grid md:grid-cols-2 gap-8 items-center bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-500">
                
                {/* Visual Representation */}
                <div className="flex flex-col items-center justify-center min-h-[250px] bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
                  <MusicStaff 
                    notes={activeChordData.notes} 
                    isDarkMode={isDarkMode} 
                  />
                </div>

                {/* Theory Details */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                      <Info size={14} /> Composition
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {activeChordData.notes.map((note, idx) => (
                        <div key={idx} className="flex flex-col items-center group">
                          <span className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-lg border border-indigo-100 dark:border-indigo-500/20 group-hover:-translate-y-1 transition-transform">
                            {note.replace(/\d/, '')}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">
                            {activeChordData.intervals[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-sm text-gray-500">Intervals</span>
                      <span className="font-mono text-sm">{activeChordData.intervals.join(' - ')}</span>
                    </div>
                    {/* Resolution Section Replaces Semi-tones */}
                    <div className="flex justify-between items-start py-3 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-sm text-gray-500 mt-1">Resolves To</span>
                      <div className="flex flex-wrap justify-end gap-2 max-w-[60%]">
                        {resolutions.length > 0 ? (
                            resolutions.map((res) => (
                                <button 
                                  key={res} 
                                  onClick={() => handleResolutionClick(res)}
                                  className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
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
              <div className="text-center text-gray-400 py-20 opacity-50">
                <Music size={48} className="mx-auto mb-4" />
                <p>Start playing notes to see magic happen.</p>
              </div>
            )}
            
          </div>

          <footer className="mt-auto pt-12 text-center text-xs text-gray-400 dark:text-zinc-600 pb-2">
            <p>© {new Date().getFullYear()} Minimalist Chord Studio. Built for musicians.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;