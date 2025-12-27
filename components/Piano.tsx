import React from 'react';

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

interface PianoProps {
  onNotePlay: (note: string) => void;
}

const Piano: React.FC<PianoProps> = ({ onNotePlay }) => {
  const startOctave = 3;
  const octaves = 2;
  const numWhiteKeys = 7 * octaves;

  // Generate White Keys
  const whiteKeys = [];
  for (let o = 0; o < octaves; o++) {
    for (let i = 0; i < WHITE_KEYS.length; i++) {
      const noteName = `${WHITE_KEYS[i]}${startOctave + o}`;
      whiteKeys.push({
        note: noteName,
        label: WHITE_KEYS[i], // Just the letter
        index: (o * 7) + i,
        isC: WHITE_KEYS[i] === 'C'
      });
    }
  }

  // Generate Black Keys
  const blackKeyIndices = [0, 1, 3, 4, 5];
  const blackKeys = [];
  for (let o = 0; o < octaves; o++) {
    for (let i = 0; i < blackKeyIndices.length; i++) {
        const whiteIndex = blackKeyIndices[i];
        const noteName = BLACK_KEYS[i];
        blackKeys.push({
            note: `${noteName}${startOctave + o}`,
            position: (o * 7) + whiteIndex
        });
    }
  }

  return (
    <div className="relative h-32 sm:h-40 w-full select-none">
        {/* White Keys Container */}
        <div className="flex h-full shadow-sm rounded-b-lg overflow-hidden">
            {whiteKeys.map((k) => (
                <button
                    key={k.note}
                    onClick={() => onNotePlay(k.note)}
                    className={`
                        relative flex-1 h-full
                        border-r last:border-r-0 
                        transition-colors duration-100 ease-out
                        outline-none z-0
                        group
                        ${ /* Light Mode */ 'bg-white border-gray-200 hover:bg-gray-50 active:bg-gray-100' }
                        ${ /* Dark Mode - Improved Contrast */ 'dark:bg-zinc-200 dark:border-zinc-300 dark:hover:bg-zinc-100 dark:active:bg-zinc-300' }
                    `}
                    aria-label={`Play ${k.note}`}
                >
                    {/* Note Label - Always visible for C, otherwise hover */}
                    <span 
                      className={`
                        absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-tighter
                        transition-opacity duration-200
                        ${k.isC ? 'opacity-50 text-indigo-600 dark:text-indigo-800' : 'opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500'}
                      `}
                    >
                      {k.note}
                    </span>
                </button>
            ))}
        </div>

        {/* Black Keys Container */}
        {blackKeys.map((k) => {
             const widthPercent = (100 / numWhiteKeys) * 0.7; 
             const whiteKeyWidth = 100 / numWhiteKeys;
             const leftPercent = ((k.position + 1) * whiteKeyWidth) - (widthPercent / 2);

             return (
                <button
                    key={k.note}
                    onClick={() => onNotePlay(k.note)}
                    style={{
                        width: `${widthPercent}%`,
                        left: `${leftPercent}%`,
                        height: '60%'
                    }}
                    className={`
                        absolute top-0
                        rounded-b-[2px] sm:rounded-b-sm
                        transition-all duration-100 ease-out
                        z-10 shadow-md
                        border-b-[3px] border-b-transparent active:border-b-0 active:h-[59%]
                        ${ /* Light Mode */ 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900' }
                        ${ /* Dark Mode */ 'dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-black' }
                    `}
                    aria-label={`Play ${k.note}`}
                />
             )
        })}
    </div>
  );
};

export default Piano;
