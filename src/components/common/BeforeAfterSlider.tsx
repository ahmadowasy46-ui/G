import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Columns, Split, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface BeforeAfterSliderProps {
  originalImage: string;
  resultImage: string;
  originalLabel?: string;
  resultLabel?: string;
  className?: string;
  aspectRatio?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImage,
  resultImage,
  originalLabel = 'Original',
  resultLabel = 'Luna Nova Edit',
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'peek'>('slider');
  const [isPeekingOriginal, setIsPeekingOriginal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div className={`relative flex flex-col items-center select-none ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950/95 p-6 backdrop-blur-xl' : 'w-full'} ${className}`}>
      {/* Top Toolbar / Mode Switcher */}
      <div className="w-full flex items-center justify-between mb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'slider' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'side-by-side' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            type="button"
            onMouseDown={() => setIsPeekingOriginal(true)}
            onMouseUp={() => setIsPeekingOriginal(false)}
            onTouchStart={() => setIsPeekingOriginal(true)}
            onTouchEnd={() => setIsPeekingOriginal(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              isPeekingOriginal ? 'bg-indigo-600 text-white' : 'hover:text-slate-200'
            }`}
            title="Press and hold to peek original"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hold for Original</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Preview Container */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-h-[70vh]">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 flex items-center justify-center">
            <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-slate-950/80 backdrop-blur border border-slate-700/60 rounded-md text-slate-300">
              {originalLabel}
            </span>
            <img src={originalImage} alt={originalLabel} className="max-h-[60vh] w-auto object-contain" />
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-900/60 flex items-center justify-center ring-1 ring-indigo-500/20">
            <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-950/80 backdrop-blur border border-indigo-700/60 rounded-md text-indigo-300">
              {resultLabel}
            </span>
            <img src={resultImage} alt={resultLabel} className="max-h-[60vh] w-auto object-contain" />
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          className="relative w-full max-w-4xl max-h-[70vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl cursor-ew-resize select-none flex items-center justify-center"
          style={{ minHeight: '380px' }}
        >
          {/* Base: Result (Edited) Image */}
          <img
            src={isPeekingOriginal ? originalImage : resultImage}
            alt={resultLabel}
            className="w-full h-full object-contain pointer-events-none max-h-[68vh]"
          />

          {/* Overlay: Original Image clipped to sliderPosition (only if not peeking) */}
          {!isPeekingOriginal && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={originalImage}
                alt={originalLabel}
                className="w-full h-full object-contain pointer-events-none max-h-[68vh]"
              />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 pointer-events-none z-10">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-slate-950/80 backdrop-blur border border-slate-700/60 rounded-md text-slate-300 shadow">
              {originalLabel}
            </span>
          </div>
          <div className="absolute top-3 right-3 pointer-events-none z-10">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-950/80 backdrop-blur border border-indigo-600/60 rounded-md text-indigo-300 shadow">
              {resultLabel}
            </span>
          </div>

          {/* Divider Line & Handle (only in slider mode) */}
          {!isPeekingOriginal && (
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute inset-y-0 -left-px w-0.5 bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border-2 border-indigo-600">
                <Split className="w-4 h-4 text-slate-900" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helper caption */}
      <p className="mt-2 text-[11px] text-slate-500 text-center">
        {viewMode === 'slider'
          ? 'Drag slider horizontally or tap anywhere to inspect pixel changes'
          : 'Interactive before & after comparison'}
      </p>
    </div>
  );
};
