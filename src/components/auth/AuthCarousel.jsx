import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80',
    alt: 'Hotel bar with globe pendant lighting',
  },
  {
    src: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80',
    alt: 'Hotel lobby lounge seating',
  },
  {
    src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80',
    alt: 'Hotel suite interior',
  },
];

export default function AuthCarousel({ label }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const go = (delta) => setIndex(i => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-black/30">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {label && (
        <div className="absolute bottom-3 left-3 text-[9px] font-semibold tracking-[0.18em] text-white/85">
          {label}
        </div>
      )}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}