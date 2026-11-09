import React from 'react';

export default function AuthBrand({ tone = 'dark' }) {
  const isDark = tone === 'dark';
  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`w-10 h-10 rounded-md border-2 flex items-center justify-center font-display font-bold text-sm ${
          isDark ? 'border-white/80 text-white' : 'border-[#163240] text-[#163240]'
        }`}
      >
        RB
      </div>
      <div className="leading-tight">
        <div className={`font-display font-bold tracking-[0.2em] text-sm ${isDark ? 'text-white' : 'text-[#163240]'}`}>
          REBEL
        </div>
        <div className={`text-[9px] tracking-[0.22em] mt-0.5 ${isDark ? 'text-white/55' : 'text-[#65758b]'}`}>
          BUSINESS INTELLIGENCE
        </div>
      </div>
    </div>
  );
}