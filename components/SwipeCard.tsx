
import React, { useState } from 'react';
import { PetName } from '../types';

interface SwipeCardProps {
  petName: PetName;
  onSwipe: (direction: 'left' | 'right') => void;
  index: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ petName, onSwipe, index }) => {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(x);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStart === null) return;
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setOffsetX(x - dragStart);
  };

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      onSwipe(offsetX > 0 ? 'right' : 'left');
    }
    setDragStart(null);
    setOffsetX(0);
  };

  const rotation = offsetX / 10;
  const opacity = Math.max(1 - Math.abs(offsetX) / 500, 0.5);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 100 - index }}
    >
      <div
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="swipe-card w-full max-w-sm h-[400px] bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-between cursor-grab active:cursor-grabbing border-4 border-pink-100 pointer-events-auto select-none"
        style={{
          transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          opacity: opacity,
        }}
      >
        <div className="text-center">
          <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 mx-auto">
            <span className="text-5xl">🐾</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">{petName.name}</h2>
          <p className="text-gray-500 italic mb-4">"{petName.meaning}"</p>
          <div className="flex flex-wrap justify-center gap-2">
            {petName.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full flex justify-between px-4">
          <div className={`text-red-500 font-bold text-2xl border-4 border-red-500 rounded px-2 uppercase transition-opacity ${offsetX < -50 ? 'opacity-100' : 'opacity-0'}`}>
            No
          </div>
          <div className={`text-green-500 font-bold text-2xl border-4 border-green-500 rounded px-2 uppercase transition-opacity ${offsetX > 50 ? 'opacity-100' : 'opacity-0'}`}>
            Sí
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
