import React from "react";
import AuthBrand from "@/components/auth/AuthBrand";
import AuthCarousel from "@/components/auth/AuthCarousel";

// Contour-line families that give the panel its topographic texture.
const CONTOUR_A = "M-90 70C20 10 130 150 240 90s160-120 260-60";
const CONTOUR_B = "M-90 130C10 200 120 60 230 120s170 130 280 70";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-[#f7fafc] font-inter">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex lg:w-[40%] flex-col justify-between overflow-hidden bg-[#17303c] px-10 py-10 xl:px-14 xl:py-12">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
          viewBox="0 0 400 800"
          preserveAspectRatio="none"
          fill="none"
        >
          {Array.from({ length: 22 }).map((_, i) => (
            <path
              key={`a-${i}`}
              d={CONTOUR_A}
              transform={`translate(0 ${i * 40 - 40})`}
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 22 }).map((_, i) => (
            <path
              key={`b-${i}`}
              d={CONTOUR_B}
              transform={`translate(0 ${i * 40})`}
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="relative">
          <AuthBrand tone="dark" />
        </div>

        <div className="relative max-w-[400px]">
          <h2 className="font-display text-[30px] xl:text-[36px] font-bold leading-[1.15] tracking-tight text-white">
            Your portfolio,{" "}
            <span className="text-[#8cc3b4]">one intelligent console.</span>
          </h2>
          <p className="mt-5 text-[13px] leading-[1.8] text-white/70">
            The operational console for the REBEL Hotel portfolio. High-precision market
            benchmarks, revenue management, P&amp;L performance, and data-driven forecasting,
            every property, one source of truth.
          </p>
        </div>

        <div className="relative">
          <AuthCarousel label="THE REBEL HOTEL PORTFOLIO" />
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto px-5 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <AuthBrand tone="light" />
          </div>

          <div className="rounded-2xl bg-white border border-[#e7ebf1] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.15)] px-7 py-8 sm:px-9 sm:py-9">
            <div className="mb-7">
              <h1 className="text-[24px] font-extrabold text-[#12293a] tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[13.5px] text-[#64748b] mt-1.5 leading-relaxed">{subtitle}</p>
              )}
            </div>

            <div className="[&_label]:text-[10.5px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-[0.1em] [&_label]:text-[#64748b]">
              {children}
            </div>
          </div>

          {footer && (
            <div className="mt-5 text-center text-[12.5px] text-[#64748b] [&_a]:text-[#2d4b5e] [&_a]:font-semibold [&_a]:hover:underline">
              {footer}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-2 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0">
          <div className="w-6 h-6 rounded-[5px] bg-[#2d4b5e] text-white text-[9px] font-bold flex items-center justify-center">
            RH
          </div>
          <span className="text-[11px] text-[#64748b]">Powered by Rebel Hotel Company</span>
        </div>
      </main>
    </div>
  );
}