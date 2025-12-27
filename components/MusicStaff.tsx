import React, { useEffect, useRef, useState } from 'react';
import Vex from 'vexflow';

interface MusicStaffProps {
  notes: string[]; // e.g., ["C4", "E4", "G#4"]
  clef?: 'treble' | 'bass';
  isDarkMode: boolean;
}

const MusicStaff: React.FC<MusicStaffProps> = ({ notes, clef = 'treble', isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 220 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height > 100 ? entry.contentRect.height : 220
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !Vex.Flow) return;

    // Clear previous render
    containerRef.current.innerHTML = '';
    
    // Safety check
    if (!notes || notes.length === 0) return;

    try {
      const { Factory } = Vex.Flow;
      
      const vf = new Factory({
        renderer: { 
          elementId: containerRef.current, 
          width: dimensions.width, 
          height: dimensions.height 
        },
      });

      const context = vf.getContext();
      
      // Style based on theme (Zinc-200 for dark, Zinc-800 for light)
      const primaryColor = isDarkMode ? '#e4e4e7' : '#27272a';
      context.setFont('Inter', 10);
      context.setFillStyle(primaryColor);
      context.setStrokeStyle(primaryColor);

      // Center the stave
      // Use dimensions.width but cap max width for aesthetics
      // Ensure we leave padding on small screens
      const padding = 10;
      const maxStaveWidth = 350;
      const availableWidth = Math.max(dimensions.width - (padding * 2), 100);
      const staveWidth = Math.min(availableWidth, maxStaveWidth);
      
      const staveX = (dimensions.width - staveWidth) / 2;
      
      // Vertical Centering: Stave is approx 100-120px tall including notes
      const staveY = Math.max((dimensions.height - 120) / 2, 20);

      // Standardize position for block chords
      const stave = vf.Stave({ x: staveX, y: staveY, width: staveWidth });
      stave.addClef(clef);
      stave.setContext(context).draw();

      // Convert notes to VexFlow format
      const keys = notes.map(n => {
        // Match Note + Accidental (optional) + Octave
        const match = n.match(/^([A-Ga-g])(#{1,2}|b{1,2})?(\d+)$/);
        if (!match) return 'c/4'; // Fallback
        const [, step, acc, oct] = match;
        return `${step.toLowerCase()}${acc || ''}/${oct}`;
      });

      const staveNote = new Vex.Flow.StaveNote({
        keys: keys,
        duration: 'w',
        align_center: true,
      });

      // Add modifiers (accidentals)
      notes.forEach((n, i) => {
         const match = n.match(/^([A-Ga-g])(#{1,2}|b{1,2})?(\d+)$/);
         if (match && match[2]) {
           staveNote.addModifier(new Vex.Flow.Accidental(match[2]), i);
         }
      });

      staveNote.setStyle({ fillStyle: primaryColor, strokeStyle: primaryColor });

      const voice = vf.Voice().setStrict(false);
      voice.addTickables([staveNote]);

      // Format and draw
      new Vex.Flow.Formatter().joinVoices([voice]).format([voice], staveWidth - 20);
      voice.draw(context, stave);

    } catch (e) {
      console.error("VexFlow Render Error:", e);
    }

  }, [notes, clef, isDarkMode, dimensions]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex justify-center items-center opacity-0 animate-fade-in"
      style={{ animationDelay: '100ms' }}
    />
  );
};

export default MusicStaff;