import React from "react";
import AuthBrand from "@/components/auth/AuthBrand";
import AuthCarousel from "@/components/auth/AuthCarousel";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-[#f7fafc] font-inter">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex lg:w-[42%] flex-col justify-between overflow-hidden bg-[#11232d] px-10 py-10 xl:px-14 xl:py-12">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          viewBox="0 0 400 800"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M-60 120C40 60 120 200 220 140s150-120 240-60" stroke="#ffffff" strokeWidth="1" />
          <path d="M-60 260C40 200 130 340 230 280s150-120 250-70" stroke="#ffffff" strokeWidth="1" />
          <path d="M-60 420C50 350 130 500 240 430s150-130 250-80" stroke="#ffffff" strokeWidth="1" />
          <path d="M-60 600C50 540 140 690 250 620s150-130 250-90" stroke="#ffffff" strokeWidth="1" />
        </svg>

        <div className="relative">
          <AuthBrand tone="dark" />
        </div>

        <div className="relative max-w-[440px]">
          <h2 className="font-display text-[32px] xl:text-[38px] font-bold leading-[1.15] tracking-tight text-white">
            Your portfolio,{" "}
            <span className="text-[#7fc6b0]">one intelligent console.</span>
          </h2>
          <p className="mt-5 text-[13.5px] leading-relaxed text-white/75">
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