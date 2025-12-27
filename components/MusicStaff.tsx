import React, { useEffect, useRef } from 'react';
import Vex from 'vexflow';

interface MusicStaffProps {
  notes: string[]; // e.g., ["C4", "E4", "G#4"]
  clef?: 'treble' | 'bass';
  isDarkMode: boolean;
}

const MusicStaff: React.FC<MusicStaffProps> = ({ notes, clef = 'treble', isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Safety check for VexFlow
    if (!Vex || !Vex.Flow) {
      console.error("VexFlow not loaded correctly");
      return;
    }

    // Clear previous render
    containerRef.current.innerHTML = '';
    
    // Safety check for empty notes
    if (notes.length === 0) return;

    try {
      const { Factory } = Vex.Flow;
      
      // Create a VexFlow renderer attached to the DIV
      const vf = new Factory({
        renderer: { elementId: containerRef.current, width: 300, height: 200 },
      });

      const context = vf.getContext();
      
      // Set styles based on theme
      const primaryColor = isDarkMode ? '#e4e4e7' : '#27272a'; // zinc-200 : zinc-800
      context.setFont('Inter', 10);
      context.setFillStyle(primaryColor);
      context.setStrokeStyle(primaryColor);

      // Create a stave
      const stave = vf.Stave({ x: 10, y: 40, width: 280 });
      stave.addClef(clef);
      
      stave.setContext(context).draw();

      // Map string notes to VexFlow keys
      // Tonal: "C#4" -> VexFlow: "c#/4"
      const keys = notes.map(n => {
        const match = n.match(/^([A-Ga-g])(#|b)?(\d+)$/);
        if (!match) return 'c/4'; // Fallback
        const [, step, acc, oct] = match;
        return `${step.toLowerCase()}${acc || ''}/${oct}`;
      });

      // Create a StaveNote
      const staveNote = new Vex.Flow.StaveNote({
        keys: keys,
        duration: 'w',
        align_center: true,
      });

      // Add accidentals
      // Fixed Bug: Previously checked key.includes('b'), which caused B natural (key: 'b/4') to get a flat.
      // Now checking the original note string which uses uppercase note names (e.g. "B4" vs "Bb4").
      notes.forEach((note, index) => {
        if (note.includes('#')) {
          staveNote.addModifier(new Vex.Flow.Accidental('#'), index);
        } else if (note.includes('b')) {
          staveNote.addModifier(new Vex.Flow.Accidental('b'), index);
        }
      });

      // Style the notes
      staveNote.setStyle({ fillStyle: primaryColor, strokeStyle: primaryColor });

      // Create a voice and add the note
      const voice = vf.Voice().setStrict(false);
      voice.addTickables([staveNote]);

      // Format and draw
      new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 200);
      voice.draw(context, stave);
    } catch (e) {
      console.error("Error rendering staff:", e);
    }

  }, [notes, clef, isDarkMode]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center items-center transition-opacity duration-500 ease-in-out"
    />
  );
};

export default MusicStaff;