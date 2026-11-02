import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [autoSway, setAutoSway] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-sway animation when idle so users immediately see the transformation
  useEffect(() => {
    if (!autoSway || isDragging) return;
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.035;
      const pos = 50 + Math.sin(angle) * 22;
      setSliderPosition(pos);
    }, 30);
    return () => clearInterval(interval);
  }, [autoSway, isDragging]);

  const handleMove = (clientX: number) => {
    setAutoSway(false);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const stopDragging = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchend', stopDragging);
    } else {
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
    }
    return () => {
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl cursor-ew-resize select-none border border-border group shadow-sm hover:shadow-hover transition-shadow"
      ref={containerRef}
      onMouseEnter={() => setAutoSway(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => { setAutoSway(false); setIsDragging(true); handleMove(e.clientX); }}
      onTouchStart={(e) => { setAutoSway(false); setIsDragging(true); handleMove(e.touches[0].clientX); }}
    >
      <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div 
        className="absolute inset-0 w-full h-full object-cover border-r-2 border-white/80" 
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      
      {/* Slider handle with glowing ring */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(34,197,94,0.6)] z-10 flex items-center justify-center transform -translate-x-1/2"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-9 h-9 bg-surface/95 backdrop-blur-md rounded-full shadow-lg border-2 border-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
          <div className="flex items-center space-x-1">
            <div className="w-1 h-3 bg-brand-500 rounded-full"></div>
            <div className="w-1 h-3 bg-brand-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-ink/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs">
        BEFORE
      </div>
      <div className="absolute top-4 right-4 bg-brand-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center">
        AFTER CLEANUP
      </div>
    </div>
  );
}
