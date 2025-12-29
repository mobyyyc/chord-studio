import React from 'react';

interface GuitarFretboardProps {
  chordName: string; // e.g., "C Major"
  voicing: number[]; // Array of 6 numbers. -1 = mute, 0 = open, >0 = fret
  isDarkMode: boolean;
}

const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ chordName, voicing, isDarkMode }) => {
  // Config
  const numStrings = 6;
  const numFrets = 5; // Standard chord box height
  const width = 200;
  const height = 240;
  const paddingX = 40;
  const paddingY = 40;
  
  // Calculate string spacing
  const stringSpacing = (width - 2 * paddingX) / (numStrings - 1);
  const fretSpacing = (height - 2 * paddingY) / numFrets;

  const primaryColor = isDarkMode ? '#e4e4e7' : '#27272a';
  const secondaryColor = isDarkMode ? '#52525b' : '#a1a1aa';
  const dotColor = isDarkMode ? '#a5b4fc' : '#4f46e5'; // Indigo-ish

  // Determine standard offset. 
  // If the lowest played fret is > 4, we need to shift the view (e.g., for barre chords at 8th fret).
  // Ignore 0 (open) and -1 (mute) when calculating min.
  const frets = voicing.filter(f => f > 0);
  const minFret = frets.length > 0 ? Math.min(...frets) : 0;
  const maxFret = frets.length > 0 ? Math.max(...frets) : 0;
  
  // Base fret is the starting number displayed on the left.
  // Usually 1, unless we are high up the neck.
  let baseFret = 1;
  if (minFret > 2) {
    baseFret = minFret;
  }

  return (
    <div className="flex flex-col items-center justify-center opacity-0 animate-fade-in animation-delay-100">
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Chord Name */}
        <text 
          x={width / 2} 
          y={20} 
          textAnchor="middle" 
          fill={primaryColor} 
          fontSize="16" 
          fontWeight="600"
          fontFamily="Inter, sans-serif"
        >
          {chordName}
        </text>

        {/* Fretboard Group */}
        <g transform={`translate(0, ${paddingY})`}>
          
          {/* Nut (Only draw thick line if we are at fret 1) */}
          {baseFret === 1 && (
            <line 
              x1={paddingX} 
              y1={0} 
              x2={width - paddingX} 
              y2={0} 
              stroke={primaryColor} 
              strokeWidth="4" 
            />
          )}

          {/* Frets (Horizontal Lines) */}
          {Array.from({ length: numFrets + 1 }).map((_, i) => (
            <line
              key={`fret-${i}`}
              x1={paddingX}
              y1={i * fretSpacing}
              x2={width - paddingX}
              y2={i * fretSpacing}
              stroke={primaryColor}
              strokeWidth={baseFret === 1 && i === 0 ? 0 : 1} // Skip 0 if nut is drawn
              opacity={baseFret === 1 && i === 0 ? 0 : 1}
            />
          ))}

          {/* Strings (Vertical Lines) */}
          {Array.from({ length: numStrings }).map((_, i) => (
            <line
              key={`string-${i}`}
              x1={paddingX + i * stringSpacing}
              y1={0}
              x2={paddingX + i * stringSpacing}
              y2={numFrets * fretSpacing}
              stroke={primaryColor}
              strokeWidth={1 + (i * 0.2)} // Make lower strings slightly thicker visually
            />
          ))}

          {/* Dots and Markers */}
          {voicing.map((fret, stringIndex) => {
            const visualStringIndex = stringIndex; // 0 is Low E (Left) in diagrams usually
            const cx = paddingX + visualStringIndex * stringSpacing;

            // Handle Mute (x)
            if (fret === -1) {
              const size = 6;
              return (
                <g key={`mute-${stringIndex}`}>
                  <line x1={cx - size} y1={-15 - size} x2={cx + size} y2={-15 + size} stroke={secondaryColor} strokeWidth="2" />
                  <line x1={cx + size} y1={-15 - size} x2={cx - size} y2={-15 + size} stroke={secondaryColor} strokeWidth="2" />
                </g>
              );
            }

            // Handle Open (O)
            if (fret === 0) {
              return (
                <circle 
                  key={`open-${stringIndex}`}
                  cx={cx} 
                  cy={-15} 
                  r="5" 
                  stroke={secondaryColor} 
                  strokeWidth="2" 
                  fill="none" 
                />
              );
            }

            // Handle Fretted Note
            // Calculate relative position based on baseFret
            const relativeFret = fret - baseFret + 1;
            
            // Only draw if within view
            if (relativeFret > 0 && relativeFret <= numFrets) {
               const cy = (relativeFret * fretSpacing) - (fretSpacing / 2);
               return (
                 <circle
                   key={`note-${stringIndex}`}
                   cx={cx}
                   cy={cy}
                   r={stringSpacing * 0.35}
                   fill={dotColor}
                 />
               );
            }
            return null;
          })}

          {/* Fret Label (e.g., '3fr') */}
          {baseFret > 1 && (
            <text 
              x={paddingX - 15} 
              y={fretSpacing / 2 + 4} 
              textAnchor="end" 
              fill={secondaryColor} 
              fontSize="12" 
              fontFamily="Inter, sans-serif"
              fontWeight="bold"
            >
              {baseFret}fr
            </text>
          )}

        </g>
      </svg>
    </div>
  );
};

export default GuitarFretboard;