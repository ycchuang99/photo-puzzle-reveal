import React from 'react';
import { GridSection } from '../types';
import { Heart, Image as ImageIcon } from 'lucide-react';

interface PuzzleGridProps {
  sections: GridSection[];
  gridSize: number;
  imageUrl: string | null;
  isComplete: boolean;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({ sections, gridSize, imageUrl, isComplete }) => {
  // If no image is uploaded, show a placeholder box
  if (!imageUrl && sections.length === 0) {
    return (
      <div className="w-[300px] h-[300px] bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <span className="font-serif">Waiting for photo...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
      {/* 
        The Base Image:
        We render the full image to dictate the natural size and aspect ratio of the container.
        The max-w-[85vw] ensures it fits on mobile screens without scrolling.
      */}
      <img 
        src={imageUrl || ''} 
        alt="Wedding Memory" 
        className="block w-auto h-auto max-w-[85vw] max-h-[70vh] object-contain"
      />

      {/* 
        The Grid Overlay:
        This sits exactly on top of the image. 
        It is divided into the grid cells. Each cell acts as a "cover".
      */}
      <div 
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {sections.map((section) => (
          <div 
            key={section.id} 
            className={`
              relative flex items-center justify-center transition-all duration-1000 ease-in-out
              ${section.isUnlocked 
                ? 'opacity-0' // Invisible when unlocked, revealing the image below
                : 'bg-stone-200/90 backdrop-blur-sm border-r border-b border-stone-300/20' // Blurred mask when locked
              }
            `}
          >
            {/* Locked Icon */}
            {!section.isUnlocked && (
              <Heart className="w-6 h-6 text-rose-300 opacity-50 animate-pulse" fill="currentColor" />
            )}
          </div>
        ))}
      </div>

      {/* Shine effect on completion */}
      {isComplete && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-pulse pointer-events-none mix-blend-overlay" />
      )}
    </div>
  );
};