import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    src: 'https://media.base44.com/images/public/69fe195adbdd18b7b19462a0/7b7dfab18_generated_image.png',
    alt: 'Rooftop bar terrace overlooking the city skyline at sunset',
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
    <div>
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
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 text-white/80 hover:text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 text-white/80 hover:text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {label && (
        <div className="mt-3 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/70">
          {label}
        </div>
      )}
    </div>
  );
}