import React from "react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex bg-[#f7fafc] font-inter">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 flex items-center justify-center overflow-y-auto px-5 py-10">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl bg-white border border-[#e7ebf1] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.15)] px-7 py-8 sm:px-9 sm:py-9">
              <div className="mb-7">
                <h1 className="text-[24px] font-extrabold text-[#12293a] tracking-tight leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[13.5px] text-[#64748b] mt-1.5 leading-relaxed">{subtitle}</p>
                )}
              </div>

              <div className="[&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-[0.08em] [&_label]:text-[#64748b]">
                {children}
              </div>
            </div>

            {footer && (
              <div className="mt-5 text-center text-[12.5px] text-[#64748b] [&_a]:text-[#2d4b5e] [&_a]:font-semibold [&_a]:hover:underline">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}