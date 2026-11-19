import React from 'react';

export default function AuthBrand({ tone = 'dark' }) {
  const isDark = tone === 'dark';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`w-9 h-9 rounded-[4px] border flex items-center justify-center text-[13px] font-extrabold tracking-tight ${
          isDark ? 'border-white/85 text-white' : 'border-[#163240] text-[#163240]'
        }`}
      >
        RB
      </div>
      <div className="leading-none">
        <div
          className={`text-[13px] font-extrabold uppercase tracking-[0.16em] ${
            isDark ? 'text-white' : 'text-[#12293a]'
          }`}
        >
          Rebel
        </div>
        <div
          className={`text-[8px] font-medium uppercase tracking-[0.19em] mt-1 ${
            isDark ? 'text-white/60' : 'text-[#64748b]'
          }`}
        >
          Business Intelligence
        </div>
      </div>
    </div>
  );
}