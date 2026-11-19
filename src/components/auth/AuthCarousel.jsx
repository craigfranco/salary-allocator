import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  { src: 'https://rebelhotelcompany.com/assets/img/hero-hudson-vu.jpg', alt: 'Hudson VU rooftop above the Manhattan skyline' },
  { src: 'https://rebelhotelcompany.com/assets/img/hero-smyth-bar.jpg', alt: 'Low-lit bar with globe pendants at Smyth Tribeca' },
  { src: 'https://rebelhotelcompany.com/assets/img/hero-hilton-capitol-hill.jpg', alt: 'Hilton Washington DC Capitol Hill with the U.S. Capitol dome beyond' },
  { src: 'https://rebelhotelcompany.com/assets/img/hero-el-encanto.jpg', alt: 'Gardens and cottages in late afternoon light' },
  { src: 'https://rebelhotelcompany.com/assets/img/hero-hilton-del-mar.jpg', alt: 'Gardens at Hilton San Diego/Del Mar' },
];

export default function AuthCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(timer);
  }, [paused]);
  const go = (delta) => setIndex(i => (i + delta + SLIDES.length) % SLIDES.length);
  const control = 'absolute bottom-3 w-8 h-8 rounded-full bg-auth-overlay/35 hover:bg-auth-overlay/60 backdrop-blur-sm text-primary-foreground flex items-center justify-center transition-all duration-300';
  return (
    <div className="relative overflow-hidden ring-1 ring-primary-foreground/10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {SLIDES.map((slide, i) => (
        <img key={slide.src} src={slide.src} alt={slide.alt} aria-hidden={i !== index}
          className={`absolute inset-0 w-full h-[240px] xl:h-[280px] object-cover transition-all [transition-duration:1500ms] ease-out ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.06]'}`} />
      ))}
      <div className="relative h-[240px] xl:h-[280px]" />
      <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${control} left-3`}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${control} right-3`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}