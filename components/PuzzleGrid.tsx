import React from 'react';
import { GridSection } from '../types';
import { Heart } from 'lucide-react';

interface PuzzleGridProps {
  sections: GridSection[];
  gridSize: number;
  imageUrl: string | null;
  isComplete: boolean;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({ sections, gridSize, imageUrl, isComplete }) => {
  // Default placeholder if no image uploaded yet
  const displayImage = imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <div 
      className="relative bg-stone-100 overflow-hidden shadow-inner border border-stone-200"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        width: 'min(80vw, 400px)',
        height: 'min(80vw, 400px)',
      }}
    >
      {/* Empty State */}
      {sections.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center text-stone-400">
            <span className="font-script text-2xl">Waiting for setup...</span>
         </div>
      )}

      {sections.map((section) => (
        <div 
          key={section.id} 
          className="relative overflow-hidden border border-white/50"
        >
          <div
            className={`absolute transition-all duration-1000 ease-in-out ${
              section.isUnlocked ? 'filter-none opacity-100 scale-100' : 'blur-lg opacity-40 scale-110 grayscale'
            }`}
            style={{
              width: `${gridSize * 100}%`,
              height: `${gridSize * 100}%`,
              top: `-${section.row * 100}%`,
              left: `-${section.col * 100}%`,
              backgroundImage: `url(${displayImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Locked Overlay */}
          {!section.isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100/30 z-10">
              <Heart className="w-4 h-4 text-rose-300 opacity-60" fill="currentColor" />
            </div>
          )}
        </div>
      ))}

      {/* Shine effect on completion */}
      {isComplete && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-pulse pointer-events-none" />
      )}
    </div>
  );
};
