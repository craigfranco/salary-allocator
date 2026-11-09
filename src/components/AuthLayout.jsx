import React from "react";
import AuthBrand from "@/components/auth/AuthBrand";
import AuthCarousel from "@/components/auth/AuthCarousel";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-[#f9fafb] font-inter">
      {/* Brand panel */}
      <aside
        className="hidden lg:flex flex-col justify-between w-[46%] max-w-[680px] relative overflow-hidden p-12 xl:p-14"
        style={{ backgroundColor: '#163240' }}
      >
        {/* Contour texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 42px), repeating-linear-gradient(25deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 58px)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,210,178,0.18) 0%, transparent 70%)' }}
        />

        <div className="relative">
          <AuthBrand tone="dark" />
        </div>

        <div className="relative max-w-[430px]">
          <h2 className="font-display text-[34px] leading-[1.15] font-bold text-white tracking-tight">
            Your portfolio,{' '}
            <span style={{ color: '#63d2b2' }}>one intelligent console.</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/60 mt-4">
            The operational console for the REBEL Hotel portfolio. High-precision market benchmarks,
            revenue management, P&amp;L performance, and data-driven forecasting — every property, one
            source of truth.
          </p>
        </div>

        <div className="relative">
          <AuthCarousel />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40 mt-4">
            The Rebel Hotel Portfolio
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden px-6 pt-8">
          <AuthBrand tone="light" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
          <div className="w-full max-w-[430px] bg-white rounded-2xl border border-[#e9ecf2] shadow-[0_24px_60px_-28px_rgba(22,50,64,0.35)] p-8 sm:p-10">
            <h1 className="font-display text-[30px] leading-tight font-bold tracking-tight text-[#162c3b]">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-[#65758b] mt-1.5">{subtitle}</p>}

            <div className="mt-7 [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-[0.08em] [&_label]:text-[#65758b] [&_input]:bg-[#eef4f9] [&_input]:border-[#dce6ef] [&_input]:h-11 [&_.bg-card]:bg-white">
              {children}
            </div>

            {footer && (
              <p className="text-center text-sm text-[#65758b] mt-6">{footer}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 sm:px-8 pb-6 text-[11px] text-[#65758b]">
          <div className="w-6 h-6 rounded bg-[#163240] text-white text-[9px] font-bold flex items-center justify-center">
            RH
          </div>
          Powered by Rebel Hotel Company
        </div>
      </main>
    </div>
  );
}